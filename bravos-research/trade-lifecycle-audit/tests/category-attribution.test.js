import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { categoryAttributionRows } from "../lib/category-attribution.js";
import { buildPortfolioModel, getTradeStats } from "../lib/portfolio-math.js";

test("attribution retains every full sector label without a merged top-N bucket", () => {
  const categories = Array.from({ length: 19 }, (_, index) => `Full sector / theme ${index}`);
  const trades = categories.map((sector, index) => ({ sector, gain: index - 9 }));
  const rows = categoryAttributionRows(trades, categories, (trade) => trade.gain);
  assert.equal(rows.length, 19);
  assert.deepEqual(new Set(rows.map((row) => row.label)), new Set(categories));
  assert.equal(rows.reduce((sum, row) => sum + row.gainLoss, 0), 0);
});

test("attribution distinguishes zero net P/L from unavailable or filtered-out data", () => {
  const rows = categoryAttributionRows([
    { sector: "Zero", gain: 10 }, { sector: "Zero", gain: -10 },
    { sector: "Unmodeled", gain: null }, { sector: "Loss", gain: -30 },
  ], ["Zero", "Unmodeled", "Loss", "No matching trades"], (trade) => trade.gain);
  assert.equal(rows[0].label, "Loss");
  assert.equal(rows.find((row) => row.label === "Zero").gainLoss, 0);
  assert.equal(rows.find((row) => row.label === "Unmodeled").gainLoss, null);
  assert.equal(rows.find((row) => row.label === "No matching trades").gainLoss, null);
  assert.equal(categoryAttributionRows([], ["Selected category"], () => null).length, 1);
});

test("all dataset sectors are displayed and contributions reconcile to the model", () => {
  const data = JSON.parse(fs.readFileSync(new URL("../data/trades.json", import.meta.url), "utf8"));
  const model = buildPortfolioModel({ trades: data.trades, dailyPositions: data.daily_positions });
  const categories = [...new Set(data.trades.map((trade) => trade.sector))];
  for (const year of ["all", "2024", "2025", "2026"]) {
    const rows = categoryAttributionRows(data.trades, categories,
      (trade) => getTradeStats(model, trade.position_id, year)?.gainLoss ?? null);
    assert.equal(rows.length, categories.length);
    const total = rows.reduce((sum, row) => sum + (row.gainLoss ?? 0), 0);
    const expected = model.yearly.filter((row) => year === "all" || row.year === year)
      .reduce((sum, row) => sum + row.gainLoss, 0);
    assert.ok(Math.abs(total - expected) < 1e-7);
  }
});
