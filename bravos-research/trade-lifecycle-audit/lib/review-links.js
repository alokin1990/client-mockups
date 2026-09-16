function isWebLink(value) {
  if (typeof value !== "string" || value.trim() === "") return false;
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:";
  } catch {
    return false;
  }
}

export function getTradeReviewLinks(trade) {
  const sourceActions = trade?.original_actions ?? trade?.actions;
  const actionLinks = Array.isArray(sourceActions)
    ? sourceActions.map((action) => action?.source_link)
    : [];
  const links = [trade?.entry_link, ...actionLinks, trade?.exit_link].filter(isWebLink);
  return [...new Set(links)];
}
