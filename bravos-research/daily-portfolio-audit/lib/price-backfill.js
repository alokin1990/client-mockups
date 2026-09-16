// Price preparation only. No trade actions, cash-flow rules or execution-price edits.
const validDate = x => /^\d{4}-\d{2}-\d{2}$/.test(x ?? '') && Number.isFinite(Date.parse(x)) && new Date(x).toISOString().slice(0,10) === x;
const positive = x => Number.isFinite(x) && x > 0;
export function exchangeDate(timestamp, timezone = 'UTC') {
  const parts = new Intl.DateTimeFormat('en-US', {timeZone:timezone,year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date(timestamp*1000));
  const get = type => parts.find(p=>p.type===type).value;
  return `${get('year')}-${get('month')}-${get('day')}`;
}
export function normalizeYahooHistory(result, cutoff) {
  const splits=Object.values(result.events?.splits ?? {}).map(s=>({timestamp:Number(s.date),ratio:Number(s.numerator)/Number(s.denominator)}));
  if(splits.some(s=>!positive(s.ratio)||!Number.isFinite(s.timestamp)))throw new Error('Invalid split event');
  const closes=result.indicators?.quote?.[0]?.close ?? [];
  const rows=(result.timestamp ?? []).map((ts,i)=>({date:exchangeDate(ts,result.meta?.exchangeTimezoneName),close:closes[i]==null?null:closes[i]*splits.filter(s=>s.timestamp>ts).reduce((f,s)=>f*s.ratio,1)}));
  return rows.filter(q=>validDate(q.date)&&q.date<=cutoff&&positive(q.close));
}
export function mergePriceHistories(baseline, backfill, cutoff) {
  const result={...baseline};
  for(const [ticker,rows] of Object.entries(backfill.marks ?? {})) {
    const byDate=new Map();
    for(const q of rows)if(validDate(q.date)&&q.date<=cutoff&&positive(q.close))byDate.set(q.date,{...q});
    if(byDate.size)result[ticker]=[...byDate.values()].sort((a,b)=>a.date.localeCompare(b.date));
  }
  return result;
}
export function summarizePriceCoverage(ledger) {
  const gaps=new Map();let fallbackPositionDays=0, stalePositionDays=0;
  for(const day of ledger.days)for(const p of day.positions) {
    const fallback=p.provenance!=='Cached close',stale=p.age>3;
    if(fallback)fallbackPositionDays++;
    if(stale)stalePositionDays++;
    if(fallback||stale){const gap=gaps.get(p.ticker)??{ticker:p.ticker,positionDays:0,first:day.date,last:day.date};gap.positionDays++;gap.last=day.date;gaps.set(p.ticker,gap);}
  }
  return {eligible:ledger.eligible.length,endingEquity:ledger.days.at(-1)?.equity??null,provisionalDays:ledger.days.filter(d=>d.provisional).length,fallbackPositionDays,stalePositionDays,negativeCashDays:ledger.days.filter(d=>d.negativeCash).length,maxIdentityError:Math.max(0,...ledger.days.map(d=>Math.abs(d.identityError))),maxDailyError:Math.max(0,...ledger.days.map(d=>Math.abs(d.dailyError))),gaps:[...gaps.values()].sort((a,b)=>b.positionDays-a.positionDays)};
}
