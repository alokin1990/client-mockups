const finite = Number.isFinite;
const positive = x => finite(x) && x > 0;
const validDate = x => /^\d{4}-\d{2}-\d{2}$/.test(x ?? '') && finite(Date.parse(x)) && new Date(x).toISOString().slice(0,10) === x;
const dayMs = 86400000;
export const nextDay = date => new Date(Date.parse(date) + dayMs).toISOString().slice(0,10);

// Eligibility is deliberately stricter than the old attribution model.
export function screenTrade(trade, cutoff) {
  const actions = trade.actions ?? [];
  if (!['LONG','SHORT'].includes(trade.direction)) return 'Unknown direction';
  if (actions[0]?.type !== 'Entry' || actions[0].weight_before !== 0) return 'No resolved initial entry';
  let weight = 0, lastDate = '', closed = false;
  for (const a of actions) {
    if (!validDate(a.date) || a.date > cutoff || a.date < lastDate) return 'Invalid or out-of-cutoff action date';
    if (!positive(a.price)) return 'Missing execution price';
    if (!finite(a.weight_before) || !finite(a.weight_after) || a.weight_after < 0) return 'Missing allocation weights';
    if (closed || Math.abs(a.weight_before-weight) > 1e-7) return 'Inconsistent allocation chain';
    if (['Entry','Add'].includes(a.type)) {
      if (a.weight_after <= weight || (a.type === 'Entry' && weight !== 0) || (a.type === 'Add' && weight <= 0)) return 'Invalid capital addition';
    } else if (a.type === 'Partial exit') {
      if (!(weight > a.weight_after && a.weight_after > 0)) return 'Invalid partial exit';
    } else if (a.type === 'Final exit') {
      if (weight <= 0 || a.weight_after !== 0) return 'Invalid final exit';
      closed = true;
    } else return 'Unsupported action';
    weight = a.weight_after; lastDate = a.date;
  }
  if ((trade.status === 'CLOSED') !== closed) return 'Closure status contradicts final action';
  return null;
}

// Pure cash/share replay. Never consumes source daily_return_on_capital.
export function buildDailyLedger({trades, marks = {}, cutoff, startingCapital = 100000}) {
  if (!positive(startingCapital) || !validDate(cutoff)) throw new Error('Invalid ledger parameters');
  const eligible = [], excluded = [];
  for (const trade of trades) {
    const reason = screenTrade(trade, cutoff);
    if (reason) excluded.push({trade, reason}); else eligible.push(trade);
  }
  const actionDays = new Map(), quoteState = new Map(), open = new Map();
  for (const trade of eligible) {
    for (const action of trade.actions) {
      const list = actionDays.get(action.date) ?? [];
      list.push({trade, action}); actionDays.set(action.date,list);
    }
    quoteState.set(trade.ticker, {quotes:(marks[trade.ticker] ?? []).filter(q => validDate(q.date) && positive(q.close)).sort((a,b)=>a.date.localeCompare(b.date)), index:0, latest:null});
  }
  const first = [...actionDays.keys()].sort()[0];
  if (!first) return {days:[], excluded, eligible, startingCapital};
  let cash = startingCapital, equity = startingCapital, realizedTotal = 0, previousUnrealized = 0;
  const days = [];
  for (let date = first; date <= cutoff; date = nextDay(date)) {
    const openingEquity = equity, events = [];
    for (const {trade,action:a} of (actionDays.get(date) ?? []).sort((a,b)=>a.trade.position_id.localeCompare(b.trade.position_id))) {
      const p = open.get(trade.position_id) ?? {trade, shares:0, cost:0, weight:0, executionMark:null};
      let cashFlow = 0, realized = 0, relievedCost = 0, quantity = 0;
      if (['Entry','Add'].includes(a.type)) {
        const dollars = (a.weight_after-a.weight_before)/100 * openingEquity;
        if (!positive(dollars)) throw new Error(`Nonpositive capital available on ${date}`);
        quantity = dollars/a.price; p.shares += quantity; p.cost += dollars;
        cashFlow = trade.direction === 'LONG' ? -dollars : dollars;
      } else {
        const fraction = a.type === 'Final exit' ? 1 : (a.weight_before-a.weight_after)/a.weight_before;
        quantity = p.shares*fraction; relievedCost = p.cost*fraction;
        const proceeds = quantity*a.price;
        realized = trade.direction === 'LONG' ? proceeds-relievedCost : relievedCost-proceeds;
        cashFlow = trade.direction === 'LONG' ? proceeds : -proceeds;
        p.shares -= quantity; p.cost -= relievedCost;
      }
      cash += cashFlow; realizedTotal += realized; p.weight = a.weight_after;
      p.executionMark = {date:a.date, close:a.price};
      if (p.weight === 0) open.delete(trade.position_id); else open.set(trade.position_id,p);
      events.push({positionId:trade.position_id,ticker:trade.ticker,direction:trade.direction,type:a.type,price:a.price,weightBefore:a.weight_before,weightAfter:a.weight_after,quantity,cashFlow,relievedCost,realized,sourceLink:a.source_link,warning:trade.recovery_note ?? ''});
    }
    let longValue = 0, shortLiability = 0, cost = 0, unrealized = 0;
    const positions = [];
    for (const p of open.values()) {
      const state = quoteState.get(p.trade.ticker);
      while (state.index < state.quotes.length && state.quotes[state.index].date <= date) state.latest = state.quotes[state.index++];
      // Executions are a known fallback. A newer execution supersedes an older quote.
      const quote = state.latest;
      const mark = quote && quote.date >= p.executionMark.date ? quote : p.executionMark;
      const provenance = mark === quote ? 'Cached close' : 'Execution fallback';
      const age = Math.round((Date.parse(date)-Date.parse(mark.date))/dayMs);
      const value = p.shares*mark.close;
      const u = p.trade.direction === 'LONG' ? value-p.cost : p.cost-value;
      if (p.trade.direction === 'LONG') longValue += value; else shortLiability += value;
      cost += p.cost; unrealized += u;
      positions.push({positionId:p.trade.position_id,ticker:p.trade.ticker,direction:p.trade.direction,sector:p.trade.sector,weight:p.weight,shares:p.shares,cost:p.cost,mark:mark.close,markDate:mark.date,age,provenance,markSource:mark.source??provenance,markSymbol:mark.symbol??p.trade.ticker,markCurrency:mark.currency??null,markBasis:mark.priceBasis??'Original nominal price basis',markUrl:mark.sourceUrl??null,proxy:Boolean(mark.proxy),value,unrealized:u,recovered:Boolean(p.trade.recovery_basis)});
    }
    equity = cash+longValue-shortLiability;
    const realized = events.reduce((sum,e)=>sum+e.realized,0);
    const pnl = equity-openingEquity, unrealizedChange = unrealized-previousUnrealized;
    const identityError = equity-(startingCapital+realizedTotal+unrealized);
    const dailyError = pnl-(realized+unrealizedChange);
    if (![equity,cash,identityError,dailyError].every(finite) || Math.max(Math.abs(identityError),Math.abs(dailyError)) > 1e-6) throw new Error(`Accounting reconciliation failed on ${date}`);
    days.push({date,openingEquity,equity,cash,longValue,shortLiability,activeNetValue:longValue-shortLiability,cost,unrealized,unrealizedChange,realized,realizedTotal,pnl,identityError,dailyError,positions,events,provisional:positions.some(p=>p.provenance !== 'Cached close' || p.age>3),carriedMarks:positions.filter(p=>p.age>0).length,negativeCash:cash<0});
    previousUnrealized = unrealized;
  }
  return {days,excluded,eligible,startingCapital};
}

export function selectRange(ledger, from, to) {
  const rows = ledger.days.filter(d=>d.date>=from && d.date<=to);
  return {rows,openingEquity:rows[0]?.openingEquity ?? null,endingEquity:rows.at(-1)?.equity ?? null,pnl:rows.length ? rows.at(-1).equity-rows[0].openingEquity : null};
}
