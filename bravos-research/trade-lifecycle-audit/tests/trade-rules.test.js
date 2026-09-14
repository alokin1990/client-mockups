import test from "node:test";
import assert from "node:assert/strict";
import {
  applyWeightAction,
  classifyTradeOutcome,
  filterTrades,
  tradeOverlapsYear,
} from "../lib/trade-rules.js";

test("a trade is included in every year its lifecycle overlaps", () => {
  const trade = { entry_date: "2025-12-23", audit_end_date: "2026-01-05", sector: "Energy", direction: "LONG" };
  assert.equal(tradeOverlapsYear(trade, "2025"), true);
  assert.equal(tradeOverlapsYear(trade, "2026"), true);
  assert.equal(tradeOverlapsYear(trade, "2024"), false);
  assert.deepEqual(filterTrades([trade], { year: "2026", category: "Energy", direction: "LONG" }), [trade]);
});

test("an addition is sized from portfolio equity at the action", () => {
  const result = applyWeightAction({
    openCapital: 5_000,
    action: { weight_before: 5, weight_after: 10 },
    portfolioEquity: 50_000,
  });
  assert.equal(result.capitalAdded, 2_500);
  assert.equal(result.capitalAfter, 7_500);
});

test("a trim removes the same proportion from pooled allocated capital", () => {
  const result = applyWeightAction({
    openCapital: 5_000,
    action: { weight_before: 5, weight_after: 3 },
    portfolioEquity: 200_000,
  });
  assert.equal(result.capitalAdded, 0);
  assert.equal(result.capitalAfter, 3_000);
});

test("invalid weights fail loudly", () => {
  assert.throws(() => applyWeightAction({
    openCapital: 1_000,
    action: { weight_before: 5, weight_after: null },
    portfolioEquity: 100_000,
  }), /invalid weights/);
});

test("outcome classification requires a closed modeled result", () => {
  const closed = { status: "CLOSED", model_status: "Included", audit_end_date: "2026-05-01" };
  assert.equal(classifyTradeOutcome(closed, 100, "2026"), "winner");
  assert.equal(classifyTradeOutcome(closed, -100, "2026"), "loser");
  assert.equal(classifyTradeOutcome(closed, 0, "2026"), "incomplete");
  assert.equal(classifyTradeOutcome({ ...closed, status: "OPEN AT CUTOFF" }, 100, "2026"), "incomplete");
  assert.equal(classifyTradeOutcome({ ...closed, model_status: "Excluded" }, 100, "2026"), "incomplete");
  assert.equal(classifyTradeOutcome({ ...closed, audit_end_date: "2027-01-05" }, 100, "2026"), "incomplete");
});

test("outcome filter uses the selected-period modeled gain", () => {
  const trades = [
    { position_id: "W", entry_date: "2026-01-01", audit_end_date: "2026-02-01", status: "CLOSED", model_status: "Included" },
    { position_id: "L", entry_date: "2026-01-01", audit_end_date: "2026-02-01", status: "CLOSED", model_status: "Included" },
    { position_id: "I", entry_date: "2026-01-01", audit_end_date: "2026-09-10", status: "OPEN AT CUTOFF", model_status: "Included" },
  ];
  const gains = new Map([["W", 50], ["L", -20], ["I", 80]]);
  assert.deepEqual(
    filterTrades(trades, { year: "2026", outcome: "winner" }, (trade) => gains.get(trade.position_id)),
    [trades[0]],
  );
  assert.deepEqual(
    filterTrades(trades, { year: "2026", outcome: "incomplete" }, (trade) => gains.get(trade.position_id)),
    [trades[2]],
  );
});
