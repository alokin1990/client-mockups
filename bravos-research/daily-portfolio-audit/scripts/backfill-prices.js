import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {buildDailyLedger} from '../lib/ledger.js';
import {buildRecoveryScenario} from '../../trade-lifecycle-audit/lib/trade-recovery.js';
import {exchangeDate,normalizeYahooHistory,mergePriceHistories,summarizePriceCoverage} from '../lib/price-backfill.js';
const dir=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const archive=path.resolve(dir,'../../../bravos_portfolio_scrape');
const payload=JSON.parse(await fs.readFile(path.resolve(dir,'../trade-lifecycle-audit/data/trades.json'),'utf8'));
const baseline=JSON.parse(await fs.readFile(path.join(dir,'data/marks.json'),'utf8'));
const caches=await Promise.all(['historical_quote_cache.json','model_period_quote_cache.json'].map(async file=>({file,...JSON.parse(await fs.readFile(path.join(archive,file),'utf8'))})));
const recovery=buildRecoveryScenario(payload);
const usable=recovery.trades.filter(t=>t.model_status==='Included');
// Explicit instrument mappings. Do not reuse arbitrary first-lifecycle CSV mappings.
const mappings=[
 ['BTCUSD','BTC-USD','USD','Exact crypto pair'],['ETHUSD','ETH-USD','USD','Exact crypto pair'],['SOLUSD','SOL-USD','USD','Exact crypto pair'],
 ['ALA','ALA.TO','CAD','Canadian listing; FX excluded'],['U.UN','U-UN.TO','CAD','Canadian listing; FX excluded'],
 ['COCOA','CC=F','USD','Continuous futures proxy; actual contract unknown'],['NATGAS','NG=F','USD','Continuous futures proxy; actual contract unknown'],
 ['TRXUSD','TRX-USD','USD','Exact crypto pair'],['XRPUSD','XRP-USD','USD','Exact crypto pair'],
 ['US_SMALL_CAP_2000','^RUT','USD','Russell 2000 index proxy; CFD details unknown'],
 ['6988','6988.T','JPY','Nitto Denko Tokyo listing; FX excluded'],['3988/BACHF','3988.HK','HKD','Bank of China HK listing, not OTC USD; FX excluded'],
 ['ALUM','ALUM.L','USD','WisdomTree Aluminium LSE USD ETC, not aluminium futures'],
 ['FI','FISV','USD','Fiserv historical ticker change'],['ORLA','ORLA','USD','US-listed Orla Mining'],['HES','HES','USD','Hess historical stock'],['BLD','BLD','USD','TopBuild historical stock'],
 ['AAVE/USDT','AAVEUSDT','USDT','Exact Binance spot AAVE/USDT pair; USDT not converted to USD']
].map(([ticker,symbol,currency,note])=>({ticker,symbol,currency,note}));
const cutoff=payload.metadata.cutoff_date, fetchedAt=new Date().toISOString();
const marks={},reviews=[];
await fs.mkdir(path.join(archive,'price-backfill-raw'),{recursive:true});
async function download(mapping,start) {
 // Include prior sessions: an alert date may be an exchange holiday.
 const period1=Math.floor(Date.parse(start+'T00:00:00Z')/1000)-14*86400;
 // Fetch through today to capture later split events; never use later prices in the model.
 const period2=Math.floor(Date.now()/1000)+86400;
 if(mapping.currency==='USDT') {
  const url=`https://data-api.binance.vision/api/v3/klines?symbol=${mapping.symbol}&interval=1d&startTime=${period1*1000}&endTime=${Date.parse(cutoff+'T23:59:59Z')}&limit=1000`;
  const response=await fetch(url,{signal:AbortSignal.timeout(20000)});
  if(!response.ok)throw new Error(`Binance HTTP ${response.status}`);
  const raw=await response.json();
  if(!Array.isArray(raw))throw new Error('Invalid Binance candle response');
  await fs.writeFile(path.join(archive,'price-backfill-raw',mapping.ticker.replace(/[^a-z0-9]/gi,'_')+'.json'),JSON.stringify({url,fetched_at:fetchedAt,raw}));
  return {rows:raw.map(q=>({date:exchangeDate(q[0]/1000,'UTC'),close:Number(q[4])})).filter(q=>q.date<=cutoff&&Number.isFinite(q.close)&&q.close>0),source:'Binance public spot daily close',url,fetchTime:fetchedAt,basis:'Unadjusted exact AAVE/USDT daily close, UTC; USDT not assumed equal to USD'};
 }
 let lastError;
 for(const host of ['query1','query2']) {
  const url=`https://${host}.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(mapping.symbol)}?period1=${period1}&period2=${period2}&interval=1d&events=div%2Csplits`;
  try {
   const response=await fetch(url,{headers:{'user-agent':'Mozilla/5.0'},signal:AbortSignal.timeout(20000)});
   if(!response.ok)throw new Error(`HTTP ${response.status}`);
   const raw=await response.json(),result=raw.chart?.result?.[0];
   if(!result)throw new Error(raw.chart?.error?.description??'No chart result');
   await fs.writeFile(path.join(archive,'price-backfill-raw',mapping.ticker.replace(/[^a-z0-9]/gi,'_')+'.json'),JSON.stringify({url,fetched_at:fetchedAt,raw}));
   if(result.meta?.currency!==mapping.currency)throw new Error(`Currency mismatch: expected ${mapping.currency}, received ${result.meta?.currency}`);
   const activeSplits=Object.values(result.events?.splits??{}).map(s=>exchangeDate(s.date,result.meta?.exchangeTimezoneName));
   if(activeSplits.some(date=>usable.some(t=>t.ticker===mapping.ticker&&date>=t.entry_date&&date<=t.audit_end_date)))throw new Error('Split during an active lifecycle needs share-ledger split support');
   return {rows:normalizeYahooHistory(result,cutoff),source:'Yahoo Finance public historical close',url,fetchTime:fetchedAt,basis:'As-traded close; later reported split factors reversed; dividends excluded'};
  } catch(error) {lastError=error.message;}
 }
 throw new Error(lastError);
}
async function run(mapping) {
 const trades=usable.filter(t=>t.ticker===mapping.ticker);
 const start=trades.map(t=>t.entry_date).filter(Boolean).sort()[0];
 if(!start)return {...mapping,status:'Not used',reason:'No eligible source-action lifecycle'};
 try {
  const cache=caches.map(c=>({cache:c,rows:(c.quotes[mapping.symbol]??[]).filter(q=>q.date<=cutoff)})).sort((a,b)=>b.rows.length-a.rows.length)[0];
  let data;
  if(cache.rows.length&&cache.rows[0].date<=start&&cache.rows.at(-1).date>=trades.map(t=>t.audit_end_date).sort().at(-1))data={rows:cache.rows,source:cache.cache.source,url:`https://finance.yahoo.com/quote/${encodeURIComponent(mapping.symbol)}/history/`,fetchTime:cache.cache.fetched_at,basis:'Existing archive as-traded close; prior split reversal preserved',cacheFile:cache.cache.file};
  else data=await download(mapping,start);
  if(!data.rows.length)throw new Error('No usable historical rows');
  const checks=[];
  for(const trade of trades)for(const a of trade.actions) {
   const q=data.rows.filter(q=>q.date<=a.date).at(-1);
   if(!q||!Number.isFinite(q.close)||q.close<=0||!Number.isFinite(a.price)||a.price<=0)continue;
   const age=Math.round((Date.parse(a.date)-Date.parse(q.date))/86400000),ratio=q.close/a.price;
   checks.push({positionId:trade.position_id,date:a.date,actionPrice:a.price,markDate:q.date,close:q.close,ratio,age});
   if(age<=4&&(ratio<0.7||ratio>1.3))throw new Error(`Price scale mismatch ${trade.position_id} ${a.date}: close/action=${ratio.toFixed(3)}`);
  }
  if(!checks.some(c=>c.date===start&&c.age<=4))throw new Error('No recent mark at first eligible entry; history still incomplete');
  marks[mapping.ticker]=data.rows.map(q=>({date:q.date,close:q.close,source:data.source,symbol:mapping.symbol,currency:mapping.currency,priceBasis:data.basis,sourceUrl:data.url,proxy:/proxy/.test(mapping.note)}));
  return {...mapping,status:'Applied',quoteCount:marks[mapping.ticker].length,first:data.rows[0].date,last:data.rows.at(-1).date,source:data.source,url:data.url,fetched_at:data.fetchTime,price_basis:data.basis,cacheFile:data.cacheFile,checks};
 }catch(error){return {...mapping,status:'Unresolved',reason:error.message};}
}
// Three workers, deterministic result order, timeouts, no unbounded retries.
let cursor=0;const results=new Array(mappings.length);
await Promise.all(Array.from({length:3},async()=>{while(cursor<mappings.length){const i=cursor++;results[i]=await run(mappings[i]);console.log(`${results[i].ticker}: ${results[i].status} ${results[i].reason??results[i].quoteCount}`);}}));
reviews.push(...results);
const backfill={metadata:{fetched_at:fetchedAt,cutoff_date:cutoff,baseline:'data/marks.json',policy:'Missing-history overlay only; source executions and lifecycle eligibility unchanged',currency_note:'Marks match nominal action-price units; FX returns not modeled'},reviews,marks};
const improved=mergePriceHistories(baseline.marks,backfill,cutoff),comparison={metadata:backfill.metadata,applied:reviews.filter(r=>r.status==='Applied').length,unresolved:reviews.filter(r=>r.status==='Unresolved'),scenarios:{}};
for(const [name,trades] of [['original',payload.trades],['recovery',recovery.trades]]) {
 const input=trades.filter(t=>t.model_status==='Included');
 const oldLedger=buildDailyLedger({trades:input,marks:baseline.marks,cutoff}),newLedger=buildDailyLedger({trades:input,marks:improved,cutoff});
 const before=summarizePriceCoverage(oldLedger),after=summarizePriceCoverage(newLedger);
 comparison.scenarios[name]={before,after,endingEquityChange:after.endingEquity-before.endingEquity,excluded:payload.trades.length-after.eligible,changedDays:newLedger.days.filter((d,i)=>Math.abs(d.equity-oldLedger.days[i].equity)>1e-6).length,maxDailyPnlChange:Math.max(...newLedger.days.map((d,i)=>Math.abs(d.pnl-oldLedger.days[i].pnl))),yearRanges:[...new Set(newLedger.days.map(d=>d.date.slice(0,4)))].map(year=>{const old=oldLedger.days.filter(d=>d.date.startsWith(year)),fresh=newLedger.days.filter(d=>d.date.startsWith(year));return {year,beforePnl:old.at(-1).equity-old[0].openingEquity,afterPnl:fresh.at(-1).equity-fresh[0].openingEquity};})};
}
await fs.writeFile(path.join(dir,'data/price-backfill.json'),JSON.stringify(backfill));
await fs.writeFile(path.join(dir,'data/price-backfill-audit.json'),JSON.stringify(comparison,null,2)+'\n');
console.log(JSON.stringify({applied:comparison.applied,unresolved:comparison.unresolved,scenarios:Object.fromEntries(Object.entries(comparison.scenarios).map(([k,v])=>[k,{before:v.before.endingEquity,after:v.after.endingEquity,change:v.endingEquityChange,provisionalBefore:v.before.provisionalDays,provisionalAfter:v.after.provisionalDays,excluded:v.excluded}]))},null,2));
