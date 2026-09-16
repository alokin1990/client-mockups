# Continuous daily portfolio audit — intended rules

This version deliberately does not use annual $100,000 resets or the old fixed-source daily-return multiplication. It starts with $100,000 cash once, follows dated actions, and marks actual modeled shares. It is a diagnostic reconstruction, not a broker statement.

## Accounting

The September 16 user-supplied current-holdings list is stored separately in `../trade-lifecycle-audit/data/open-positions.json`. The current open-position unrealized section matches exact lifecycle IDs to the final continuous ledger day, independent of historical range filters. Fourteen weights match; BRK.B's 5-versus-8 exposure mismatch and EOG's absent entry history remain n.a., not zero. The source action chains and historical ledger are unchanged. Current holdings are not backdated to September 10 or used to invent cash flows. Marks remain at the existing model cutoff, not today's live prices. This page uses continuous dollar sizing, while Trade Review's analogous section uses yearly model sizing; do not mix their dollar totals. Unrealized P/L on residual shares excludes realized trims and is already counted in portfolio equity. Current snapshot absence does not prove a historical exit.

- Entry/add dollars = positive weight change / 100 × previous day's closing portfolio equity. All same-day actions use the same opening equity; shares added = dollars / action price.
- Long purchase: cash decreases by dollars. Short sale: cash increases by dollars and shares owed increase. This cash includes short proceeds and is NOT available buying power.
- Trim fraction = (before weight − after weight) / before weight. A final exit closes all remaining shares. Relieve pooled shares and cost proportionally; an inconsistent weight chain is excluded rather than silently repaired.
- Long realized P/L = sale proceeds − relieved cost. Short realized P/L = relieved cost − buyback payment.
- Active long value = shares × closing mark. Short liability = shares owed × closing mark.
- Portfolio value = ledger cash + active long value − short liability.
- Unrealized P/L = long value − long cost + short cost − short liability.
- Daily total P/L = today's portfolio value − yesterday's portfolio value.
- Daily total P/L = today's realized P/L + change in unrealized P/L. Never add sale proceeds or previously unrealized profit again.
- Portfolio value = $100,000 + cumulative realized P/L + current unrealized P/L (no external flows).

Date/year filters only select displayed rows from a single continuous replay. Range P/L compares the final row with the day before the range. New investments reflect evolving equity, but no annual compounding summary is emphasized.

## Provenance and limitations

Use existing cached historical closes, in the existing reconstruction's price basis, and alert prices for executions. Actions precede end-of-day marks. No intraday timestamps are known. Never use a future quote. Carry a previous close on days without a quote; expose mark date, age and source per position. Where no eligible quote exists, use the last execution mark with an explicit endpoint-only/stale warning, not invented daily movements. Show provisional days and excluded trades prominently.

Offer the existing endpoint-recovery scenario in a Calculation basis selector (Original daily coverage / With exit-based recovery estimates). It may omit unusable partial exits according to the existing documented rule, but must retain that warning and original report links. Fully known partial exits remain. Unknown entries/adds/chains remain excluded. Source classification is inferred research themes, not verified Bravos sectors.

The four headline cards display whole-dollar rounding only; underlying ledger and CSV values are not rounded. Independent display rounding may cause a $1 difference when adding visible cash and active-value cards. Detailed accounting checks still use full precision. The daily ledger excludes three additional unresolved records, so its exclusions are 75 original / 43 recovered rather than the yearly attribution's 72 / 40.

Fees, dividends, taxes, settlement, borrowing costs, margin restrictions, external deposits/withdrawals, unreported actions and execution slippage are absent. Cached quote/alert price-basis mismatch remains possible; the visible mark provenance enables spot checks. Missing market marks can distort daily trend and subsequent sizing in either direction. A correct accounting identity does not prove correct source data.

The assets-minus-liabilities definition follows [Investor.gov](https://www.investor.gov/introduction-investing/investing-basics/glossary/net-asset-value); short proceeds are distinguished from investor capital as described by [FINRA](https://www.finra.org/rules-guidance/notices/98-102).

## Verification

Unit tests must cover purchases, mark-only gains, profit realization without double counting, losses, adds at new equity, proportional trims, shorts, missing marks, filtering without resets, and both daily identities. Generated audit summaries must report counts and maximum reconciliation error. Real-world accuracy still requires validating individual source actions and matching price bases against brokerage records.

## September 16 build findings

Original covered-action input produces 292 eligible lifecycles and excludes 75 of all 367 source records. ETH P0078 and ETR P0100 fail weight continuity; ESLOF P0165 lacks an execution price. The original yearly attribution included these three, but this version refuses to fabricate their share ledgers. With the separate endpoint scenario, 324 are eligible and 43 excluded. The original data remains unchanged.

The continuous 2024-03-05–2026-09-10 replay has 920 days. Original input ends at $111,873.06; endpoint scenario at $124,764.84. These are provisional covered-account values, not annual-reset results or proven corrected returns. Original input has 325 provisional days over the full span; endpoint input has 637. Negative ledger cash occurs on 2 and 4 days respectively. Both accounting identities reconcile at sub-millionth-dollar precision. See data/audit.json for the generated exact values.

Next: prioritize quote mappings and price-basis validation for fallback/stale positions; independently verify alerts against actual fills; resolve ETH/ETR/ESLOF; add the other unresolved lifecycles; determine real margin and cash restrictions; add fees, dividends and actual cash flows. Do not compare this version's 2026 dollars directly against the independent $100,000 yearly model: 2026 starts at prior-year closing equity here.

Nine new automated tests pass; all 33 existing lifecycle-dashboard tests also pass. Browser checks verified range/year filtering, invalid-range clearing, chart modes, action-day filtering, recovery switching, selected-day events and trade contribution reconciliation, with no console errors. CSV content/range/basis escaping is unit-tested; the in-app browser did not expose a download completion event, so file delivery there still needs manual confirmation in a standard browser.
