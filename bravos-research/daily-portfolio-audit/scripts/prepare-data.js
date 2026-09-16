import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {buildDailyLedger} from '../lib/ledger.js';
import {buildRecoveryScenario} from '../../trade-lifecycle-audit/lib/trade-recovery.js';
const dir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const root = path.resolve(dir, '../..');
const source = JSON.parse(await fs.readFile(path.resolve(dir,'../trade-lifecycle-audit/data/trades.json'),'utf8'));
// Standard CSV parser: mapping only, no private article bodies or credentials.
function parseCsv(text) {
  const rows = []; let row = [], cell = '', quoted = false;
  for (let i=0;i<text.length;i++) {
    const c = text[i];
    if (c === '"') { if (quoted && text[i+1] === '"') {cell+='"';i++;} else quoted=!quoted; }
    else if (!quoted && (c === ',' || c === '\n')) { row.push(cell.replace(/\r$/,''));cell='';if(c==='\n'){rows.push(row);row=[];} }
    else cell+=c;
  }
  if(cell || row.length){row.push(cell);rows.push(row);}
  const header=rows.shift();return rows.map(r=>Object.fromEntries(header.map((h,i)=>[h,r[i]])));
}
const archive = path.resolve(root,'../bravos_portfolio_scrape');
const cacheA = JSON.parse(await fs.readFile(path.join(archive,'historical_quote_cache.json'),'utf8'));
const cacheB = JSON.parse(await fs.readFile(path.join(archive,'model_period_quote_cache.json'),'utf8'));
const quotes = {...cacheA.quotes,...cacheB.quotes};
const mappings = parseCsv(await fs.readFile(path.join(archive,'bravos_trade_lifecycles_researched.csv'),'utf8'));
const symbols = new Map(mappings.map(r=>[r.position_id,r.market_data_symbol]));
const marks = {};
for (const t of source.trades) {
  const symbol = symbols.get(t.position_id) || t.ticker;
  marks[t.ticker] ??= (quotes[symbol] ?? quotes[t.ticker] ?? []).filter(q=>q.date<=source.metadata.cutoff_date).map(q=>({date:q.date,close:q.close}));
}
const output={metadata:{...source.metadata,quote_source:cacheB.source,quote_fetched_at:cacheB.fetched_at},marks};
await fs.mkdir(path.join(dir,'data'),{recursive:true});
await fs.writeFile(path.join(dir,'data/marks.json'),JSON.stringify(output));
const scenario=buildRecoveryScenario(source);
const summaries={};
for(const [name,trades] of [['original',source.trades.filter(t=>t.model_status==='Included')],['recovery',scenario.trades.filter(t=>t.model_status==='Included')]]){
 const ledger=buildDailyLedger({trades,marks,cutoff:source.metadata.cutoff_date});
 summaries[name]={eligible:ledger.eligible.length,excluded:ledger.excluded.map(x=>({id:x.trade.position_id,ticker:x.trade.ticker,reason:x.reason})),firstDate:ledger.days[0]?.date,lastDate:ledger.days.at(-1)?.date,endingEquity:ledger.days.at(-1)?.equity,provisionalDays:ledger.days.filter(d=>d.provisional).length,negativeCashDays:ledger.days.filter(d=>d.negativeCash).length,maxIdentityError:Math.max(...ledger.days.map(d=>Math.abs(d.identityError))),maxDailyError:Math.max(...ledger.days.map(d=>Math.abs(d.dailyError)))};
}
await fs.writeFile(path.join(dir,'data/audit.json'),JSON.stringify(summaries,null,2)+'\n');
console.log(JSON.stringify(summaries,null,2));
