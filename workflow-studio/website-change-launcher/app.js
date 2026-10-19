import { DEFAULT_WORKFLOW, INITIAL_INSTRUCTIONS, composePrompt } from "./logic.mjs?v=auto-run-1";

const $ = selector => document.querySelector(selector);
const STORAGE_KEY = "workflow-studio.gsc-test.v1";
const ACTIVE_CHAT_KEY = "workflow-studio.active-chat.v1";
const LOCAL_BASE = "http://127.0.0.1:4177/api/hosted";
let workflow = { ...DEFAULT_WORKFLOW };
let draft = INITIAL_INSTRUCTIONS;
let activeSession = null;
let chats = [];
let refreshingChat = false;
let renderedMessages = "";
let pendingAutoOpenId = null;
const openedChats = new Set();

try {
  const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
  if (saved?.workflow) workflow = { ...DEFAULT_WORKFLOW, ...saved.workflow };
  if (typeof saved?.draft === "string") draft = saved.draft;
} catch {
  // The Codex link still works if browser storage is unavailable.
}

function save() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ workflow, draft })); }
  catch { showToast("Browser storage is unavailable. Edits will last until this page closes."); }
}

function showToast(message) {
  const element = $("#toast");
  element.textContent = message;
  element.classList.add("show");
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => element.classList.remove("show"), 6000);
}

function updateLink() {
  draft = $("#instructions").value;
  let preview = "Add instructions above to preview the complete prompt.";
  try {
    const prompt = composePrompt(workflow.template, draft);
    preview = prompt;
  } catch {}
  $("#prompt-preview").textContent = preview;
}

function render() {
  $("#nav-name").textContent = workflow.name;
  $("#crumb-name").textContent = workflow.name;
  $("#description").textContent = workflow.description;
  $("#workspace-display").textContent = workflow.path || "Choose in Codex";
  $("#instructions").value = draft;
  updateLink();
}

async function hostedApi(path, options = {}) {
  const response = await fetch(`${LOCAL_BASE}${path}`, {
    ...options,
    headers: {
      ...(options.body ? { "content-type": "application/json", "x-workflow-studio": "run" } : {}),
      ...options.headers
    }
  });
  const data = await response.json();
  if (!response.ok) {
    const error = new Error(data.error || "Could not reach the local review service.");
    error.status = response.status;
    throw error;
  }
  return data;
}

function renderChatList() {
  const list = $("#chat-list");
  list.replaceChildren();
  if (!chats.length) {
    const empty = document.createElement("span");
    empty.className = "chat-list-empty";
    empty.textContent = "Chats opened from this page appear here.";
    list.append(empty);
    return;
  }
  for (const chat of chats) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = chat.id === activeSession?.id ? "active" : "";
    const title = document.createElement("strong");
    title.textContent = chat.title.replace(/\s+/g, " ").trim();
    const detail = document.createElement("small");
    detail.textContent = `${new Date(chat.createdAt).toLocaleString(undefined, { month: "short", day: "numeric", minute: "2-digit" })} · ${chat.status === "running" ? "working" : "in Codex"}`;
    button.append(title, detail);
    button.addEventListener("click", () => {
      selectChat({ id: chat.id, status: "connecting", mode: "desktop", messages: [] });
      void refreshChat();
    });
    list.append(button);
  }
}

function renderChat(session) {
  const changedChat = activeSession?.id !== session.id;
  activeSession = session;
  $("#start-card").hidden = true;
  $("#prompt-preview-card").hidden = true;
  $("#chat-card").hidden = false;
  $("#chat-status").textContent = session.status === "offline" ? "Review offline"
    : session.status === "running" ? "Codex working"
      : session.autoOpen && !session.desktopReady ? "Opening Codex soon"
        : session.status === "workingInCodex" ? "Codex working" : "In Codex";
  $("#chat-help").textContent = session.status === "offline"
    ? "Start the local review service to refresh this read-only copy. Continue in Codex."
    : session.status === "running"
    ? "The first instruction is running. Codex desktop will open when the chat is ready for follow-ups."
    : session.autoOpen && !session.desktopReady
      ? "Finishing the first turn and releasing this chat to Codex desktop."
      : "Continue in Codex desktop. This page shows a read-only copy of the conversation.";
  const link = $("#chat-desktop-link");
  link.hidden = !session.threadId || (session.autoOpen && !session.desktopReady);
  if (session.threadId) link.href = `codex://threads/${encodeURIComponent(session.threadId)}`;
  $("#chat-error").hidden = !session.error;
  $("#chat-error").textContent = session.error || "";

  const messages = $("#chat-messages");
  const signature = JSON.stringify(session.messages || []);
  if (changedChat || signature !== renderedMessages) {
    const nearBottom = changedChat || messages.scrollHeight - messages.scrollTop - messages.clientHeight < 90;
    messages.replaceChildren();
    for (const message of session.messages || []) {
      if (!message.text) continue;
      const item = document.createElement("article");
      item.className = `chat-message ${message.role === "user" ? "user" : "assistant"}`;
      const who = document.createElement("div");
      who.className = "who";
      who.textContent = message.role === "user" ? "You" : "Codex";
      const text = document.createElement("div");
      text.className = "text";
      text.textContent = message.text;
      item.append(who, text);
      messages.append(item);
    }
    if (!messages.childElementCount) {
      const empty = document.createElement("p");
      empty.className = "chat-empty";
      empty.textContent = session.status === "running" ? "Codex is starting…" : "No messages to show yet.";
      messages.append(empty);
    }
    renderedMessages = signature;
    if (nearBottom) messages.scrollTop = messages.scrollHeight;
  }
  if (changedChat) renderChatList();
  if (session.id === pendingAutoOpenId && session.desktopReady && session.threadId && !openedChats.has(session.id)) {
    openedChats.add(session.id);
    pendingAutoOpenId = null;
    window.location.href = link.href;
  }
}

function selectChat(session) {
  try { localStorage.setItem(ACTIVE_CHAT_KEY, session.id); } catch {}
  renderChat(session);
}

function showStart() {
  activeSession = null;
  renderedMessages = "";
  $("#chat-card").hidden = true;
  $("#start-card").hidden = false;
  $("#prompt-preview-card").hidden = false;
  renderChatList();
}

async function loadChats() {
  try {
    const data = await hostedApi("/sessions");
    chats = data.sessions;
    $("#runner-status").textContent = " Local review connected";
    renderChatList();
  } catch {
    $("#runner-status").textContent = " Start local review service for chat history";
  }
}

async function refreshChat() {
  if (!activeSession || refreshingChat) return;
  const id = activeSession.id;
  refreshingChat = true;
  try {
    const data = await hostedApi(`/sessions/${encodeURIComponent(id)}`);
    if (activeSession?.id === id) renderChat(data.session);
  } catch (error) {
    if (activeSession?.id !== id) return;
    if (error.status === 404) {
      try { localStorage.removeItem(ACTIVE_CHAT_KEY); } catch {}
      showStart();
      showToast("This chat is no longer in the local review service.");
    } else {
      renderChat({ ...activeSession, status: "offline" });
    }
  } finally {
    refreshingChat = false;
  }
}

$("#instructions").addEventListener("input", () => { updateLink(); save(); });

$("#run-now").addEventListener("click", async () => {
  let prompt;
  try { prompt = composePrompt(workflow.template, $("#instructions").value); }
  catch (error) {
    $("#instructions").focus();
    return showToast(error.message);
  }
  save();
  const button = $("#run-now");
  button.disabled = true;
  button.textContent = "Starting Codex…";
  try {
    const result = await hostedApi("/runs", {
      method: "POST", body: JSON.stringify({ prompt, path: workflow.path })
    });
    pendingAutoOpenId = result.session.id;
    selectChat(result.session);
    void loadChats();
    void refreshChat();
  } catch (error) {
    showToast(error instanceof TypeError
      ? "Start the local Workflow Studio service and allow this site to use the local network."
      : error.message);
  } finally {
    button.disabled = false;
    button.innerHTML = '<span>✦</span> Send to Codex <span class="arrow">↗</span>';
  }
});

$("#new-chat").addEventListener("click", () => {
  try { localStorage.removeItem(ACTIVE_CHAT_KEY); } catch {}
  showStart();
  $("#instructions").focus();
});

$("#copy-prompt").addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(composePrompt(workflow.template, $("#instructions").value));
    showToast("Complete instruction copied.");
  } catch (error) { showToast(error.message || "Could not copy the instruction."); }
});

function showSettings() {
  $("#workflow-name").value = workflow.name;
  $("#workflow-description").value = workflow.description;
  $("#workflow-path").value = workflow.path;
  $("#workflow-template").value = workflow.template;
  $("#settings").showModal();
}
$("#edit-button").addEventListener("click", showSettings);
$("#close-settings").addEventListener("click", () => $("#settings").close());
$("#cancel-settings").addEventListener("click", () => $("#settings").close());
$("#reset-workflow").addEventListener("click", () => {
  $("#workflow-name").value = DEFAULT_WORKFLOW.name;
  $("#workflow-description").value = DEFAULT_WORKFLOW.description;
  $("#workflow-path").value = DEFAULT_WORKFLOW.path;
  $("#workflow-template").value = DEFAULT_WORKFLOW.template;
});
$("#settings-form").addEventListener("submit", event => {
  event.preventDefault();
  const next = {
    name: $("#workflow-name").value.trim(),
    description: $("#workflow-description").value.trim(),
    path: $("#workflow-path").value.trim(),
    template: $("#workflow-template").value.trim()
  };
  if (!next.name) return showToast("Give the workflow a name.");
  if (!next.template.includes("{{instructions}}")) return showToast("The template must include {{instructions}}.");
  workflow = next;
  save();
  render();
  $("#settings").close();
  showToast("Workflow saved in this browser.");
});

render();
void loadChats();
try {
  const savedChat = localStorage.getItem(ACTIVE_CHAT_KEY);
  if (savedChat) {
    renderChat({ id: savedChat, status: "connecting", mode: "desktop", messages: [] });
    void refreshChat();
  }
} catch {}
setInterval(() => { if (activeSession) void refreshChat(); }, 3000);
setInterval(() => { void loadChats(); }, 10000);
