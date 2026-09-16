// Presentation only. Never feed these rounded values back into ledger math.
const wholeDollarFormat = new Intl.NumberFormat('en-US', {
  style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0,
});
export function wholeDollar(value) {
  return value == null ? '—' : wholeDollarFormat.format(value);
}
