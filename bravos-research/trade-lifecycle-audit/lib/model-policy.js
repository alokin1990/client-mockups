export const MODEL_POLICY = Object.freeze({
  yearlyStartingCapital: 100_000,
  weightUnitFraction: 0.01,
  resetCapitalEachCalendarYear: true,
  actionTiming: "start-of-day",
  addSizing: "weight-change times start-of-day portfolio equity",
  trimMethod: "proportional reduction of pooled allocated capital",
  dailyReturnField: "daily_return_on_capital",
  directionTreatment: "long/short sign is already included in daily_return_on_capital",
  carryInMethod: "seed first covered day from reported capital_base weight",
});

export const MODEL_LIMITATIONS = Object.freeze([
  "The model uses researched historical prices and reconstructed Bravos actions, not brokerage statements.",
  "Fees, taxes, slippage, interest, dividends, and execution timing are not modeled unless already present in source prices.",
  "A calendar-year reset creates independent $100,000 yearly scenarios; it is not one continuous brokerage account.",
  "Trades without resolved weights, prices, or daily capital coverage are excluded from modeled returns.",
  "Carry-in positions are seeded from their first covered capital_base because beginning-of-year market value is unavailable.",
]);
