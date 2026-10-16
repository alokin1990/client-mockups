export const DEFAULT_WORKFLOW = Object.freeze({
  name: "Website change",
  description: "Open a new Codex chat with a specific website change.",
  template: "Make this website change:\n\n{{instructions}}\n\nInspect the relevant files first, make the requested change, check the result, and summarize what changed.",
  path: ""
});

export function composePrompt(template, instructions) {
  const slot = "{{instructions}}";
  if (!template.includes(slot)) throw new Error("The template must include {{instructions}}.");
  const change = instructions.trim();
  if (!change) throw new Error("Describe the website change first.");
  return template.replaceAll(slot, change);
}

export function codexLaunchUrl(prompt, workspacePath = "") {
  const text = prompt.trim();
  if (!text) throw new Error("Instructions are required.");
  const parts = [`prompt=${encodeURIComponent(text)}`];
  const localPath = workspacePath.trim();
  if (localPath) parts.push(`path=${encodeURIComponent(localPath)}`);
  return `codex://new?${parts.join("&")}`;
}
