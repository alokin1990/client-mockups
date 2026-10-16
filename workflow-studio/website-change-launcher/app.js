import { DEFAULT_WORKFLOW, INITIAL_INSTRUCTIONS, composePrompt, codexLaunchUrl } from "./logic.mjs?v=chat-2";

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
let renderedApproval = "";

try {
  const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
  if (saved && typeof saved === "object") {
    if (saved.workflow && typeof saved.workflow === "object") {
      workflow = { ...DEFAULT_WORKFLOW, ...saved.workflow };
      if (workflow.description === "Open Codex with a ready-to-run GSC data request.") {
        workflow.description = DEFAULT_WORKFLOW.description;
      }
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

function renderChat(session, pendingApprovals = []) {
  const changedChat = activeSession?.id !== session.id;
  activeSession = session;
  $("#start-card").hidden = true;
  $("#prompt-preview-card").hidden = true;
  $("#chat-card").hidden = false;
  $("#chat-status").textContent = pendingApprovals.length ? "Needs input" : session.status;
  $("#chat-help").textContent = pendingApprovals.length
    ? "Respond to Codex below to continue this chat."
    : session.status === "running" ? "Codex is working. Replies appear here as they arrive."
      : session.status === "offline" ? "Start the local Workflow Studio to reconnect to this chat."
        : session.status === "interrupted" ? "The last turn was interrupted. Send a new instruction to continue."
          : "Codex replies appear here. Send your next instruction below.";
  const desktopLink = $("#chat-desktop-link");
  desktopLink.hidden = !session.threadId;
  if (session.threadId) desktopLink.href = `codex://threads/${encodeURIComponent(session.threadId)}`;
  const canSend = !["running", "connecting", "offline"].includes(session.status);
  $("#followup").disabled = !canSend;
  $("#send-followup").disabled = !canSend;
  $("#chat-error").hidden = !session.error;
  $("#chat-error").textContent = session.error || "";
  renderApproval(session, pendingApprovals);

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
  if (changedChat) renderChatList();
}

function selectChat(session, pendingApprovals = []) {
  try { localStorage.setItem(ACTIVE_CHAT_KEY, session.id); } catch {}
  renderChat(session, pendingApprovals);
}

function renderApproval(session, pendingApprovals) {
  const box = $("#chat-approval");
  const pending = pendingApprovals[0];
  if (!pending) {
    box.hidden = true;
    renderedApproval = "";
    return;
  }
  const key = `${session.id}:${pending.id}`;
  if (renderedApproval === key) return;
  renderedApproval = key;
  box.replaceChildren();
  box.hidden = false;

  const title = document.createElement("strong");
  title.textContent = pending.method === "item/tool/requestUserInput" ? "Codex has a question" : "Codex needs your approval";
  const details = document.createElement("p");
  details.textContent = pending.params.reason || pending.params.command || "Review this request before continuing.";
  box.append(title, details);

  const send = async payload => {
    const buttons = [...box.querySelectorAll("button")];
    buttons.forEach(button => { button.disabled = true; });
    try {
      await hostedApi(`/sessions/${encodeURIComponent(session.id)}/approval`, {
        method: "POST", body: JSON.stringify({ id: pending.id, ...payload })
      });
      box.hidden = true;
      renderedApproval = "";
      void refreshChat();
    } catch (error) {
      showToast(error.message);
      buttons.forEach(button => { button.disabled = false; });
    }
  };

  if (pending.method === "item/tool/requestUserInput") {
    const fields = {};
    for (const question of pending.params.questions || []) {
      const label = document.createElement("label");
      label.textContent = question.question;
      const input = document.createElement("input");
      input.placeholder = question.options?.map(option => option.label).join(" / ") || "Your answer";
      label.append(input);
      box.append(label);
      fields[question.id] = input;
    }
    const answer = document.createElement("button");
    answer.type = "button";
    answer.className = "primary-action";
    answer.textContent = "Send answer";
    answer.addEventListener("click", () => void send({
      answers: Object.fromEntries(Object.entries(fields).map(([id, input]) => [id, input.value]))
    }));
    box.append(answer);
    return;
  }

  if (!["item/commandExecution/requestApproval", "item/fileChange/requestApproval"].includes(pending.method)) {
    details.textContent = "Open this chat in Codex to answer this request.";
    return;
  }
  for (const decision of ["accept", "decline"]) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = decision === "accept" ? "primary-action" : "secondary-action";
    button.textContent = decision === "accept" ? "Approve once" : "Decline";
    button.addEventListener("click", () => void send({ decision }));
    box.append(button);
  }
}

function showStart() {
  activeSession = null;
  renderedMessages = "";
  renderedApproval = "";
  $("#chat-card").hidden = true;
  $("#start-card").hidden = false;
  $("#prompt-preview-card").hidden = false;
  renderChatList();
}

function renderChatList() {
  const list = $("#chat-list");
  list.replaceChildren();
  if (!chats.length) {
    const empty = document.createElement("span");
    empty.className = "chat-list-empty";
    empty.textContent = "Start a chat to see it here.";
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
    detail.textContent = `${new Date(chat.createdAt).toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })} · ${chat.status}`;
    button.append(title, detail);
    button.addEventListener("click", () => {
      selectChat({ id: chat.id, status: "connecting", messages: [] });
      void refreshChat();
    });
    list.append(button);
  }
}

async function loadChats() {
  try {
    const data = await hostedApi("/sessions");
    chats = data.sessions;
    renderChatList();
  } catch {
    // Existing chat remains visible while the local runner is offline.
  }
}

async function refreshChat() {
  if (!activeSession || refreshingChat) return;
  const id = activeSession.id;
  refreshingChat = true;
  try {
    const data = await hostedApi(`/sessions/${encodeURIComponent(id)}`);
    if (activeSession?.id === id) renderChat(data.session, data.pendingApprovals || []);
  } catch (error) {
    if (activeSession?.id !== id) return;
    if (error.status === 404) {
      try { localStorage.removeItem(ACTIVE_CHAT_KEY); } catch {}
      showStart();
      void loadChats();
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
    void loadChats();
    showToast("Chat started. Add your next instruction below.");
    $("#chat-card").scrollIntoView({ behavior: "smooth", block: "start" });
  } catch (error) {
    showToast(error instanceof TypeError
      ? "Start the local Workflow Studio, then allow local network access for this site."
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

$("#followup-form").addEventListener("submit", async event => {
  event.preventDefault();
  if (!activeSession || ["running", "connecting", "offline"].includes(activeSession.status)) return;
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
    void loadChats();
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
void loadChats();
try {
  const savedChat = localStorage.getItem(ACTIVE_CHAT_KEY) || sessionStorage.getItem(ACTIVE_CHAT_KEY);
  if (savedChat) {
    localStorage.setItem(ACTIVE_CHAT_KEY, savedChat);
    sessionStorage.removeItem(ACTIVE_CHAT_KEY);
    renderChat({ id: savedChat, status: "connecting", messages: [] });
    void refreshChat();
  }
} catch {}
setInterval(() => { if (activeSession) void refreshChat(); }, 2000);
setInterval(() => { void loadChats(); }, 10000);
