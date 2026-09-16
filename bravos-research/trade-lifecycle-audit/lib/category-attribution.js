import { groupGainLoss } from "./portfolio-math.js";

// Presentation rows use the exact dataset taxonomy, never a top-N or merged bucket.
// A sector with no finite modeled contribution is unavailable, not a $0 return.
export function categoryAttributionRows(trades, categories, gainLossForTrade) {
  const totals = groupGainLoss(trades, "sector", gainLossForTrade);
  const labels = new Set(categories);
  for (const label of totals.keys()) labels.add(label);
  return [...labels].map((label) => ({
    label,
    gainLoss: totals.has(label) ? totals.get(label) : null,
  })).sort((left, right) => {
    if (left.gainLoss === null && right.gainLoss !== null) return 1;
    if (right.gainLoss === null && left.gainLoss !== null) return -1;
    return Math.abs(right.gainLoss ?? 0) - Math.abs(left.gainLoss ?? 0)
      || left.label.localeCompare(right.label);
  });
}
