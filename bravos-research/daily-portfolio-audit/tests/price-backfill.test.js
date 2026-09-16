import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {exchangeDate,normalizeYahooHistory,mergePriceHistories,summarizePriceCoverage} from '../lib/price-backfill.js';
import {buildDailyLedger} from '../lib/ledger.js';
import {buildRecoveryScenario} from '../../trade-lifecycle-audit/lib/trade-recovery.js';
import {dailyCsv} from '../lib/csv.js';
const load=relative=>JSON.parse(fs.readFileSync(new URL(relative,import.meta.url),'utf8'));
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-6,`${a} != ${b}`);
test('Provider timestamps use the exchange date rather than accidentally using a UTC neighboring day',()=>{
 const ts=Date.parse('2026-01-02T00:30:00Z')/1000;
 assert.equal(exchangeDate(ts,'America/New_York'),'2026-01-01');
 assert.equal(exchangeDate(ts,'Asia/Tokyo'),'2026-01-02');
});
test('Yahoo normalization reverses later splits, ignores dividend-adjusted close, nulls and future marks',()=>{
 const timestamps=['2026-01-01','2026-01-02','2026-01-03','2026-01-04'].map(d=>Date.parse(d)/1000);
 const result={meta:{exchangeTimezoneName:'UTC'},timestamp:timestamps,events:{splits:{s:{date:timestamps[2],numerator:2,denominator:1}}},indicators:{quote:[{close:[50,null,60,70]}],adjclose:[{adjclose:[49,55,59,69]}]}};
 assert.deepEqual(normalizeYahooHistory(result,'2026-01-03'),[{date:'2026-01-01',close:100},{date:'2026-01-03',close:60}]);
 result.events.splits.s.denominator=0;
 assert.throws(()=>normalizeYahooHistory(result,'2026-01-03'),/Invalid split/);
});
test('Overlay merge preserves baseline and provenance, deduplicates dates and never consumes future or invalid rows',()=>{
 const baseline={X:[{date:'2026-01-01',close:10}],Y:[{date:'2026-01-01',close:5}]},saved=JSON.stringify(baseline);
 const overlay={marks:{X:[{date:'2026-01-02',close:12,source:'External',currency:'USD'}, {date:'2026-01-02',close:13,source:'External',currency:'USD'}, {date:'2026-01-03',close:50},{date:'2026-02-30',close:2},{date:'2026-01-01',close:-1}],Z:[]}};
 const merged=mergePriceHistories(baseline,overlay,'2026-01-02');
 assert.equal(JSON.stringify(baseline),saved);assert.equal(merged.Y,baseline.Y);
 assert.deepEqual(merged.X,[{date:'2026-01-02',close:13,source:'External',currency:'USD'}]);
 assert.ok(!('Z' in merged));
});
test('External marks change daily trend, not execution cash flows, and retain source currency/basis',()=>{
 const t={position_id:'T1',ticker:'BTCUSD',direction:'LONG',status:'CLOSED',actions:[{type:'Entry',date:'2026-01-01',price:100,weight_before:0,weight_after:5},{type:'Final exit',date:'2026-01-03',price:110,weight_before:5,weight_after:0}]};
 const l=buildDailyLedger({trades:[t],cutoff:'2026-01-03',marks:{BTCUSD:[{date:'2026-01-02',close:120,source:'External',currency:'USD',symbol:'BTC-USD',priceBasis:'As-traded'}]}});
 near(l.days[1].pnl,1000);near(l.days[2].pnl,-500);near(l.days[2].equity,100500);
 near(l.days[0].events[0].cashFlow,-5000);near(l.days[2].events[0].cashFlow,5500);
 assert.equal(l.days[1].positions[0].markCurrency,'USD');assert.equal(l.days[1].positions[0].markSource,'External');
 const csv=dailyCsv([l.days[1]],'Backfilled prices');
 assert.ok(csv.includes('priceMarks'));assert.ok(csv.includes('120 USD @ 2026-01-02; External; BTC-USD; As-traded'));
});
test('Real backfill has 15 explicit mappings, three unresolved assets, no source edits and reconciles both scenarios',()=>{
 const p=load('../../trade-lifecycle-audit/data/trades.json'),saved=JSON.stringify(p),baseline=load('../data/marks.json'),backfill=load('../data/price-backfill.json'),audit=load('../data/price-backfill-audit.json');
 const marks=mergePriceHistories(baseline.marks,backfill,p.metadata.cutoff_date);
 assert.equal(backfill.reviews.filter(r=>r.status==='Applied').length,15);
 assert.deepEqual(backfill.reviews.filter(r=>r.status==='Unresolved').map(r=>r.ticker).sort(),['BLD','HES','ORLA']);
 assert.equal(backfill.reviews.find(r=>r.ticker==='ALUM').symbol,'ALUM.L');
 assert.equal(backfill.reviews.find(r=>r.ticker==='AAVE/USDT').currency,'USDT');
 assert.ok(backfill.marks.BTCUSD.length>1000);assert.equal(baseline.marks.BTCUSD.length,0);
 for(const [ticker,rows] of Object.entries(backfill.marks))for(const q of rows){assert.ok(q.date<=p.metadata.cutoff_date);assert.ok(q.source&&q.sourceUrl&&q.currency&&q.symbol&&q.priceBasis);assert.ok(q.close>0);}
 for(const [name,trades] of [['original',p.trades],['recovery',buildRecoveryScenario(p).trades]]){
  const input=trades.filter(t=>t.model_status==='Included');
  const old=buildDailyLedger({trades:input,marks:baseline.marks,cutoff:p.metadata.cutoff_date}),fresh=buildDailyLedger({trades:input,marks,cutoff:p.metadata.cutoff_date});
  assert.deepEqual(fresh.eligible.map(t=>t.position_id),old.eligible.map(t=>t.position_id));
  assert.equal(p.trades.length-fresh.eligible.length,name==='original'?75:43);
  const summary=summarizePriceCoverage(fresh);
  near(summary.endingEquity,audit.scenarios[name].after.endingEquity);
  assert.ok(summary.fallbackPositionDays<audit.scenarios[name].before.fallbackPositionDays);
  for(const d of fresh.days){near(d.identityError,0);near(d.dailyError,0);assert.ok(d.positions.every(p=>p.markDate<=d.date));}
 }
 assert.equal(JSON.stringify(p),saved);
});
test('Daily page offers separate price-history and action-recovery controls with backfill selected first',()=>{
 const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
 assert.match(html,/<select id="price-history"><option value="backfilled">Backfilled prices<\/option><option value="original">Original cached prices<\/option>/);
 assert.ok(html.includes('id="calculation-basis"'));assert.ok(html.includes('id="price-review"'));
});
