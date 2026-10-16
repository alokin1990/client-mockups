import { DEFAULT_WORKFLOW, INITIAL_INSTRUCTIONS, composePrompt, codexLaunchUrl } from "./logic.mjs?v=gsc-28d";

const $ = selector => document.querySelector(selector);
const STORAGE_KEY = "workflow-studio.gsc-test.v1";
let workflow = { ...DEFAULT_WORKFLOW };
let draft = INITIAL_INSTRUCTIONS;

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

$("#instructions").addEventListener("input", () => {
  updateLink();
  save();
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
