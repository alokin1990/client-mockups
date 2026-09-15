# Agent instructions: Bravos trade lifecycle audit

## Purpose

This folder presents an estimated portfolio model from reconstructed Bravos trade actions. It is not a brokerage statement. Keep source data, business rules, portfolio math, and UI rendering separate.

## Module boundaries

- `data/trades.json`: reconstructed source facts. Do not silently rewrite source fields.
- `lib/model-policy.js`: explicit modeling assumptions and limitations.
- `lib/trade-rules.js`: trade filtering and weight-action business rules.
- `lib/portfolio-math.js`: pure capital allocation and return calculations.
- `lib/data-audit.js`: source-data integrity checks.
- `app.js`: presentation, interaction, sorting, and export only.

## Non-negotiable math rules

1. Each calendar year starts as an independent $100,000 scenario.
2. Entry or add capital equals the weight increase times start-of-day portfolio equity.
3. An open position keeps its allocated capital until another action changes it. Never resize every open position from daily portfolio equity.
4. A trim reduces pooled allocated capital in the same proportion as the weight reduction.
5. A partial exit never closes a lifecycle by itself. Mark a trade `CLOSED` only after an explicit final exit or zero remaining weight; otherwise keep the residual sleeve open and carry its daily mark through the model cutoff.
6. `daily_return_on_capital` already contains the long/short sign. Never invert shorts again.
7. Annual portfolio gain/loss must equal the sum of all modeled trade contributions in that year.
8. Compound portfolio returns. Never sum or compound trade-level percentages to manufacture a portfolio return.
9. Category and direction filters may change trade statistics and attribution, but they must not relabel a filtered sleeve as the full portfolio's compounded return.
10. Outcome classification is mutually exclusive: a winner or loser must be closed, included in the model, non-flat, and resolved inside the selected year. Everything else is incomplete for that view.
11. Trade win rate is a count: winners divided by winners plus losers. Do not substitute gross gain share or weight it by P/L dollars.

## Change procedure

Before changing a formula, write the intended rule in `MODEL_REVIEW.md`. Add or update a focused unit test, run `npm test`, and run `npm run audit`. If a data check fails, do not weaken the check without documenting the exact source-data exception.

Keep full-trade source metrics visibly distinct from modeled metrics for a selected calendar year. Update the review notes whenever assumptions, exclusions, or known gaps change.
