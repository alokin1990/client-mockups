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

### September 16 excluded-trade recovery scenario

Keep the original daily-coverage model and its source data unchanged. A separately selectable exit-based scenario may recover an excluded CLOSED lifecycle only when its entry price, entry weight, capital additions (if any), and explicit final-exit price/date are usable. Never use the last partial exit or a later, different lifecycle as a final exit. Missing entry/add data still blocks recovery.

In this scenario, omit an unusable partial exit from the effective action sequence and hold that exposure until the next usable exit, ultimately the explicit final exit. Preserve every original action and source link. A usable trim closes the reported proportion of remaining pooled shares. If a skipped trim changes effective weight, apply later usable trim ratios to effective weight rather than inventing source facts.

This round reviewed all 72 excluded lifecycles and recovered 32 endpoint-based scenarios: 11 complete-action trades without daily coverage and 21 trades with incomplete trims (22 omitted trim actions). Forty remain excluded. Capital additions remain excluded until their resolved dated dollar/share ledger can be reconstructed; a fixed-basis pooled return is not sufficient when dollar sizing differs between additions.

| Covered period | Original daily coverage | With exit-based recovery estimates |
|---|---:|---:|
| 2024 partial year | -0.30% | +4.20% |
| 2025 | +6.58% | +12.78% |
| 2026 through Sep 10 | +5.74% | +6.47% |
| Chain-linked covered years | +12.36% | +25.12% |

These differences include both recovered contributions and the resulting changes in subsequent action-sized allocations. They are not simply sums of recovered trade percentages. The original dataset is unchanged; `data/excluded-trade-review.json` lists every excluded trade, recovery reason, omitted original trims, effective actions, and modeled annual contributions. Run `node scripts/review-excluded.js` to regenerate it.

ALUM P0268 was checked against the saved authenticated entry, trim, and final-exit articles. They explicitly state 2025-12-19 at 3.85 and weight 5, 2026-03-30 at 4.53 reducing 5 to 4, and 2026-06-10 at 4.615. Its fixed-$100 P/L is `(4.53/3.85-1) + 4*(4.615/3.85-1) = 0.9714285714`, or 19.43% of original five-unit allocation. Its 50.57% source IRR is annualized and must not be mistaken for its holding-period or portfolio return. The complete ALUM trim is retained. Other recoveries are rule-screened from reconstructed endpoints, not newly verified brokerage executions.

An independent endpoint dollar/share check of the original model's 22 included CLOSED trades with additions and entry/exit both in 2026 found a net -$10.42 difference from their modeled contributions, holding the original allocation path constant. Largest individual difference: TSM P0273 modeled +$588.58 versus pooled dollar/share endpoint +$584.27. This is a real approximation in applying fixed-basis daily returns to pooled modeled capital when additions receive different dollars per source weight. It does not explain a many-percentage-point shortfall, and this diagnostic is not a replayed portfolio correction. A dated lot/cash-flow model remains the next math improvement; do not describe the current aggregate as exact brokerage P/L.

Recovered positions recognize P/L only on exits; intervening rows have zero **recognized** P/L, not an assertion of zero market movement. This is a realization-timing estimate, not daily mark-to-market TWR. Cross-year P/L is recognized in the exit year; unknown January market values and missed intrayear equity changes can affect allocation and compounding in either direction. Display the baseline beside the scenario and do not claim the difference is a verified correction. Full-trade dollar P/L is recoverable from endpoints; exact monthly/yearly market returns still require daily marks. Known complete partial exits, including ALUM, must not be discarded.

### Sector / theme and entry-setup provenance

`sector` is assigned during reconstruction using a curated ticker-to-theme map, then keyword rules against the ticker and asset name, with `Other / Review` as the unresolved classification fallback. These are broad research themes, not a verified provider taxonomy or official Bravos sector labels. `setup` is separately inferred from trade direction and entry-report URL/evidence keywords; unmatched long entries default to `Tactical long`, which does not establish an explicit source strategy.

The category chart groups the exact dataset `sector` field and sums selected-period modeled dollar contributions. It does not use `setup`. As of September 16, all 19 dataset sectors/themes are shown individually when All categories is selected, with full wrapped labels and no top-eight/Other-categories merging. Selecting one category shows that category. Other trade filters change contributions; categories with no finite modeled P/L show `n.a.`, while genuine net-zero contributions show $0. Classification is unchanged and portfolio-return formulas are unchanged.

The remaining classification improvement is to expose per-trade classification provenance and review the curated map and fallback assignments against a documented taxonomy. Do not present these inferred themes as independently verified sectors.

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
