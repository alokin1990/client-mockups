import { MODEL_POLICY } from "./model-policy.js";

export const isFiniteNumber = (value) => typeof value === "number" && Number.isFinite(value);

export function getKnownYears(trades) {
  return [...new Set(trades.flatMap((trade) => [
    trade.entry_date?.slice(0, 4),
    trade.audit_end_date?.slice(0, 4),
  ]).filter(Boolean))].sort((left, right) => right.localeCompare(left));
}

export function tradeOverlapsYear(trade, year) {
  if (year === "all") return true;
  const start = `${year}-01-01`;
  const end = `${year}-12-31`;
  return Boolean(trade.entry_date && trade.audit_end_date && trade.entry_date <= end && trade.audit_end_date >= start);
}

export function classifyTradeOutcome(trade, gainLoss, year = "all", tolerance = 1e-9) {
  const isModeled = trade?.model_status === "Included" && isFiniteNumber(gainLoss);
  const isClosedInScope = trade?.status === "CLOSED"
    && (year === "all" || trade.audit_end_date?.startsWith(year));
  if (!isModeled || !isClosedInScope || Math.abs(gainLoss) <= tolerance) return "incomplete";
  return gainLoss > 0 ? "winner" : "loser";
}

export function filterTrades(
  trades,
  { year = "all", category = "all", direction = "all", outcome = "all" } = {},
  gainLossForTrade = () => null,
) {
  return trades.filter((trade) => (
    tradeOverlapsYear(trade, year)
    && (category === "all" || trade.sector === category)
    && (direction === "all" || trade.direction === direction)
    && (outcome === "all" || classifyTradeOutcome(trade, gainLossForTrade(trade), year) === outcome)
  ));
}

export function actionKey(positionId, date, actionIndex) {
  return `${positionId}|${date}|${actionIndex}`;
}

export function buildActionIndex(trades) {
  const byPositionDate = new Map();
  for (const trade of trades) {
    for (const [actionIndex, action] of (trade.actions ?? []).entries()) {
      const key = `${trade.position_id}|${action.date}`;
      if (!byPositionDate.has(key)) byPositionDate.set(key, []);
      byPositionDate.get(key).push({ action, actionIndex });
    }
  }
  return byPositionDate;
}

export function applyWeightAction({
  openCapital,
  action,
  portfolioEquity,
  weightUnitFraction = MODEL_POLICY.weightUnitFraction,
}) {
  const beforeWeight = action.weight_before;
  const afterWeight = action.weight_after;
  if (!isFiniteNumber(beforeWeight) || !isFiniteNumber(afterWeight) || beforeWeight < 0 || afterWeight < 0) {
    throw new Error(`Cannot size action with invalid weights: ${beforeWeight} -> ${afterWeight}`);
  }

  let capitalBefore = openCapital;
  if (!isFiniteNumber(capitalBefore)) {
    capitalBefore = beforeWeight > 0 ? portfolioEquity * beforeWeight * weightUnitFraction : 0;
  }

  let capitalAfter = capitalBefore;
  let capitalAdded = 0;
  if (afterWeight > beforeWeight) {
    capitalAdded = portfolioEquity * (afterWeight - beforeWeight) * weightUnitFraction;
    capitalAfter += capitalAdded;
  } else if (afterWeight < beforeWeight) {
    capitalAfter = beforeWeight > 0 ? capitalBefore * (afterWeight / beforeWeight) : 0;
  }

  return { capitalBefore, capitalAfter, capitalAdded };
}
