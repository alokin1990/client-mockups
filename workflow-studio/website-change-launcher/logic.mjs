export const INITIAL_INSTRUCTIONS = "Use GSC skill to pull data for last 28 days for lovettdental.com";

export const DEFAULT_WORKFLOW = Object.freeze({
  name: "GSC test",
  description: "Start a Codex chat with a ready-to-run GSC data request.",
  template: "{{instructions}}",
  path: ""
});

export function composePrompt(template, instructions) {
  const slot = "{{instructions}}";
  if (!template.includes(slot)) throw new Error("The template must include {{instructions}}.");
  const change = instructions.trim();
  if (!change) throw new Error("Enter instructions first.");
  return template.replaceAll(slot, change);
}
