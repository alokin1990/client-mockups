import {buildDailyLedger,selectRange} from './lib/ledger.js';
import {dailyCsv} from './lib/csv.js';
import {wholeDollar} from './lib/display.js';
import {buildRecoveryScenario} from '../trade-lifecycle-audit/lib/trade-recovery.js';
import {ledgerSnapshotRows,summarizeUnrealized} from '../trade-lifecycle-audit/lib/open-positions.js';
import {mergePriceHistories} from './lib/price-backfill.js';
const $=id=>document.getElementById(id), esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const money=x=>x==null?'—':new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',minimumFractionDigits:2}).format(x);
const number=x=>new Intl.NumberFormat('en-US',{maximumFractionDigits:4}).format(x);
const signed=(x,format=money)=>`<span class="${x<0?'negative':x>0?'positive':''}">${x>0?'+':''}${format(x)}</span>`;
const recoveryEnabled=()=>$('calculation-basis').value==='recovered';
let payload, marks, ledger, range, selected, excluded, coverageText, openSnapshot, originalMarks, priceBackfill, priceAudit;
const backfillEnabled=()=>$('price-history').value==='backfilled';
function rebuild(){
 marks=backfillEnabled()?mergePriceHistories(originalMarks,priceBackfill,payload.metadata.cutoff_date):originalMarks;
 const source=recoveryEnabled() ? buildRecoveryScenario(payload).trades : payload.trades;
 ledger=buildDailyLedger({trades:source.filter(t=>t.model_status==='Included'),marks,cutoff:payload.metadata.cutoff_date});
 excluded=[...source.filter(t=>t.model_status!=='Included').map(trade=>({trade,reason:trade.model_status})),...ledger.excluded];
 $('coverage').textContent=`${ledger.eligible.length} of ${payload.trades.length} lifecycles covered; ${excluded.length} excluded. Starts once at $100,000 on ${ledger.days[0].date}. ${recoveryEnabled()?'32 action recoveries are included; omitted trims remain estimates.':'Original daily-covered source actions only; action recoveries are off.'} Price history: ${backfillEnabled()?'backfilled':'original cache'}. Date filters do not reset equity. The daily ledger uses actual modeled shares, not the old source-return multiplier.`;
 $('excluded-label').textContent=`${excluded.length} excluded records — see reasons`;
 $('excluded').innerHTML=excluded.map(x=>`<div>${esc(x.trade.position_id)} · ${esc(x.trade.ticker)} — ${esc(x.reason)}</div>`).join('');
 coverageText=$('coverage').textContent;
 renderPriceReview();
 renderOpenSnapshot();
 renderRange();
}
function renderPriceReview(){
 const applied=priceBackfill.reviews.filter(r=>r.status==='Applied'),unresolved=priceBackfill.reviews.filter(r=>r.status==='Unresolved');
 const comparison=priceAudit.scenarios[recoveryEnabled()?'recovery':'original'];
 $('price-coverage').textContent=`${backfillEnabled()?'Backfilled prices ON':'Original prices selected'}: ${applied.length} asset histories recovered; ${unresolved.map(r=>r.ticker).join(', ')} still unavailable. Prices stop at ${payload.metadata.cutoff_date}; source executions and exclusions are unchanged. Full-model comparison (not just the selected range): ${money(comparison.before.endingEquity)} → ${money(comparison.after.endingEquity)}; fallback/stale days ${comparison.before.provisionalDays} → ${comparison.after.provisionalDays}. Foreign-quoted marks match nominal action units; FX returns are NOT modeled. Futures/index marks are proxies, not verified contract fills. Closing prices never replace missing execution prices.`;
 $('price-review').innerHTML=priceBackfill.reviews.map(r=>`<tr><td>${esc(r.ticker)}</td><td>${esc(r.status)}</td><td>${esc(r.symbol)}</td><td>${esc(r.currency)}</td><td>${r.quoteCount??'—'}</td><td>${esc(r.reason??r.note)}${r.url?`<br><a href="${esc(r.url)}" target="_blank" rel="noopener noreferrer">Price source ↗</a>`:''}</td></tr>`).join('');
}
function renderOpenSnapshot(){
 const rows=ledgerSnapshotRows(openSnapshot,ledger.days.at(-1)),summary=summarizeUnrealized(rows);
 $('open-unrealized').innerHTML=signed(summary.total,wholeDollar);
 $('open-context').textContent=`Current holdings supplied as of ${openSnapshot.as_of}: 16 positions, 75 weight points. Valued ${summary.covered}; ${summary.missing} require entry/add details. This current-holdings section stays at the model cutoff ${payload.metadata.cutoff_date}, independent of the historical date filters above. Uses this page's continuous cash/share ledger and the selected calculation basis; it differs from Trade Review's yearly-reset dollar basis. These are cached historical marks, not today's live prices. Realized trim P/L is excluded; unrealized P/L is already in portfolio value, so never add this subtotal again. Historical unresolved records are not confirmed current holdings.`;
 $('open-positions').innerHTML=rows.map(r=>`<tr><td>${esc(r.ticker)}</td><td>${number(r.weight)}</td><td>${r.sourceWeight==null?'—':number(r.sourceWeight)}</td><td>${money(r.cost)}</td><td>${money(r.value)}</td><td>${signed(r.unrealized)}</td><td>${esc(r.reason||r.markDate)}</td></tr>`).join('');
}
function renderRange(){
 if(!$('from').value || !$('to').value || $('from').value>$('to').value){clearRange('Choose valid From and To dates, with From on or before To.');return;}
 range=selectRange(ledger,$('from').value,$('to').value);
 if(!range.rows.length){clearRange('No covered days in this range.');return;}
 $('export').disabled=false;
 $('coverage').textContent=coverageText;
 const end=range.rows.at(-1);
 $('equity').textContent=wholeDollar(end.equity);$('cash').textContent=wholeDollar(end.cash);$('active').textContent=wholeDollar(end.activeNetValue);$('range-pnl').innerHTML=signed(range.pnl,wholeDollar);
 $('range-start').textContent=`Range opening value: ${money(range.openingEquity)}`;
 $('checks').textContent=`${range.rows.length} calendar days; ${range.rows.filter(d=>d.provisional).length} with execution fallback or marks over 3 calendar days old; ${range.rows.filter(d=>d.negativeCash).length} with negative ledger cash. Every day's balance and P/L identity reconciles to less than $0.000001. Carried closes, including weekends, are labeled per position. These checks verify accounting—not the accuracy or completeness of source reports.`;
 $('day-slider').max=range.rows.length-1;
 selected=range.rows.some(d=>d.date===selected)?selected:end.date;
 drawChart();drawDaily();selectDay(selected);
}
function clearRange(message){
 $('coverage').textContent=message;$('export').disabled=true;
 for(const id of ['equity','cash','active','range-pnl','range-start','selected-date','day-label','day-status'])$(id).textContent='—';
 for(const id of ['chart','daily','positions','events','contributions','day-summary','equation','checks'])$(id).textContent='';
 range={rows:[]};$('day-slider').max=0;
}
function drawChart(){
 const rows=range.rows, mode=$('series').value;
 if(!rows.length)return;
 const series=mode==='pnl'?[['pnl','#0759a5']]:mode==='components'?[['equity','#0759a5'],['cash','#008caa'],['activeNetValue','#8556ad']]:[['equity','#0759a5']];
 const values=rows.flatMap(d=>series.map(([k])=>d[k]));if(mode!=='pnl')values.push(100000);else values.push(0);
 let low=Math.min(...values),high=Math.max(...values);const pad=Math.max((high-low)*.12,500);low-=pad;high+=pad;
 const w=1160,h=330,l=90,r=25,t=20,b=45;
 const x=i=>l+i/Math.max(rows.length-1,1)*(w-l-r),y=v=>h-b-(v-low)/(high-low)*(h-b-t);
 let svg=`<svg viewBox="0 0 ${w} ${h}" role="img" aria-label="${mode==='pnl'?'Daily P/L':'Portfolio value'} from ${rows[0].date} to ${rows.at(-1).date}">`;
 for(let i=0;i<5;i++){const v=low+(high-low)*i/4;svg+=`<line x1="${l}" y1="${y(v)}" x2="${w-r}" y2="${y(v)}" stroke="#e3eaf3"/><text x="${l-10}" y="${y(v)+4}" text-anchor="end" fill="#63758b" font-size="12">${money(v)}</text>`;}
 const base=mode==='pnl'?0:100000;svg+=`<line x1="${l}" y1="${y(base)}" x2="${w-r}" y2="${y(base)}" stroke="#91aac3" stroke-dasharray="5 5"/>`;
 for(const [key,color] of series)svg+=`<polyline points="${rows.map((d,i)=>`${x(i)},${y(d[key])}`).join(' ')}" fill="none" stroke="${color}" stroke-width="2.2"/>`;
 svg+=rows.map((d,i)=>d.provisional?`<circle cx="${x(i)}" cy="${y(d[series[0][0]])}" r="2" fill="#bd6b00"/>`:'').join('');
 const si=rows.findIndex(d=>d.date===selected);if(si>=0)svg+=`<line x1="${x(si)}" x2="${x(si)}" y1="${t}" y2="${h-b}" stroke="#173858" stroke-dasharray="3 3"/>`;
 svg+=`<text x="${l}" y="${h-12}" fill="#63758b" font-size="12">${rows[0].date}</text><text x="${w-r}" y="${h-12}" text-anchor="end" fill="#63758b" font-size="12">${rows.at(-1).date}</text></svg>`;
 $('chart').innerHTML=svg;
 $('chart').querySelector('svg').onclick=e=>{const rect=e.currentTarget.getBoundingClientRect();const i=Math.round(((e.clientX-rect.left)/rect.width*w-l)/(w-l-r)*(rows.length-1));selectDay(rows[Math.max(0,Math.min(rows.length-1,i))].date);};
}
function selectDay(date){
 selected=date;const d=range.rows.find(r=>r.date===date);if(!d)return;
 $('day-slider').value=range.rows.indexOf(d);$('day-label').textContent=date;$('selected-date').textContent=date;
 $('day-status').textContent=d.negativeCash?'IMPLIED FINANCING':d.provisional?'PROVISIONAL MARKS':d.positions.some(p=>p.proxy)?'PROXY MARKS / BALANCED':d.carriedMarks?'CARRIED CLOSES':'CACHED CLOSES / BALANCED';
 $('day-summary').innerHTML=`<div>Total daily P/L<strong>${signed(d.pnl)}</strong></div><div>Realized today<strong>${signed(d.realized)}</strong></div><div>Change in unrealized<strong>${signed(d.unrealizedChange)}</strong></div><div>Current unrealized total<strong>${signed(d.unrealized)}</strong></div>`;
 $('equation').textContent=`${money(d.cash)} cash + ${money(d.longValue)} longs − ${money(d.shortLiability)} shorts owed = ${money(d.equity)} portfolio value\nDaily P/L: ${money(d.realized)} realized + ${money(d.unrealizedChange)} change in unrealized = ${money(d.pnl)}. Balance check error: ${money(d.identityError)}.`;
 $('events').innerHTML=d.events.map(e=>`<tr><td>${esc(e.ticker)} · ${esc(e.direction)}</td><td>${esc(e.type)}</td><td>${number(e.weightBefore)} → ${number(e.weightAfter)}</td><td>${money(e.price)}</td><td>${number(e.quantity)}</td><td>${signed(e.cashFlow)}</td><td>${signed(e.realized)}</td><td>${/^https:\/\/bravosresearch\.com\//.test(e.sourceLink??'')?`<a href="${esc(e.sourceLink)}" target="_blank" rel="noopener noreferrer">Report ↗</a>`:'—'}${e.warning?`<br><small>${esc(e.warning)}</small>`:''}</td></tr>`).join('')||'<tr><td colspan="8">No trade actions this day. P/L may still change as active prices move.</td></tr>';
 const previous=ledger.days[ledger.days.indexOf(d)-1];
 const prev=new Map((previous?.positions??[]).map(p=>[p.positionId,p])),today=new Map(d.positions.map(p=>[p.positionId,p]));
 const ids=new Set([...prev.keys(),...today.keys(),...d.events.map(e=>e.positionId)]);
 const contributions=[...ids].map(id=>{const p=today.get(id)??prev.get(id),events=d.events.filter(e=>e.positionId===id),realized=events.reduce((s,e)=>s+e.realized,0),before=prev.get(id)?.unrealized??0,after=today.get(id)?.unrealized??0;return {ticker:p?.ticker??events[0]?.ticker,id,realized,before,after,pnl:realized+after-before};}).sort((a,b)=>Math.abs(b.pnl)-Math.abs(a.pnl));
 $('contributions').innerHTML=contributions.map(c=>`<tr><td>${esc(c.ticker)} · ${esc(c.id)}</td><td>${signed(c.realized)}</td><td>${signed(c.before)}</td><td>${signed(c.after)}</td><td>${signed(c.pnl)}</td></tr>`).join('')+`<tr><td>Total</td><td>${signed(d.realized)}</td><td>${signed(previous?.unrealized??0)}</td><td>${signed(d.unrealized)}</td><td>${signed(d.pnl)}</td></tr>`;
 $('positions').innerHTML=d.positions.map(p=>`<tr><td>${esc(p.ticker)} · ${esc(p.positionId)}</td><td>${esc(p.direction)}</td><td>${number(p.weight)}</td><td>${number(p.shares)}</td><td>${money(p.cost)}</td><td>${p.markCurrency?`${number(p.mark)} ${esc(p.markCurrency)}`:money(p.mark)}</td><td>${money(p.value)}</td><td>${signed(p.unrealized)}</td><td>${esc(p.provenance)} · ${p.markDate} · ${p.age}d old${p.recovered?' · recovered action estimate':''}<br>${esc(p.markSource)} · ${esc(p.markSymbol)}${p.proxy?' · PROXY MARK':''}<br><small>${esc(p.markBasis)}</small>${p.markUrl&&/^https:\/\//.test(p.markUrl)?`<br><a href="${esc(p.markUrl)}" target="_blank" rel="noopener noreferrer">Price source ↗</a>`:''}</td></tr>`).join('')||'<tr><td colspan="9">No active positions.</td></tr>';
 drawChart();document.querySelectorAll('#daily tr').forEach(r=>r.classList.toggle('selected',r.dataset.date===selected));
}
function drawDaily(){
 const rows=range.rows.filter(d=>!$('actions-only').checked||d.events.length);
 $('daily').innerHTML=rows.map(d=>`<tr data-date="${d.date}" tabindex="0"><td>${d.date}</td><td>${money(d.equity)}</td><td>${money(d.cash)}</td><td>${money(d.activeNetValue)}</td><td>${signed(d.pnl)}</td><td>${signed(d.realized)}</td><td>${signed(d.unrealized)}</td><td>${esc(d.events.map(e=>e.ticker+' '+e.type).join('; '))||'—'}</td><td>${d.negativeCash?'Negative cash · ':''}${d.provisional?'Provisional':d.carriedMarks?'Carried':'Balanced'}</td></tr>`).join('');
 const inspect=date=>{selectDay(date);document.querySelector('.audit').scrollIntoView({behavior:'smooth',block:'start'});};
 document.querySelectorAll('#daily tr').forEach(r=>{r.classList.toggle('selected',r.dataset.date===selected);r.onclick=()=>inspect(r.dataset.date);r.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();inspect(r.dataset.date);}};});
}
function exportCsv(){
 const text=dailyCsv(range.rows,`${recoveryEnabled()?'Action-recovery estimates':'Original covered actions'}; ${backfillEnabled()?'backfilled price history':'original price cache'}; nominal units, FX excluded`);
 const url=URL.createObjectURL(new Blob([text],{type:'text/csv;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download=`bravos-daily-${$('from').value}-${$('to').value}-${recoveryEnabled()?'recovery':'original'}.csv`;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
async function init(){
 const fetchJson=async url=>{const r=await fetch(url);if(!r.ok)throw new Error(`Cannot load ${url} (${r.status})`);return r.json();};
 let priceData;
 [payload,priceData,openSnapshot,priceBackfill,priceAudit]=await Promise.all([fetchJson('../trade-lifecycle-audit/data/trades.json'),fetchJson('data/marks.json'),fetchJson('../trade-lifecycle-audit/data/open-positions.json'),fetchJson('data/price-backfill.json'),fetchJson('data/price-backfill-audit.json')]);
 originalMarks=priceData.marks;
 $('asOfText').textContent=`Daily model through ${payload.metadata.cutoff_date} · source checked ${payload.metadata.source_checked_through ?? payload.metadata.source_review_date ?? 'not recorded'}`;
 const years=[...new Set(payload.daily_positions.map(d=>d.date.slice(0,4)))];years.forEach(y=>$('year').add(new Option(y,y)));
 $('year').value=years.at(-1);$('from').value=`${years.at(-1)}-01-01`;$('to').value=payload.metadata.cutoff_date;
 $('year').onchange=()=>{const y=$('year').value;$('from').value=y==='all'?ledger.days[0].date:`${y}-01-01`;$('to').value=y==='all'?payload.metadata.cutoff_date:[`${y}-12-31`,payload.metadata.cutoff_date].sort()[0];renderRange();};
 for(const id of ['from','to'])$(id).onchange=()=>{$('year').value='all';renderRange();};
 $('calculation-basis').onchange=rebuild;$('price-history').onchange=rebuild;$('series').onchange=drawChart;$('actions-only').onchange=drawDaily;$('day-slider').oninput=()=>{const d=range.rows[Number($('day-slider').value)];if(d)selectDay(d.date);};$('export').onclick=exportCsv;
 rebuild();
}
init().catch(e=>{$('coverage').textContent=`Unable to load daily audit: ${e.message}. Serve this folder over HTTP.`;$('export').disabled=true;console.error(e);});
