import { isFiniteNumber } from './trade-rules.js';

const positive = value => isFiniteNumber(value) && value > 0;
const validDate = value => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)
  && Number.isFinite(Date.parse(`${value}T00:00:00Z`))
  && new Date(`${value}T00:00:00Z`).toISOString().slice(0, 10) === value;
const nextDate = date => new Date(Date.parse(`${date}T00:00:00Z`) + 86400000).toISOString().slice(0, 10);

// This adapter does NOT edit source facts or synthesize historical market prices.
// It adds an explicitly labeled realization-only scenario for excluded lifecycles.
export function recoverClosedTrade(trade, cutoff) {
  const reject = reason => ({ positionId: trade.position_id, recovered: false, reason });
  if (trade.model_status === 'Included') return reject('Already in the original daily model');
  if (trade.status !== 'CLOSED') return reject('No explicit completed lifecycle');
  if (!['LONG', 'SHORT'].includes(trade.direction)) return reject('Unresolved direction');
  const original = trade.actions ?? [];
  const entry = original[0];
  const final = original.at(-1);
  if (entry?.type !== 'Entry' || entry.weight_before !== 0 || !positive(entry.weight_after)
    || !positive(entry.price) || !validDate(entry.date) || entry.date !== trade.entry_date) {
    return reject('Missing usable entry price, date, or weight');
  }
  if (final?.type !== 'Final exit' || !positive(final.price) || !validDate(final.date)
    || final.date !== trade.audit_end_date || final.date > cutoff
    || (isFiniteNumber(final.weight_after) && final.weight_after !== 0)) {
    return reject('Missing usable explicit final exit price or date');
  }
  if (original.some((a, i) => !validDate(a.date) || (i > 0 && a.date < original[i - 1].date))) {
    return reject('Invalid or unordered action dates');
  }
  // Mixed-price additions require a modeled dollar/share cash-flow ledger, not
  // multiplying a fixed-$100 pooled return by a changed dollar capital base.
  if (original.some(a => a.type === 'Add')) return reject('Capital addition needs resolved dated cash-flow reconstruction');

  let weight = 0, cost = 0, shares = 0, realized = 0;
  const effective = [], skipped = [];
  const sign = trade.direction === 'SHORT' ? -1 : 1;
  for (const action of original) {
    const before = weight;
    let after, pnl = null, added = null;
    if (action.type === 'Entry' || action.type === 'Add') {
      if (!positive(action.price) || !isFiniteNumber(action.weight_before)
        || !positive(action.weight_after - action.weight_before)
        || Math.abs(action.weight_before - weight) > 1e-9) {
        return reject('Unresolved capital addition or inconsistent add chain');
      }
      added = action.weight_after - action.weight_before;
      after = action.weight_after;
      cost += added;
      shares += added / action.price;
    } else if (action.type === 'Partial exit' || action.type === 'Final exit') {
      const finalExit = action.type === 'Final exit';
      const fraction = finalExit ? 1 : positive(action.weight_before) && isFiniteNumber(action.weight_after)
        ? (action.weight_before - action.weight_after) / action.weight_before : null;
      if (!positive(action.price) || !(fraction > 0 && fraction <= 1) || !(cost > 0)) {
        if (finalExit) return reject('Unusable final exit');
        skipped.push({ ...action, reason: 'Unusable partial-exit price or reduction; exposure held to a usable exit' });
        continue;
      }
      pnl = sign * (shares * fraction * action.price - cost * fraction);
      realized += pnl;
      cost *= 1 - fraction;
      shares *= 1 - fraction;
      after = before * (1 - fraction);
    } else return reject(`Unsupported action ${action.type}`);
    weight = after;
    effective.push({ ...action, weight_before: before, weight_after: after,
      capital_added: added, realized_pnl: pnl });
  }
  const byDate = new Map();
  for (const action of effective) {
    if (!byDate.has(action.date)) byDate.set(action.date, []);
    byDate.get(action.date).push(action);
  }
  const rows = [];
  let openCost = 0;
  for (let date = entry.date; date <= final.date; date = nextDate(date)) {
    let capitalBase = openCost, pnl = 0;
    for (const action of byDate.get(date) ?? []) {
      if (action.capital_added !== null) openCost += action.capital_added;
      else openCost *= action.weight_after / action.weight_before;
      capitalBase = Math.max(capitalBase, openCost);
      pnl += action.realized_pnl ?? 0;
    }
    if (!(capitalBase > 0)) return reject('No active capital base');
    rows.push({ date, position_id: trade.position_id, ticker: trade.ticker, direction: trade.direction,
      sector: trade.sector, capital_base: capitalBase, pnl,
      daily_return_on_capital: pnl / capitalBase, valuation_basis: 'Exit-only recognized P/L; not daily market marks' });
  }
  return { positionId: trade.position_id, recovered: true, sourcePnl: realized,
    returnOnOriginalCapital: realized / entry.weight_after, skipped,
    actions: effective, rows, reason: skipped.length ? 'Incomplete partial exits omitted; final-exit fallback' : 'Complete recorded actions; missing daily coverage' };
}

export function buildRecoveryScenario(payload) {
  const reviews = payload.trades.filter(t => t.model_status !== 'Included')
    .map(t => recoverClosedTrade(t, payload.metadata.cutoff_date));
  const byId = new Map(reviews.filter(r => r.recovered).map(r => [r.positionId, r]));
  const trades = payload.trades.map(t => {
    const recovery = byId.get(t.position_id);
    if (!recovery) return t;
    return { ...t, original_actions: t.actions, original_model_status: t.model_status,
      actions: recovery.actions, model_status: 'Included', recovery_basis: 'Exit-based estimate (no daily marks)',
      recovered_return_on_initial_capital: recovery.returnOnOriginalCapital,
      recovery_note: recovery.reason, omitted_partial_exits: recovery.skipped.length };
  });
  return { trades, dailyPositions: [...payload.daily_positions, ...reviews.flatMap(r => r.rows ?? [])], reviews };
}
