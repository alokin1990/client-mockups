import test from 'node:test';
import assert from 'node:assert/strict';
import {buildDailyLedger,screenTrade,selectRange} from '../lib/ledger.js';
import fs from 'node:fs';
import {buildRecoveryScenario} from '../../trade-lifecycle-audit/lib/trade-recovery.js';
import {dailyCsv} from '../lib/csv.js';
import {wholeDollar} from '../lib/display.js';
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-6,`${a} != ${b}`);
const action=(date,type,before,after,price)=>({date,type,weight_before:before,weight_after:after,price});
test('Summary formatting rounds dollars only; inputs and CSV preserve precise values',()=>{
 assert.equal(wholeDollar(111873.05547377051),'$111,873');
 assert.equal(wholeDollar(33598.29),'$33,598');
 assert.equal(wholeDollar(78274.76),'$78,275');
 assert.equal(wholeDollar(-6116.74),'-$6,117');
 assert.equal(wholeDollar(0),'$0');assert.equal(wholeDollar(null),'—');
 const value=124764.8394766059;wholeDollar(value);assert.equal(value,124764.8394766059);
});
const trade=(actions,direction='LONG')=>({position_id:'T1',ticker:'X',direction,status:actions.at(-1)?.type==='Final exit'?'CLOSED':'OPEN AT CUTOFF',actions});
test('Sale realizes existing profit once; cash plus active value reconciles',()=>{
 const t=trade([action('2025-12-31','Entry',0,5,100),action('2026-01-02','Partial exit',5,4,120),action('2026-01-03','Final exit',4,0,110)]);
 const l=buildDailyLedger({trades:[t],marks:{X:[{date:'2026-01-01',close:120}]},cutoff:'2026-01-03'});
 near(l.days[0].cash,95000);near(l.days[0].equity,100000);
 near(l.days[1].pnl,1000);near(l.days[1].unrealized,1000);
 near(l.days[2].cash,96200);near(l.days[2].realized,200);near(l.days[2].pnl,0);
 near(l.days[3].cash,100600);near(l.days[3].realized,400);near(l.days[3].pnl,-400);
 near(l.days[3].unrealized,0);near(l.days[3].realizedTotal,600);
 const range=selectRange(l,'2026-01-01','2026-01-03');near(range.openingEquity,100000);near(range.pnl,600);
});
test('Adds use changed opening equity and pooled share cost, not daily sleeve resizing',()=>{
 const t=trade([action('2026-01-01','Entry',0,5,100),action('2026-01-03','Add',5,8,200),action('2026-01-04','Final exit',8,0,150)]);
 const l=buildDailyLedger({trades:[t],marks:{X:[{date:'2026-01-02',close:200}]},cutoff:'2026-01-04'});
 near(l.days[2].events[0].cashFlow,-3150);near(l.days[2].positions[0].shares,65.75);
 near(l.days[3].realized,1712.5);near(l.days[3].equity,101712.5);
});
test('Short sale proceeds create liabilities; rising marks and covers produce losses',()=>{
 const t=trade([action('2026-01-01','Entry',0,5,100),action('2026-01-03','Final exit',5,0,120)],'SHORT');
 const l=buildDailyLedger({trades:[t],marks:{X:[{date:'2026-01-02',close:120}]},cutoff:'2026-01-03'});
 near(l.days[0].cash,105000);near(l.days[0].shortLiability,5000);near(l.days[0].equity,100000);
 near(l.days[1].pnl,-1000);near(l.days[2].realized,-1000);near(l.days[2].pnl,0);near(l.days[2].equity,99000);
});
test('Future quotes never fill earlier days; fallback marks are explicitly provisional',()=>{
 const t=trade([action('2026-01-01','Entry',0,5,100)]);
 const l=buildDailyLedger({trades:[t],marks:{X:[{date:'2026-01-03',close:130}]},cutoff:'2026-01-03'});
 near(l.days[1].equity,100000);assert.equal(l.days[1].positions[0].markDate,'2026-01-01');assert.equal(l.days[1].provisional,true);
 near(l.days[2].equity,101500);assert.equal(l.days[2].provisional,false);
});
test('Inconsistent chains, missing actions, partial-only closures are rejected',()=>{
 assert.ok(screenTrade(trade([action('2026-01-01','Entry',0,2,100),action('2026-01-02','Partial exit',5,3,110)]),'2026-01-03'));
 const t=trade([action('2026-01-01','Entry',0,5,100),action('2026-01-02','Partial exit',5,4,110)]);t.status='CLOSED';assert.ok(screenTrade(t,'2026-01-03'));
 assert.ok(screenTrade(trade([]),'2026-01-03'));
});
test('Real dataset reconciles every continuous day; range does not reset account',()=>{
 const p=JSON.parse(fs.readFileSync(new URL('../../trade-lifecycle-audit/data/trades.json',import.meta.url)));
 const {marks}=JSON.parse(fs.readFileSync(new URL('../data/marks.json',import.meta.url)));
 const l=buildDailyLedger({trades:p.trades.filter(t=>t.model_status==='Included'),marks,cutoff:p.metadata.cutoff_date});
 assert.ok(l.days.length>800);assert.ok(l.excluded.some(x=>x.trade.position_id==='P0078'));
 for(const d of l.days){near(d.identityError,0);near(d.dailyError,0);near(d.cash+d.longValue-d.shortLiability,d.equity);}
 const range=selectRange(l,'2026-01-01','2026-09-10');near(range.pnl,range.rows.reduce((s,d)=>s+d.pnl,0));
 assert.notEqual(range.openingEquity,100000);
});
test('Same-day entries share opening equity and preserve separately marked positions',()=>{
 const a=trade([action('2026-01-01','Entry',0,5,100)]);
 const b={...trade([action('2026-01-01','Entry',0,3,50)]),position_id:'T2',ticker:'Y'};
 const l=buildDailyLedger({trades:[a,b],marks:{X:[{date:'2026-01-01',close:110}],Y:[{date:'2026-01-01',close:45}]},cutoff:'2026-01-01'});
 near(l.days[0].cash,92000);near(l.days[0].pnl,200);near(l.days[0].equity,100200);
 near(l.days[0].events[1].cashFlow,-3000);
});
test('Recovery scenario preserves original sources and daily identities; no fabricated quotes',()=>{
 const p=JSON.parse(fs.readFileSync(new URL('../../trade-lifecycle-audit/data/trades.json',import.meta.url)));
 const snapshot=JSON.stringify(p);
 const {marks}=JSON.parse(fs.readFileSync(new URL('../data/marks.json',import.meta.url)));
 const scenario=buildRecoveryScenario(p);
 const l=buildDailyLedger({trades:scenario.trades.filter(t=>t.model_status==='Included'),marks,cutoff:p.metadata.cutoff_date});
 assert.equal(l.eligible.length,324);assert.equal(JSON.stringify(p),snapshot);
 assert.equal(l.eligible.find(t=>t.position_id==='P0268').actions.length,3);
 for(const d of l.days){near(d.identityError,0);near(d.dailyError,0);assert.ok(d.positions.every(p=>p.markDate<=d.date));}
 near(l.days.at(-1).equity,124764.8394766059);
});
test('CSV exports exactly the selected daily range, with basis, full precision and escaped text',()=>{
 const l=buildDailyLedger({trades:[trade([action('2026-01-01','Entry',0,5,100)])],cutoff:'2026-01-03'});
 const r=selectRange(l,'2026-01-02','2026-01-03');
 const csv=dailyCsv(r.rows,'Test "basis"');assert.equal(csv.split('\r\n').length,3);
 assert.ok(csv.includes('calculationBasis'));assert.ok(csv.includes('"Test ""basis"""'));
 assert.ok(csv.includes('2026-01-02'));assert.ok(!csv.includes('2026-01-01'));
});
