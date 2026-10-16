import { DEFAULT_WORKFLOW, INITIAL_INSTRUCTIONS, composePrompt, codexLaunchUrl } from "./logic.mjs?v=gsc-28d";

const $ = selector => document.querySelector(selector);
const STORAGE_KEY = "workflow-studio.gsc-test.v1";
const ACTIVE_CHAT_KEY = "workflow-studio.active-chat.v1";
const LOCAL_BASE = "http://127.0.0.1:4177/api/hosted";
let workflow = { ...DEFAULT_WORKFLOW };
let draft = INITIAL_INSTRUCTIONS;
let activeSession = null;
let refreshingChat = false;
let renderedMessages = "";

try {
  const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
  if (saved && typeof saved === "object") {
    if (saved.workflow && typeof saved.workflow === "object") {
      workflow = { ...DEFAULT_WORKFLOW, ...saved.workflow };
    }
    if (typeof saved.draft === "string") draft = saved.draft;
  }
} catch {
  // The launcher still works when browser storage is unavailable.
}

function save() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ workflow, draft })); }
  catch { showToast("Browser storage is unavailable. Changes will last until this page closes."); }
}

function showToast(message) {
  const element = $("#toast");
  element.textContent = message;
  element.classList.add("show");
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => element.classList.remove("show"), 5000);
}

function render() {
  $("#nav-name").textContent = workflow.name;
  $("#crumb-name").textContent = workflow.name;
  $("#description").textContent = workflow.description;
  $("#workspace-display").textContent = workflow.path || "Choose in Codex";
  $("#instructions").value = draft;
  updateLink();
}

function updateLink() {
  draft = $("#instructions").value;
  let preview = "Add instructions above to preview the complete prompt.";
  let url = "codex://threads/new";
  try {
    const prompt = composePrompt(workflow.template, draft);
    preview = prompt;
    url = codexLaunchUrl(prompt, workflow.path);
  } catch {}
  $("#prompt-preview").textContent = preview;
  $("#open-codex").href = url;
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
    const error = new Error(data.error || "Could not reach the local Codex chat.");
    error.status = response.status;
    throw error;
  }
  return data;
}

function renderChat(session, needsApproval = false) {
  const changedChat = activeSession?.id !== session.id;
  activeSession = session;
  $("#chat-card").hidden = false;
  $("#chat-status").textContent = needsApproval ? "Needs approval" : session.status;
  $("#chat-help").textContent = needsApproval
    ? "Open Codex to review its request before the chat can continue."
    : session.status === "running" ? "Codex is working. Replies appear here as they arrive."
      : session.status === "offline" ? "Start the local Workflow Studio to reconnect to this chat."
        : "Codex replies appear here. Send your next prompt below.";
  const desktopLink = $("#chat-desktop-link");
  desktopLink.hidden = !session.threadId;
  if (session.threadId) desktopLink.href = `codex://threads/${encodeURIComponent(session.threadId)}`;
  const canSend = !["running", "connecting", "offline"].includes(session.status);
  $("#followup").disabled = !canSend;
  $("#send-followup").disabled = !canSend;
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
      empty.textContent = "Waiting for Codex…";
      messages.append(empty);
    }
    renderedMessages = signature;
    if (nearBottom) messages.scrollTop = messages.scrollHeight;
  }
}

function selectChat(session, needsApproval = false) {
  try { sessionStorage.setItem(ACTIVE_CHAT_KEY, session.id); } catch {}
  renderChat(session, needsApproval);
}

async function refreshChat() {
  if (!activeSession || refreshingChat) return;
  const id = activeSession.id;
  refreshingChat = true;
  try {
    const data = await hostedApi(`/sessions/${encodeURIComponent(id)}`);
    if (activeSession?.id === id) renderChat(data.session, data.needsApproval);
  } catch (error) {
    if (activeSession?.id !== id) return;
    if (error.status === 404) {
      activeSession = null;
      $("#chat-card").hidden = true;
      try { sessionStorage.removeItem(ACTIVE_CHAT_KEY); } catch {}
      showToast("The previous chat is no longer available in the local runner.");
    } else {
      renderChat({ ...activeSession, status: "offline" });
    }
  } finally {
    refreshingChat = false;
  }
}

$("#instructions").addEventListener("input", () => {
  updateLink();
  save();
});

$("#run-now").addEventListener("click", async () => {
  let prompt;
  try { prompt = composePrompt(workflow.template, $("#instructions").value); }
  catch (error) {
    $("#instructions").focus();
    return showToast(error.message);
  }
  const button = $("#run-now");
  button.disabled = true;
  button.textContent = "Starting Codex…";
  save();
  try {
    const result = await hostedApi("/runs", {
      method: "POST",
      body: JSON.stringify({ prompt, path: workflow.path })
    });
    selectChat(result.session);
    showToast("Chat started. Send follow-up prompts below.");
    $("#chat-card").scrollIntoView({ behavior: "smooth", block: "start" });
  } catch (error) {
    showToast(error instanceof TypeError
      ? "Start the local Workflow Studio, then allow local network access for this site."
      : error.message);
  } finally {
    button.disabled = false;
    button.innerHTML = '<span>✦</span> Run now in Codex <span class="arrow">↗</span>';
  }
});

$("#followup-form").addEventListener("submit", async event => {
  event.preventDefault();
  if (!activeSession || activeSession.status === "running") return;
  const text = $("#followup").value.trim();
  if (!text) return;
  const id = activeSession.id;
  $("#send-followup").disabled = true;
  try {
    const result = await hostedApi(`/sessions/${encodeURIComponent(id)}/messages`, {
      method: "POST", body: JSON.stringify({ text })
    });
    $("#followup").value = "";
    selectChat(result.session);
    void refreshChat();
  } catch (error) {
    showToast(error instanceof TypeError
      ? "The local Workflow Studio connection is unavailable."
      : error.message);
    void refreshChat();
  } finally {
    if (activeSession?.id === id && activeSession.status !== "running") $("#send-followup").disabled = false;
  }
});

$("#followup").addEventListener("keydown", event => {
  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault();
    if (!$("#send-followup").disabled) $("#followup-form").requestSubmit();
  }
});

$("#open-codex").addEventListener("click", event => {
  try {
    const prompt = composePrompt(workflow.template, $("#instructions").value);
    $("#open-codex").href = codexLaunchUrl(prompt, workflow.path);
    save();
    showToast("Codex will open with the instructions ready. Press Send there to start.");
  } catch (error) {
    event.preventDefault();
    $("#instructions").focus();
    showToast(error.message);
  }
});

$("#copy-prompt").addEventListener("click", async () => {
  try {
    const prompt = composePrompt(workflow.template, $("#instructions").value);
    await navigator.clipboard.writeText(prompt);
    showToast("Complete instructions copied.");
  } catch (error) {
    showToast(error.message || "Could not copy. Open the preview and copy it there.");
  }
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
try {
  const savedChat = sessionStorage.getItem(ACTIVE_CHAT_KEY);
  if (savedChat) {
    renderChat({ id: savedChat, status: "connecting", messages: [] });
    void refreshChat();
  }
} catch {}
setInterval(() => { if (activeSession) void refreshChat(); }, 2000);
