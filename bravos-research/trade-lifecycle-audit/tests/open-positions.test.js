import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {applyOpenSnapshot,unrealizedPosition,summarizeUnrealized,ledgerSnapshotRows} from '../lib/open-positions.js';
import {classifyTradeOutcome,filterTrades} from '../lib/trade-rules.js';
import {buildPortfolioModel,tradeWinRate} from '../lib/portfolio-math.js';
import {buildRecoveryScenario} from '../lib/trade-recovery.js';
const read=p=>JSON.parse(fs.readFileSync(new URL(p,import.meta.url),'utf8'));
const payload=read('../data/trades.json'),snapshot=read('../data/open-positions.json');

test('Current list creates 16 open holdings at 75 points; old lifecycles are not reopened or invented',()=>{
 const before=JSON.stringify(payload),trades=applyOpenSnapshot(payload.trades,snapshot);
 assert.equal(trades.filter(t=>t.current_open).length,16);
 assert.equal(trades.filter(t=>t.current_open).reduce((s,t)=>s+t.current_weight,0),75);
 assert.equal(trades.find(t=>t.position_id==='P0001').display_status,'INCOMPLETE');
 assert.equal(trades.find(t=>t.position_id==='P0244').display_status,'INCOMPLETE');
 assert.equal(trades.find(t=>t.position_id==='P0183').display_status,'CLOSED');
 assert.equal(trades.filter(t=>t.ticker==='NTRA'&&t.current_open).length,1);
 const eog=trades.find(t=>t.ticker==='EOG');assert.equal(eog.display_status,'OPEN');assert.equal(eog.entry_date,null);assert.deepEqual(eog.actions,[]);
 assert.equal(trades.find(t=>t.position_id==='P0364').actions.at(-1).weight_after,5);
 assert.equal(JSON.stringify(payload),before);
});
test('Open and historical incomplete filters are distinct and open gains never affect count win rate',()=>{
 const trades=applyOpenSnapshot(payload.trades,snapshot),gain=()=>100;
 assert.equal(filterTrades(trades,{year:'2026',outcome:'open'},gain).length,16);
 assert.equal(filterTrades(trades,{year:'2025',outcome:'open'},gain).length,0);
 assert.ok(filterTrades(trades,{outcome:'incomplete'},gain).every(t=>!t.current_open));
 const open=trades.find(t=>t.ticker==='NTRA'&&t.current_open);
 assert.equal(classifyTradeOutcome(open,100),'open');
 assert.equal(tradeWinRate(['open','winner','loser','incomplete']),.5);
});
test('Unrealized pooled shares retain additions and trims, exclude realized gains, and handle shorts',()=>{
 const t={position_id:'T',ticker:'T',direction:'LONG',current_open:true,current_weight:4,model_status:'Included',actions:[
  {date:'2026-01-01',type:'Entry',price:100,weight_before:0,weight_after:5},
  {date:'2026-01-02',type:'Add',price:120,weight_before:5,weight_after:8},
  {date:'2026-01-03',type:'Partial exit',price:140,weight_before:8,weight_after:4} ]};
 const model={actionCapitalAfter:new Map([['T|2026-01-01|0',5000],['T|2026-01-02|1',8300],['T|2026-01-03|2',4150]])};
 const r=unrealizedPosition(t,model,{date:'2026-09-10',close:150},snapshot);
 assert.equal(r.shares,38.75);assert.equal(r.cost,4150);assert.equal(r.value,5812.5);assert.equal(r.unrealized,1662.5);
 assert.equal(unrealizedPosition({...t,direction:'SHORT'},model,{date:'2026-09-10',close:150},snapshot).unrealized,-1662.5);
 assert.equal(unrealizedPosition({...t,current_weight:5},model,{date:'2026-09-10',close:150},snapshot).unrealized,null);
 assert.equal(unrealizedPosition(t,model,{date:'2026-09-17',close:150},snapshot).unrealized,null);
 assert.equal(unrealizedPosition(t,model,null,snapshot).unrealized,null);
 assert.equal(unrealizedPosition({...t,actions:[...t.actions,{...t.actions[1],date:'2027-01-01'}]},model,{date:'2027-01-02',close:150},{price_cutoff:'2027-01-02'}).unrealized,null);
 assert.equal(summarizeUnrealized([{unrealized:null}]).total,null);
 assert.equal(summarizeUnrealized([{unrealized:0},{unrealized:-5},{unrealized:null}]).total,-5);
});
test('Both calculation bases value 14 matches, flag BRK.B/EOG and leave portfolio returns unchanged',()=>{
 const original=buildPortfolioModel({trades:payload.trades,dailyPositions:payload.daily_positions});
 for(const p of [payload,buildRecoveryScenario(payload)]){
  const trades=applyOpenSnapshot(p.trades,snapshot);
  const model=buildPortfolioModel({trades,dailyPositions:p.dailyPositions??p.daily_positions});
  const rows=trades.filter(t=>t.current_open).map(t=>unrealizedPosition(t,model,snapshot.marks[t.ticker],snapshot));
  assert.equal(summarizeUnrealized(rows).covered,14);assert.equal(summarizeUnrealized(rows).missing,2);
  assert.equal(rows.find(r=>r.ticker==='BRK.B').unrealized,null);assert.equal(rows.find(r=>r.ticker==='EOG').unrealized,null);
  if(p===payload)assert.deepEqual(model.yearly,original.yearly);
 }
 const allMarks=read('../../daily-portfolio-audit/data/marks.json').marks;
 for(const [ticker,mark] of Object.entries(snapshot.marks))assert.deepEqual(mark,allMarks[ticker].filter(q=>q.date<=snapshot.price_cutoff).at(-1));
});
test('Daily snapshot uses residual ledger P/L, not total realized-plus-unrealized P/L or snapshot reweighting',()=>{
 const rows=ledgerSnapshotRows(snapshot,{positions:[{positionId:'P0338',weight:2,cost:2000,value:2500,unrealized:500,markDate:'2026-09-10'},
  {positionId:'P0364',weight:5,cost:5000,value:5100,unrealized:100,markDate:'2026-09-10'}]});
 assert.equal(rows.find(r=>r.ticker==='NTRA').unrealized,500);
 assert.equal(rows.find(r=>r.ticker==='BRK.B').unrealized,null);
 assert.equal(summarizeUnrealized(rows).total,500);
});
