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
    dailyRows: 9_740,
  });
  assert.deepEqual(audit.criticalIssues, []);
  assert.equal(audit.checks.actionChainFailures, 2);
});

test("source review date never trails the modeled data cutoff", () => {
  const { cutoff_date: cutoffDate, source_checked_through: sourceCheckedThrough } = payload.metadata;
  assert.match(cutoffDate, /^\d{4}-\d{2}-\d{2}$/);
  assert.match(sourceCheckedThrough, /^\d{4}-\d{2}-\d{2}$/);
  assert.ok(sourceCheckedThrough >= cutoffDate);
  assert.equal(payload.metadata.source_post_count, 966);
});

test("partial exits with residual weight remain open through the cutoff", () => {
  const natera = payload.trades.find((trade) => trade.position_id === "P0338");
  assert.ok(natera, "Natera lifecycle P0338 is missing");
  assert.equal(natera.status, "OPEN AT CUTOFF");
  assert.equal(natera.audit_end_date, payload.metadata.cutoff_date);
  assert.deepEqual(
    natera.actions.map(({ type, date, weight_before: before, weight_after: after }) => ({ type, date, before, after })),
    [
      { type: "Entry", date: "2026-05-29", before: 0, after: 5 },
      { type: "Add", date: "2026-06-17", before: 5, after: 8 },
      { type: "Partial exit", date: "2026-06-24", before: 8, after: 6 },
      { type: "Partial exit", date: "2026-07-28", before: 6, after: 4 },
      { type: "Partial exit", date: "2026-08-06", before: 4, after: 2 },
    ],
  );
  const nateraRows = payload.daily_positions.filter((row) => row.position_id === natera.position_id);
  assert.equal(nateraRows.at(-1)?.date, payload.metadata.cutoff_date);
  assert.ok(nateraRows.some((row) => row.date > "2026-08-06"), "residual Natera sleeve was not carried after its last trim");
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
    2026: 5739.965515558972,
  };
  for (const yearly of model.yearly) {
    assert.ok(Math.abs(yearly.gainLoss - expected[yearly.year]) < 0.01, `${yearly.year} regression changed`);
  }
  assert.ok(Math.abs(model.compoundedReturn - 0.1235659938899818) < 1e-10);
});
