import { MODEL_POLICY } from "./model-policy.js";
import { actionKey, applyWeightAction, buildActionIndex, isFiniteNumber } from "./trade-rules.js";

const tradeYearKey = (year, positionId) => `${year}|${positionId}`;

function addTradeDay(stats, { date, gainLoss, capitalBase }) {
  stats.gainLoss += gainLoss;
  stats.capitalDays += capitalBase;
  stats.coveredDays += 1;
  stats.firstDate ??= date;
  stats.lastDate = date;
  stats.initialCapital ??= capitalBase;
}

function finishTradeStats(stats) {
  const averageCapital = stats.coveredDays > 0 ? stats.capitalDays / stats.coveredDays : null;
  return {
    ...stats,
    averageCapital,
    returnOnAverageCapital: averageCapital > 0 ? stats.gainLoss / averageCapital : null,
  };
}

export function annualizeReturn(totalReturn, firstDate, lastDate) {
  if (!isFiniteNumber(totalReturn) || totalReturn <= -1 || !firstDate || !lastDate) return null;
  const elapsedDays = Math.max(
    Math.floor((Date.parse(`${lastDate}T00:00:00Z`) - Date.parse(`${firstDate}T00:00:00Z`)) / 86_400_000) + 1,
    1,
  );
  return Math.pow(1 + totalReturn, 365 / elapsedDays) - 1;
}

export function compoundReturns(returns) {
  const valid = returns.filter(isFiniteNumber);
  return valid.length ? valid.reduce((growth, value) => growth * (1 + value), 1) - 1 : null;
}

export function gainShare(values) {
  const valid = values.filter(isFiniteNumber);
  const gains = valid.reduce((sum, value) => sum + Math.max(value, 0), 0);
  const losses = valid.reduce((sum, value) => sum + Math.abs(Math.min(value, 0)), 0);
  return gains + losses > 0 ? gains / (gains + losses) : null;
}

export function tradeWinRate(outcomes) {
  const resolved = outcomes.filter((outcome) => outcome === "winner" || outcome === "loser");
  if (!resolved.length) return null;
  return resolved.filter((outcome) => outcome === "winner").length / resolved.length;
}

export function summarizeTradeStats(stats) {
  const returns = stats.map((item) => item?.returnOnAverageCapital).filter(isFiniteNumber);
  return {
    averageTradeReturn: returns.length
      ? returns.reduce((sum, value) => sum + value, 0) / returns.length
      : null,
    grossProfitShare: gainShare(stats.map((item) => item?.gainLoss)),
  };
}

export function groupGainLoss(items, groupKey, valueForItem) {
  const totals = new Map();
  for (const item of items) {
    const group = item?.[groupKey] || "Unclassified";
    const value = valueForItem(item);
    if (!isFiniteNumber(value)) continue;
    totals.set(group, (totals.get(group) ?? 0) + value);
  }
  return totals;
}

export function buildPortfolioModel({
  trades,
  dailyPositions,
  startingCapital = MODEL_POLICY.yearlyStartingCapital,
  weightUnitFraction = MODEL_POLICY.weightUnitFraction,
}) {
  if (!isFiniteNumber(startingCapital) || startingCapital <= 0) throw new Error("startingCapital must be positive");

  const actionIndex = buildActionIndex(trades);
  const rowsByYear = new Map();
  for (const row of dailyPositions) {
    if (!row.date || !row.position_id || !isFiniteNumber(row.daily_return_on_capital)) continue;
    const year = row.date.slice(0, 4);
    if (!rowsByYear.has(year)) rowsByYear.set(year, new Map());
    const rowsByDate = rowsByYear.get(year);
    if (!rowsByDate.has(row.date)) rowsByDate.set(row.date, []);
    rowsByDate.get(row.date).push(row);
  }

  const yearly = [];
  const tradeStatsByYear = new Map();
  const tradeStatsAllRaw = new Map();
  const entryCapital = new Map();
  const actionCapitalAfter = new Map();
  const dailyPortfolio = [];

  for (const year of [...rowsByYear.keys()].sort()) {
    const rowsByDate = rowsByYear.get(year);
    const dates = [...rowsByDate.keys()].sort();
    const openCapital = new Map();
    let equity = startingCapital;

    for (const date of dates) {
      const startEquity = equity;
      let dailyGain = 0;
      const rows = [...rowsByDate.get(date)].sort((left, right) => left.position_id.localeCompare(right.position_id));

      for (const row of rows) {
        const positionDateKey = `${row.position_id}|${date}`;
        const actions = actionIndex.get(positionDateKey) ?? [];
        let currentCapital = openCapital.get(row.position_id);

        if (!isFiniteNumber(currentCapital)) {
          const firstBeforeWeight = actions[0]?.action.weight_before;
          const seedWeight = isFiniteNumber(firstBeforeWeight) ? firstBeforeWeight : row.capital_base;
          currentCapital = isFiniteNumber(seedWeight) ? startEquity * seedWeight * weightUnitFraction : 0;
        }

        const capitalBeforeActions = currentCapital;
        let peakCapital = currentCapital;
        for (const { action, actionIndex: index } of actions) {
          const result = applyWeightAction({
            openCapital: currentCapital,
            action,
            portfolioEquity: startEquity,
            weightUnitFraction,
          });
          currentCapital = result.capitalAfter;
          peakCapital = Math.max(peakCapital, currentCapital);
          actionCapitalAfter.set(actionKey(row.position_id, date, index), currentCapital);
          if (result.capitalAdded > 0 && !entryCapital.has(row.position_id) && action.type === "Entry") {
            entryCapital.set(row.position_id, result.capitalAdded);
          }
        }

        const capitalBase = Math.max(capitalBeforeActions, currentCapital, peakCapital);
        const gainLoss = capitalBase * row.daily_return_on_capital;
        dailyGain += gainLoss;
        openCapital.set(row.position_id, currentCapital);

        const key = tradeYearKey(year, row.position_id);
        const yearStats = tradeStatsByYear.get(key) ?? {
          year,
          positionId: row.position_id,
          gainLoss: 0,
          capitalDays: 0,
          coveredDays: 0,
          firstDate: null,
          lastDate: null,
          initialCapital: null,
        };
        addTradeDay(yearStats, { date, gainLoss, capitalBase });
        tradeStatsByYear.set(key, yearStats);

        const allStats = tradeStatsAllRaw.get(row.position_id) ?? {
          positionId: row.position_id,
          gainLoss: 0,
          capitalDays: 0,
          coveredDays: 0,
          firstDate: null,
          lastDate: null,
          initialCapital: null,
        };
        addTradeDay(allStats, { date, gainLoss, capitalBase });
        tradeStatsAllRaw.set(row.position_id, allStats);
      }

      const allocatedCapital = [...openCapital.values()].reduce((sum, value) => sum + value, 0);
      if (!isFiniteNumber(dailyGain) || !isFiniteNumber(allocatedCapital)) {
        throw new Error(`Non-finite modeled result on ${date}`);
      }
      equity += dailyGain;
      dailyPortfolio.push({
        date,
        year,
        startEquity,
        gainLoss: dailyGain,
        endingEquity: equity,
        return: dailyGain / startEquity,
        allocatedCapital,
        grossExposureRatio: startEquity !== 0 ? allocatedCapital / startEquity : null,
      });
    }

    const yearDays = dailyPortfolio.filter((row) => row.year === year);
    yearly.push({
      year,
      startingCapital,
      gainLoss: equity - startingCapital,
      endingCapital: equity,
      return: equity / startingCapital - 1,
      firstDate: dates[0],
      lastDate: dates.at(-1),
      maxGrossExposureRatio: Math.max(...yearDays.map((row) => row.grossExposureRatio ?? 0)),
    });
  }

  for (const [key, stats] of tradeStatsByYear) tradeStatsByYear.set(key, finishTradeStats(stats));
  const tradeStatsAll = new Map([...tradeStatsAllRaw].map(([key, stats]) => [key, finishTradeStats(stats)]));
  const compoundedReturn = compoundReturns(yearly.map((row) => row.return));
  const firstDate = yearly[0]?.firstDate ?? null;
  const lastDate = yearly.at(-1)?.lastDate ?? null;

  return {
    policy: { startingCapital, weightUnitFraction },
    yearly,
    dailyPortfolio,
    tradeStatsByYear,
    tradeStatsAll,
    entryCapital,
    actionCapitalAfter,
    compoundedReturn,
    annualizedReturn: annualizeReturn(compoundedReturn, firstDate, lastDate),
  };
}

export function getTradeStats(model, positionId, year = "all") {
  return year === "all"
    ? model.tradeStatsAll.get(positionId) ?? null
    : model.tradeStatsByYear.get(tradeYearKey(year, positionId)) ?? null;
}

export function getPortfolioPeriod(model, year = "all") {
  if (year === "all") {
    return {
      return: model.compoundedReturn,
      annualizedReturn: model.annualizedReturn,
      firstDate: model.yearly[0]?.firstDate ?? null,
      lastDate: model.yearly.at(-1)?.lastDate ?? null,
    };
  }
  const row = model.yearly.find((item) => item.year === year);
  return row ? { ...row, annualizedReturn: annualizeReturn(row.return, row.firstDate, row.lastDate) } : null;
}
