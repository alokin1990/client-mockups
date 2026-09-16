import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { recoverClosedTrade, buildRecoveryScenario } from '../lib/trade-recovery.js';
import { buildPortfolioModel, getTradeStats } from '../lib/portfolio-math.js';
import { auditDataset } from '../lib/data-audit.js';
import { getTradeReviewLinks } from '../lib/review-links.js';
const payload = JSON.parse(await readFile(new URL('../data/trades.json', import.meta.url), 'utf8'));
const clone = value => structuredClone(value);
const alum = payload.trades.find(t => t.position_id === 'P0268');
const near = (a,b) => assert.ok(Math.abs(a-b)<1e-8, `${a} != ${b}`);

test('ALUM retains its complete trim and has independently reconciled fixed-basis gain', () => {
  const r = recoverClosedTrade(alum, payload.metadata.cutoff_date);
  assert.equal(r.recovered, true);
  assert.equal(r.skipped.length, 0);
  near(r.sourcePnl, (4.53/3.85-1) + 4*(4.615/3.85-1));
  near(r.returnOnOriginalCapital, r.sourcePnl/5);
  near(r.rows.reduce((s,x)=>s+x.pnl,0), r.sourcePnl);
  assert.equal(r.rows.length, 174);
  assert.equal(r.rows.at(-1).date, '2026-06-10');
  assert.equal(r.actions.at(-1).weight_after, 0);
});

test('incomplete trim is omitted, full exposure exits at the explicit final price, and sources remain intact', () => {
  const t = clone(alum); t.actions[1].price = null;
  const saved = JSON.stringify(t);
  const r = recoverClosedTrade(t, payload.metadata.cutoff_date);
  assert.equal(r.skipped.length, 1);
  assert.equal(r.actions.length, 2);
  near(r.sourcePnl, 5*(4.615/3.85-1));
  assert.equal(r.actions.at(-1).weight_before, 5);
  assert.equal(JSON.stringify(t), saved);
  const p = { ...payload, trades:[t], daily_positions:[] };
  const s = buildRecoveryScenario(p);
  assert.equal(getTradeReviewLinks(s.trades[0]).length, 3);
});

test('missing partial weight uses final-exit fallback and shorts include losses without double inversion', () => {
  const t = clone(alum); t.actions[1].weight_after = null; t.direction = 'SHORT';
  const r = recoverClosedTrade(t, payload.metadata.cutoff_date);
  near(r.sourcePnl, -5*(4.615/3.85-1));
  const m = buildPortfolioModel({trades:[{...t,actions:r.actions}],dailyPositions:r.rows});
  near(getTradeStats(m,t.position_id,'2026').gainLoss, r.sourcePnl*1000);
});

test('open lifecycles, unknown entries/adds, invalid dates and missing final exits are never invented', () => {
  for (const change of [t=>t.status='OPEN AT CUTOFF', t=>t.actions[0].price=null,
    t=>t.actions[0].weight_after=null, t=>t.actions.at(-1).price=null,
    t=>t.actions.at(-1).type='Partial exit', t=>t.actions[1].type='Add',
    t=>t.actions[0].date='2025-99-99']) {
    const t = clone(alum); change(t);
    assert.equal(recoverClosedTrade(t,payload.metadata.cutoff_date).recovered,false);
  }
});

test('year-crossing recovery recognizes P/L at exits rather than fabricating year-boundary marks', () => {
  const r = recoverClosedTrade(alum,payload.metadata.cutoff_date);
  const m = buildPortfolioModel({trades:[{...alum,actions:r.actions}],dailyPositions:r.rows});
  near(m.yearly.find(y=>y.year==='2025').gainLoss,0);
  near(m.yearly.find(y=>y.year==='2026').gainLoss,r.sourcePnl*1000);
});

test('reviewed dataset recovers 32 trades, keeps 40 excluded, includes losses, preserves baseline and reconciles', () => {
  const original = JSON.stringify(payload);
  const s = buildRecoveryScenario(payload);
  const recovered = s.reviews.filter(r=>r.recovered);
  assert.equal(recovered.length,32);
  assert.equal(recovered.filter(r=>r.skipped.length).length,21);
  assert.ok(recovered.some(r=>r.sourcePnl<0));
  assert.ok(recovered.some(r=>Math.abs(r.sourcePnl)<1e-9));
  assert.equal(JSON.stringify(payload),original);
  const audit = auditDataset({...payload,trades:s.trades,daily_positions:s.dailyPositions});
  assert.deepEqual(audit.criticalIssues,[]);
  const m = buildPortfolioModel({trades:s.trades,dailyPositions:s.dailyPositions});
  const expected = {2024:4195.27845089561,2025:12781.928705639846,2026:6472.38923967359};
  for (const y of m.yearly) {
    near(y.gainLoss,expected[y.year]);
    near(s.trades.reduce((sum,t)=>sum+(getTradeStats(m,t.position_id,y.year)?.gainLoss??0),0),y.gainLoss);
  }
});
