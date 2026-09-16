export function dailyCsv(rows, basis) {
  const fields=['date','openingEquity','equity','cash','longValue','shortLiability','activeNetValue','pnl','realized','realizedTotal','unrealized','unrealizedChange','provisional','carriedMarks','negativeCash','identityError','dailyError'];
  const cell=x=>'"'+String(x??'').replace(/"/g,'""')+'"';
  return '\uFEFF'+[fields.concat(['calculationBasis','actions']).join(','),...rows.map(d=>fields.map(k=>cell(d[k])).concat(cell(basis),cell(d.events.map(e=>`${e.ticker} ${e.type} @ ${e.price}; realized ${e.realized}; ${e.sourceLink??''}`).join(' | '))).join(','))].join('\r\n');
}
