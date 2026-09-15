# Bravos trade model review

## Review outcome

The previous dashboard result was not using the requested position-sizing rule. It multiplied every position's fixed-$100 daily contribution by the entire portfolio value each day. That silently resized every open position after every gain or loss.

The corrected model changes capital only when an action occurs:

- entry or increase: size the added capital from the portfolio value at that action;
- unchanged position: keep its allocated capital unchanged;
- trim: reduce the pooled allocated capital in proportion to the weight reduction;
- final exit: reduce allocated capital to zero.

A trim is not a close. A lifecycle is marked closed only when the source reports a final exit or zero remaining weight. If a partial exit leaves a positive weight, the residual position remains open and continues to be marked through the model cutoff. Realized profit from the trimmed shares and unrealized profit or loss on the residual shares are both retained.

This is an action-sized attribution estimate. It is more faithful to the stated rule, but it is still not a verified brokerage-account return.

## Separation of responsibilities

```text
data/trades.json
    reconstructed facts and source calculations
        ↓
lib/trade-rules.js
    dates, filters, weight changes, add and trim rules
        ↓
lib/portfolio-math.js
    capital allocation, daily P/L, annual totals, compounding
        ↓
app.js
    labels, filters, table, chart, lifecycle, CSV export
```

`lib/model-policy.js` is the single place for assumptions. `lib/data-audit.js` checks the source contract before the model is trusted.

## Current formulas

For an entry or increase:

```text
capital added = (weight after - weight before) / 100 × start-of-day portfolio equity
```

For a trim:

```text
capital after trim = capital before trim × weight after / weight before
```

For each position-day:

```text
position P/L = action-adjusted capital base × daily_return_on_capital
portfolio ending equity = starting equity + sum of all position P/L
```

The action-day capital base is the largest capital amount active during that day's action sequence. This matches the source's start-of-day action convention. The long/short sign is already embedded in `daily_return_on_capital`; the dashboard does not invert short returns again.

For a trade in the selected range:

```text
average allocated capital = sum of daily capital bases / covered position-days
modeled trade return = trade gain or loss / average allocated capital
trade win rate = winning resolved trades / (winning resolved trades + losing resolved trades)
```

For the portfolio:

```text
annual return = ending capital / 100,000 - 1
all-years return = product of (1 + each covered annual return) - 1
annualized return = (1 + all-years return)^(365 / inclusive covered calendar days) - 1
```

Trade percentages are never added or compounded to create a portfolio return. Each year's dollar gain must equal the sum of its individual trade contributions.

## Corrected modeled results

Each calendar year is an independent $100,000 scenario.

| Coverage | Starting capital | Gain/loss | Ending capital | Return |
|---|---:|---:|---:|---:|
| Mar 5-Dec 31, 2024 | $100,000.00 | -$301.43 | $99,698.57 | -0.30% |
| Jan 1-Dec 31, 2025 | $100,000.00 | +$6,578.72 | $106,578.72 | +6.58% |
| Jan 1-Sep 10, 2026 | $100,000.00 | +$5,739.97 | $105,739.97 | +5.74% |

The chain-linked return across the three independent covered periods is **+12.36%**. Annualized over the inclusive covered calendar span, it is **+4.73%**.

For comparison, the rejected daily-resizing method produced +11.15%. The difference is caused by when position capital is allowed to change, not by removing losses.

## Data audit

- 367 reconstructed trades were reviewed.
- The category source was checked again on September 14, 2026 and contained 966 posts. The two posts added after the modeled cutoff are an EOG entry and a BRK.B exposure increase; neither closes a trade, so the completed-trade cutoff remains September 10, 2026.
- 295 trades have enough resolved data to be modeled; 72 are excluded.
- 9,740 daily position rows cover 2024-03-05 through 2026-09-10.
- No duplicate position/date rows, orphan rows, invalid numeric rows, out-of-range rows, or P/L identity failures were found.
- Every included action date has a daily position row.
- Seven open 2026 lifecycles (`NTRA`, `XLF`, `IBB`, `TBBB`, `NVDA`, `XLV`, and `CF`) had been truncated at their latest partial exit. Their positive residual weights are now carried through the cutoff, and the audit rejects a closed status when the terminal action leaves positive weight.
- The source P/L identity holds for every row: `pnl = capital_base × daily_return_on_capital`.
- Source aggregate capital bases peak at 100 weight units on 2026-06-17 and do not exceed 100.
- Two action chains are internally inconsistent: `P0078` (ETH) and `P0100` (ETR) enter at weight 2, but a later partial exit says its before-weight is 5. The model follows the stated trim ratio, so 5→2 removes 60% and 5→3 removes 40%, while retaining the actual pooled capital accumulated from the recorded entry. These two trades should be checked against the original posts.

## What the filters mean

The year filter changes both the portfolio period and trade calculations. Category and long/short filters change the trade table, category attribution, average modeled trade return, and standard trade-count win rate.

Category and long/short filters do **not** change the compounded portfolio return cards. Computing a filtered sleeve return would require an explicit cash-allocation rule for capital that was assigned to excluded positions; without that rule, it would be easy to display a misleading number. Trade win rate is a count of resolved winners, not a dollar-weighted gain share.

The outcome filter is selected-period aware. A winner or loser must be closed, included in the model, have a non-zero modeled gain or loss, and be resolved inside the selected calendar year. Open-at-cutoff, excluded/unmodeled, exact-flat, and cross-year positions that have not yet closed are labeled incomplete for that view. Outcome filtering changes trade statistics and attribution, but not the full-portfolio return cards.

## Known limitations

1. The source is reconstructed from research posts and historical prices, not reconciled to brokerage fills.
2. Seventy-two excluded trades do not contribute to the modeled return.
3. 2024 and 2026 are partial coverage periods; their annualized presentation extrapolates incomplete years.
4. Actions are treated as start-of-day. Intraday ordering can change action-day P/L.
5. A position carried into January is seeded from its reported first-day capital-base weight because its exact January 1 market value is unavailable.
6. Fees, slippage, taxes, financing costs, dividends, and unreported cash flows are excluded unless already embedded in the researched prices.
7. `annualized_cash_flow_irr`, SPY return, and alpha in the source columns are full-trade source metrics. They are not recalculated for a selected calendar-year slice.
8. Modeled trade return on average capital is a capital-efficiency ratio, not a formal time-weighted return or money-weighted IRR.
9. The model has no broker cash ledger. It checks gross source weights, but it cannot verify actual account deposits, withdrawals, margin, or idle-cash interest.

## Tests and safeguards

`npm test` covers:

- action-time entry and increase sizing;
- proportional trims and action-day capital;
- no automatic daily resizing;
- correct long/short sign treatment;
- inclusive-day annualization;
- compounding instead of adding returns;
- yearly $100,000 resets;
- calendar-year separation for trades crossing December/January;
- real-data structural integrity;
- trade-to-year dollar reconciliation;
- resolved-trade win-rate counting;
- regression-locked annual totals.

`npm run audit` prints the current data audit and returns a failure status for critical source-contract errors.

## Next improvements

1. Verify `P0078` and `P0100` against the original entry/increase posts and correct the missing or misstated weights.
2. Review the 72 excluded trades, prioritizing trades with exits but unresolved entries or weights.
3. Spot-check a representative sample of winners, losers, adds, trims, shorts, open trades, and year-crossing trades against brokerage P/L.
4. Add exact execution timestamps or an explicit close-of-day policy so action-day sequencing is no longer assumed.
5. Add beginning-of-year market-value snapshots for carry-in positions.
6. Build a cash-flow ledger before presenting selected-sector or selected-direction results as standalone portfolio returns.
7. Add modeled per-trade cash flows so opportunity cost can be measured with a defensible selected-period XIRR instead of a simple annualized efficiency ratio.
8. Add fees, slippage, dividends, borrowing costs, deposits, withdrawals, and benchmark cash flows where reliable records exist.
