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
  const links = [trade?.entry_link, trade?.exit_link].filter(isWebLink);
  return [...new Set(links)];
}
