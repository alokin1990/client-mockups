import { isFiniteNumber } from "./trade-rules.js";

const rowKey = (row) => `${row.position_id}|${row.date}`;

export function auditDataset(payload, tolerance = 1e-9) {
  const trades = Array.isArray(payload?.trades) ? payload.trades : [];
  const dailyPositions = Array.isArray(payload?.daily_positions) ? payload.daily_positions : [];
  const tradeById = new Map(trades.map((trade) => [trade.position_id, trade]));
  const included = trades.filter((trade) => trade.model_status === "Included");
  const rowsByPosition = new Map();
  const seenRows = new Set();
  const aggregateWeightByDate = new Map();
  const criticalIssues = [];
  const warnings = [];
  let pnlIdentityFailures = 0;
  let duplicateDailyRows = 0;
  let orphanDailyRows = 0;
  let excludedTradeDailyRows = 0;
  let outOfRangeDailyRows = 0;
  let invalidDailyRows = 0;

  for (const row of dailyPositions) {
    const key = rowKey(row);
    if (seenRows.has(key)) duplicateDailyRows += 1;
    seenRows.add(key);

    const trade = tradeById.get(row.position_id);
    if (!trade) orphanDailyRows += 1;
    else if (trade.model_status !== "Included") excludedTradeDailyRows += 1;
    else if (row.date < trade.entry_date || row.date > trade.audit_end_date) outOfRangeDailyRows += 1;

    if (!row.date || !row.position_id || !isFiniteNumber(row.pnl)
      || !isFiniteNumber(row.capital_base) || !isFiniteNumber(row.daily_return_on_capital)
      || row.capital_base < 0) {
      invalidDailyRows += 1;
      continue;
    }

    const expectedPnl = row.capital_base * row.daily_return_on_capital;
    if (Math.abs(row.pnl - expectedPnl) > tolerance) pnlIdentityFailures += 1;
    aggregateWeightByDate.set(row.date, (aggregateWeightByDate.get(row.date) ?? 0) + row.capital_base);
    if (!rowsByPosition.has(row.position_id)) rowsByPosition.set(row.position_id, new Set());
    rowsByPosition.get(row.position_id).add(row.date);
  }

  const includedWithoutDailyRows = included
    .filter((trade) => !rowsByPosition.has(trade.position_id))
    .map((trade) => trade.position_id);
  const actionChainFailures = [];
  const actionDatesWithoutDailyRows = [];
  const terminalStatusContradictions = [];
  for (const trade of included) {
    const actions = trade.actions ?? [];
    for (let index = 0; index < actions.length; index += 1) {
      const action = actions[index];
      if (!isFiniteNumber(action.weight_before) || !isFiniteNumber(action.weight_after)
        || action.weight_before < 0 || action.weight_after < 0) {
        actionChainFailures.push(`${trade.position_id}: invalid action weights at ${action.date}`);
      }
      if (index > 0 && Math.abs(actions[index - 1].weight_after - action.weight_before) > tolerance) {
        actionChainFailures.push(`${trade.position_id}: ${actions[index - 1].weight_after} does not continue to ${action.weight_before} at ${action.date}`);
      }
      if (!rowsByPosition.get(trade.position_id)?.has(action.date)) {
        actionDatesWithoutDailyRows.push(`${trade.position_id}|${action.date}`);
      }
    }

    const terminalAction = actions.at(-1);
    const hasPositiveResidual = isFiniteNumber(terminalAction?.weight_after)
      && terminalAction.weight_after > tolerance;
    if (trade.status === "CLOSED" && hasPositiveResidual) {
      terminalStatusContradictions.push(
        `${trade.position_id}: CLOSED after ${terminalAction.type} left weight ${terminalAction.weight_after}`,
      );
    }
    if (trade.status === "OPEN AT CUTOFF" && terminalAction?.type === "Final exit") {
      terminalStatusContradictions.push(
        `${trade.position_id}: OPEN AT CUTOFF after ${terminalAction?.type ?? "terminal action"} left no weight`,
      );
    }
  }

  const exposureRows = [...aggregateWeightByDate].sort((left, right) => right[1] - left[1]);
  const maxAggregateWeight = exposureRows[0]?.[1] ?? null;
  const maxAggregateWeightDate = exposureRows[0]?.[0] ?? null;
  const daysOver100Weight = exposureRows.filter(([, weight]) => weight > 100 + tolerance).length;

  const criticalCounts = {
    duplicateDailyRows,
    orphanDailyRows,
    excludedTradeDailyRows,
    outOfRangeDailyRows,
    invalidDailyRows,
    pnlIdentityFailures,
    includedWithoutDailyRows: includedWithoutDailyRows.length,
    actionDatesWithoutDailyRows: actionDatesWithoutDailyRows.length,
    terminalStatusContradictions: terminalStatusContradictions.length,
  };
  for (const [name, count] of Object.entries(criticalCounts)) {
    if (count > 0) criticalIssues.push(`${name}: ${count}`);
  }
  if (daysOver100Weight > 0) {
    warnings.push(`Aggregate source capital_base exceeds 100 weight units on ${daysOver100Weight} covered days.`);
  }
  if (actionChainFailures.length > 0) {
    warnings.push(`${actionChainFailures.length} action chains contain a stated before-weight that does not match the prior after-weight.`);
  }
  if (trades.some((trade) => trade.model_status !== "Included")) {
    warnings.push(`${trades.length - included.length} trades are excluded from modeled returns.`);
  }

  const coverageByYear = [...new Set(dailyPositions.map((row) => row.date?.slice(0, 4)).filter(Boolean))]
    .sort()
    .map((year) => {
      const rows = dailyPositions.filter((row) => row.date.startsWith(year));
      const dates = rows.map((row) => row.date).sort();
      return {
        year,
        rows: rows.length,
        positions: new Set(rows.map((row) => row.position_id)).size,
        firstDate: dates[0] ?? null,
        lastDate: dates.at(-1) ?? null,
      };
    });

  return {
    counts: {
      trades: trades.length,
      includedTrades: included.length,
      excludedTrades: trades.length - included.length,
      dailyRows: dailyPositions.length,
    },
    coverageByYear,
    checks: { ...criticalCounts, actionChainFailures: actionChainFailures.length },
    exposure: { maxAggregateWeight, maxAggregateWeightDate, daysOver100Weight },
    samples: {
      includedWithoutDailyRows: includedWithoutDailyRows.slice(0, 10),
      actionChainFailures: actionChainFailures.slice(0, 10),
      actionDatesWithoutDailyRows: actionDatesWithoutDailyRows.slice(0, 10),
      terminalStatusContradictions: terminalStatusContradictions.slice(0, 10),
    },
    criticalIssues,
    warnings,
  };
}
