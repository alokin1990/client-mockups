import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { auditDataset } from "../lib/data-audit.js";
import { buildPortfolioModel, getTradeStats } from "../lib/portfolio-math.js";

const payload = JSON.parse(await readFile(new URL("../data/trades.json", import.meta.url), "utf8"));

test("source data passes structural and arithmetic integrity checks", () => {
  const audit = auditDataset(payload);
  assert.deepEqual(audit.counts, {
    trades: 367,
    includedTrades: 295,
    excludedTrades: 72,
    dailyRows: 9_641,
  });
  assert.deepEqual(audit.criticalIssues, []);
  assert.equal(audit.checks.actionChainFailures, 2);
});

test("every annual portfolio gain reconciles to its individual trade contributions", () => {
  const model = buildPortfolioModel({ trades: payload.trades, dailyPositions: payload.daily_positions });
  for (const yearly of model.yearly) {
    const contribution = payload.trades.reduce(
      (sum, trade) => sum + (getTradeStats(model, trade.position_id, yearly.year)?.gainLoss ?? 0),
      0,
    );
    assert.ok(Math.abs(contribution - yearly.gainLoss) < 1e-7, `${yearly.year} did not reconcile`);
  }
});

test("real-data annual results are protected by regression checks", () => {
  const model = buildPortfolioModel({ trades: payload.trades, dailyPositions: payload.daily_positions });
  const expected = {
    2024: -301.4298588996171,
    2025: 6578.718024590824,
    2026: 5490.486746960232,
  };
  for (const yearly of model.yearly) {
    assert.ok(Math.abs(yearly.gainLoss - expected[yearly.year]) < 0.01, `${yearly.year} regression changed`);
  }
  assert.ok(Math.abs(model.compoundedReturn - 0.12091509591372085) < 1e-10);
});
