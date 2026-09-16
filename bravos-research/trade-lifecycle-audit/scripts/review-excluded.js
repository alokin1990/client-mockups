import { readFile, writeFile } from 'node:fs/promises';
import { buildRecoveryScenario } from '../lib/trade-recovery.js';
import { buildPortfolioModel, getTradeStats } from '../lib/portfolio-math.js';
import { auditDataset } from '../lib/data-audit.js';
const data = JSON.parse(await readFile(new URL('../data/trades.json', import.meta.url),'utf8'));
const scenario = buildRecoveryScenario(data);
const baseline = buildPortfolioModel({trades:data.trades,dailyPositions:data.daily_positions});
const recoveredModel = buildPortfolioModel({trades:scenario.trades,dailyPositions:scenario.dailyPositions});
const review = {
  reviewed_on:'2026-09-16', cutoff:data.metadata.cutoff_date,
  basis:'Recorded endpoints only. Missing trims omitted, complete trims preserved. Recovered P/L recognized on exit dates, not daily market moves. Not verified account TWR.',
  baseline_compounded_return:baseline.compoundedReturn,
  scenario_compounded_return:recoveredModel.compoundedReturn,
  years:baseline.yearly.map(y=>({year:y.year,baseline_gain_loss:y.gainLoss,baseline_return:y.return,
    scenario_gain_loss:recoveredModel.yearly.find(r=>r.year===y.year).gainLoss,
    scenario_return:recoveredModel.yearly.find(r=>r.year===y.year).return})),
  recovery_audit:auditDataset({...data,trades:scenario.trades,daily_positions:scenario.dailyPositions}),
  trades:scenario.reviews.map(r=>{
    const t=data.trades.find(t=>t.position_id===r.positionId);
    return {position_id:t.position_id,ticker:t.ticker,direction:t.direction,status:t.status,
      entry_date:t.entry_date,exit_or_mark_date:t.audit_end_date,original_exclusion:t.model_status,
      recovered:r.recovered,reason:r.reason,source_pnl_100_basis:r.sourcePnl??null,
      omitted_partial_exits:r.skipped??[],original_actions:t.actions,effective_actions:r.actions??null,
      modeled_contributions:recoveredModel.yearly.map(y=>({year:y.year,
        gain_loss:getTradeStats(recoveredModel,t.position_id,y.year)?.gainLoss??null}))};
  }),
};
await writeFile(new URL('../data/excluded-trade-review.json',import.meta.url),JSON.stringify(review,null,2)+'\n');
console.log(JSON.stringify({years:review.years,baseline:baseline.compoundedReturn,scenario:recoveredModel.compoundedReturn,
  recovered:review.trades.filter(t=>t.recovered).length,still_excluded:review.trades.filter(t=>!t.recovered).length,
  critical_issues:review.recovery_audit.criticalIssues},null,2));
