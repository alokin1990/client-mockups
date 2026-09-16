// Current holdings are a dated status overlay, never fabricated historical executions.
export function applyOpenSnapshot(trades, snapshot) {
  const byId = new Map(snapshot.positions.filter(p=>p.position_id).map(p=>[p.position_id,p]));
  const result = trades.map(t=>{
    const holding=byId.get(t.position_id);
    if(holding && (holding.ticker!==t.ticker || holding.direction!==t.direction || t.status==='CLOSED')) throw new Error(`Snapshot lifecycle conflict: ${t.position_id}`);
    return {...t,current_open:Boolean(holding),current_weight:holding?.weight ?? null,snapshot_as_of:snapshot.as_of,
      display_status:holding?'OPEN':t.status==='CLOSED'&&t.model_status==='Included'?'CLOSED':'INCOMPLETE'};
  });
  for(const p of snapshot.positions){
    if(p.position_id && !trades.some(t=>t.position_id===p.position_id)) throw new Error(`Snapshot position missing: ${p.position_id}`);
    if(!p.position_id) result.push({...p,position_id:`SNAPSHOT-${p.ticker}`,status:'SNAPSHOT ONLY',display_status:'OPEN',current_open:true,current_weight:p.weight,snapshot_as_of:snapshot.as_of,
      entry_date:null,audit_end_date:null,actions:[],model_status:'Excluded: Current holding confirmed; entry price/date and action history missing'});
  }
  return result;
}

// Uses the Trade Review yearly model's action-sized capital, not the continuous ledger.
// For today's matched lifecycles all entries occur within one year. Cross-year lots
// require a separate cost-basis bridge; reject instead of guessing after a reset.
export function unrealizedPosition(trade, model, mark, snapshot) {
  const reject=reason=>({positionId:trade.position_id,ticker:trade.ticker,weight:trade.current_weight,sourceWeight:trade.actions?.at(-1)?.weight_after??null,unrealized:null,reason});
  if(!trade.current_open) return reject('Not a confirmed current holding');
  if(!trade.actions?.length || trade.model_status!=='Included') return reject('Missing modeled entry/action history');
  if(trade.actions.at(-1).weight_after!==trade.current_weight) return reject('Current weight differs from recorded weight; missing exposure change');
  if(!mark || !Number.isFinite(mark.close) || mark.close<=0 || mark.date>snapshot.price_cutoff || mark.date<trade.actions.at(-1).date) return reject('No usable dated price');
  let cost=0,shares=0;
  const entryYear=trade.actions[0].date.slice(0,4);
  for(const [i,a] of trade.actions.entries()){
    if(a.date.slice(0,4)!==entryYear || !(a.price>0)) return reject('Unresolved cross-year cost basis or execution price');
    const after=model.actionCapitalAfter.get(`${trade.position_id}|${a.date}|${i}`);
    if(!Number.isFinite(after)) return reject('Missing modeled action capital');
    if(['Entry','Add'].includes(a.type)){
      const added=after-cost;if(!(added>0))return reject('Invalid capital addition');
      shares+=added/a.price;cost=after;
    }else if(a.type==='Partial exit' && a.weight_before>0){shares*=a.weight_after/a.weight_before;cost=after;}
    else return reject('Unresolved or closed action chain');
  }
  const value=shares*mark.close;
  return {positionId:trade.position_id,ticker:trade.ticker,weight:trade.current_weight,sourceWeight:trade.actions.at(-1).weight_after,
    cost,shares,value,mark:mark.close,markDate:mark.date,unrealized:trade.direction==='SHORT'?cost-value:value-cost,reason:''};
}

export function summarizeUnrealized(rows){
  const covered=rows.filter(r=>Number.isFinite(r.unrealized));
  return {covered:covered.length,missing:rows.length-covered.length,total:covered.length?covered.reduce((s,r)=>s+r.unrealized,0):null};
}

// Daily Portfolio uses its existing continuous ledger, not Trade Review allocations.
export function ledgerSnapshotRows(snapshot, day){
  const byId=new Map((day?.positions??[]).map(p=>[p.positionId,p]));
  return snapshot.positions.map(h=>{
    const p=byId.get(h.position_id);
    const reason=!p?'Missing active entry/action history at the model cutoff':p.weight!==h.weight?'Current weight differs from recorded weight; missing exposure change':p.markDate>snapshot.price_cutoff?'Price is beyond the snapshot price cutoff':'';
    return {ticker:h.ticker,weight:h.weight,sourceWeight:p?.weight??null,cost:reason?null:p.cost,value:reason?null:p.value,
      unrealized:reason?null:p.unrealized,markDate:p?.markDate??null,reason};
  });
}
