import test from "node:test";
import assert from "node:assert/strict";
import {
  annualizeReturn,
  buildPortfolioModel,
  compoundReturns,
  gainShare,
  getTradeStats,
  groupGainLoss,
  summarizeTradeStats,
  tradeWinRate,
} from "../lib/portfolio-math.js";

const trade = (positionId, actions, direction = "LONG") => ({ position_id: positionId, actions, direction });
const row = (date, positionId, dailyReturn, capitalBase = 1) => ({
  date,
  position_id: positionId,
  daily_return_on_capital: dailyReturn,
  capital_base: capitalBase,
});

test("compounding does not add percentages", () => {
  assert.ok(Math.abs(compoundReturns([0.10, -0.10]) - (-0.01)) < 1e-12);
  assert.equal(gainShare([10, -5, 0]), 2 / 3);
});

test("trade summary and category attribution use dollar contributions", () => {
  const stats = [
    { returnOnAverageCapital: 0.10, gainLoss: 100 },
    { returnOnAverageCapital: -0.05, gainLoss: -40 },
  ];
  const summary = summarizeTradeStats(stats);
  assert.ok(Math.abs(summary.averageTradeReturn - 0.025) < 1e-12);
  assert.ok(Math.abs(summary.grossProfitShare - (100 / 140)) < 1e-12);
  assert.deepEqual(
    [...groupGainLoss([{ sector: "A", gain: 100 }, { sector: "A", gain: -40 }], "sector", (item) => item.gain)],
    [["A", 60]],
  );
});

test("trade win rate counts resolved winners rather than weighting gain dollars", () => {
  assert.equal(tradeWinRate(["winner", "loser", "loser", "incomplete"]), 1 / 3);
  assert.equal(tradeWinRate(["incomplete"]), null);
});

test("annualization uses inclusive calendar days", () => {
  assert.ok(Math.abs(annualizeReturn(0.10, "2025-01-01", "2025-12-31") - 0.10) < 1e-12);
});

test("new entries use current equity while existing positions stay at allocated capital", () => {
  const model = buildPortfolioModel({
    trades: [
      trade("A", [{ type: "Entry", date: "2025-01-01", weight_before: 0, weight_after: 100 }]),
      trade("B", [{ type: "Entry", date: "2025-01-02", weight_before: 0, weight_after: 10 }]),
    ],
    dailyPositions: [
      row("2025-01-01", "A", -0.50, 100),
      row("2025-01-02", "A", 0, 100),
      row("2025-01-02", "B", 0.20, 10),
    ],
  });

  assert.equal(model.entryCapital.get("A"), 100_000);
  assert.equal(model.entryCapital.get("B"), 5_000);
  assert.equal(getTradeStats(model, "A", "2025").gainLoss, -50_000);
  assert.equal(getTradeStats(model, "B", "2025").gainLoss, 1_000);
  assert.equal(model.yearly[0].endingCapital, 51_000);
});

test("trim uses the pre-trim capital for that day's return and carries the reduced capital forward", () => {
  const model = buildPortfolioModel({
    trades: [trade("A", [
      { type: "Entry", date: "2025-01-01", weight_before: 0, weight_after: 10 },
      { type: "Trim", date: "2025-01-02", weight_before: 10, weight_after: 5 },
    ])],
    dailyPositions: [
      row("2025-01-01", "A", 0, 10),
      row("2025-01-02", "A", 0.10, 10),
      row("2025-01-03", "A", 0.10, 5),
    ],
  });

  assert.equal(getTradeStats(model, "A", "2025").gainLoss, 1_500);
  assert.equal(model.actionCapitalAfter.get("A|2025-01-02|1"), 5_000);
});

test("multiple same-day actions use peak capital, not the sum of recycled additions", () => {
  const model = buildPortfolioModel({
    trades: [trade("A", [
      { type: "Entry", date: "2025-01-01", weight_before: 0, weight_after: 5 },
      { type: "Final exit", date: "2025-01-01", weight_before: 5, weight_after: 0 },
      { type: "Entry", date: "2025-01-01", weight_before: 0, weight_after: 5 },
    ])],
    dailyPositions: [row("2025-01-01", "A", 0.10, 5)],
  });
  assert.equal(getTradeStats(model, "A", "2025").gainLoss, 500);
});

test("long and short returns are not inverted a second time", () => {
  const model = buildPortfolioModel({
    trades: [trade("S", [{ type: "Entry", date: "2025-01-01", weight_before: 0, weight_after: 10 }], "SHORT")],
    dailyPositions: [row("2025-01-01", "S", 0.10, 10)],
  });
  assert.equal(getTradeStats(model, "S", "2025").gainLoss, 1_000);
});

test("calendar-year resets and trade contributions reconcile to each year", () => {
  const model = buildPortfolioModel({
    trades: [trade("A", [{ type: "Entry", date: "2025-12-31", weight_before: 0, weight_after: 10 }])],
    dailyPositions: [
      row("2025-12-31", "A", 0.10, 10),
      row("2026-01-01", "A", -0.10, 10),
    ],
  });
  assert.deepEqual(model.yearly.map(({ year, endingCapital }) => [year, endingCapital]), [
    ["2025", 101_000],
    ["2026", 99_000],
  ]);
  for (const yearly of model.yearly) {
    const tradeGain = getTradeStats(model, "A", yearly.year).gainLoss;
    assert.ok(Math.abs(tradeGain - yearly.gainLoss) < 1e-9);
  }
});
