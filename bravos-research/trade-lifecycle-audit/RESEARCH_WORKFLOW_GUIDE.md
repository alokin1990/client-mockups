# Reusable research workflow: from source archive to audited dashboard

## Purpose

This guide explains how the Bravos trade-research project evolved, which requests were made in which order, what each stage produced, and how to repeat the process for another research source.

The prompts below are clarified versions of the original requests. They preserve the intent while making the scope, expected output, assumptions, and verification requirements easier for both the user and an agent to follow.

This is a research workflow, not financial advice. Authenticated or paid material must stay within the user's authorized workspace unless the user explicitly approves a public derived output. Never publish private article bodies, credentials, cookies, or account information.

## What the project produced

The work eventually became six connected layers:

1. A complete source manifest proving which archive pages and articles existed.
2. A private raw archive preserving full authorized article content.
3. An event ledger containing entries, additions, trims, final exits, dates, prices, weights, tickers, directions, and source links.
4. A lifecycle ledger grouping those events into individual trades.
5. A documented portfolio-return model with tests, exclusions, and reconciliation checks.
6. A public static dashboard using derived data, filters, CSV export, trade details, and links back to the source reports.

## The prompt sequence from this project

### 1. Define the source, scope, and required fields

Original intent: scrape every article in the Portfolio Update archive, follow all pagination, preserve the full content, and identify position changes.

Clear prompt:

> Review the entire archive at `[ARCHIVE URL]`, including every pagination page. Open each article and preserve its complete authorized content. Create structured records containing the article date, URL, title, ticker or asset, direction, and any entry, addition, reduction, partial exit, final exit, or short action. Prove archive completeness by reporting the source's declared article count, pages checked, earliest date, latest date, duplicates, failures, and access restrictions.

Why it comes first: extraction cannot be audited unless the source universe and output fields are defined before scraping starts.

### 2. Establish the authenticated browser session

Original intent: use the private Google Chrome session associated with the user's personal account, bring it into focus, and ask for login help if needed.

Clear prompt:

> Use my already-authenticated `[BROWSER/PROFILE]` session for member-only content. Before scraping, verify that the correct profile is active and that a test article shows the full body rather than a restricted excerpt. Do not copy cookies into another profile. If access is missing, open the login page in the correct session and pause for me to sign in.

Why it comes second: public APIs can prove that posts exist, but they may not expose the authorized full article body.

### 3. Extract and checkpoint the archive

Original intent: continue through all 97 archive pages and preserve the session so work could resume.

Clear prompt:

> Extract the archive in resumable batches. Save the raw response, normalized HTML, plain text, article metadata, and a batch manifest after every group of pages. Record successful items, failed items, and the next resume point. Never restart completed batches unless validation shows they are damaged.

Why it comes here: long browser extractions need checkpoints and a durable resume state.

### 4. Identify trade events

Original intent: inspect the scraped text for entries, exits, long/short changes, and infer missing details when the wording was indirect.

Clear prompt:

> Convert the article archive into an event ledger. For every article, classify the action as Entry, Add, Partial exit, Final exit, Direction change, Cancel, Commentary only, or Unresolved. Capture the before-weight, after-weight, action price, date, ticker, direction, and source URL. Preserve the supporting sentence and label each field as explicit, derived, inferred, or unresolved. Do not silently invent missing values.

Why it comes before calculating returns: returns require a trustworthy sequence of position-changing events.

### 5. Reconstruct individual trade lifecycles

Original intent: create one understandable history per asset showing every action and the final result.

Clear prompt:

> Group events into distinct trade lifecycles. A new entry starts a lifecycle; additions increase exposure; partial exits reduce exposure without closing the lifecycle; a final exit or zero remaining weight closes it. If a new entry appears before the prior lifecycle is clearly closed, flag it for review instead of merging silently. Produce one row per lifecycle and preserve its full action timeline.

Why it matters: the same ticker can have several separate trades, and partial exits must remain attached to the correct open position.

### 6. Research missing entry and exit prices

Original intent: find the actual entry and exit price points rather than relying only on incomplete summary rows.

Clear prompt:

> For every lifecycle with a missing price, first search the complete article body and linked trade reports. If the report gives a date but no price, use a clearly labeled market-data proxy and record the symbol, source, date alignment, and confidence. Never present a proxy as an exact reported fill.

Why it follows lifecycle reconstruction: price research is more accurate when the exact trade and action date are already known.

### 7. Calculate returns and explain the method

Original intent: report yearly and monthly returns, include wins and losses, and explain whether percentages were being added or compounded.

Clear prompt:

> Calculate monthly and yearly results using the event ledger. Include both gains and losses. State the long and short formulas, starting-capital assumption, action timing, position sizing, partial-exit treatment, open-position marks, compounding method, coverage, and exclusions. Do not add trade percentages to calculate portfolio return. Reconcile every yearly dollar result to the sum of its individual trade contributions.

Why this must be explicit: several mathematically different metrics can all be called "return," but they answer different questions.

### 8. Add time and capital efficiency

Original intent: judge a 7% gain over one week differently from a 7% gain over one month and understand the portfolio mix through time.

Clear prompt:

> For every trade, calculate the calendar holding period, time-weighted average allocated capital, gain or loss on that average capital, and a clearly labeled annualized cash-flow comparison where defensible. Also create monthly portfolio-composition views by ticker, sector, direction, and average allocated capital. Keep efficiency metrics separate from actual portfolio return.

Why it is separate: annualized trade efficiency is useful for comparison but must not be summed into account performance.

### 9. Challenge and redo the estimates

Original intent: investigate results that felt too high and check whether weights, entries, exits, or tallying were wrong.

Clear prompt:

> Treat the current totals as unverified. Spot-check small lifecycles against their source reports, especially trades with additions, trims, shorts, unusually large returns, missing weights, or year-crossing dates. Identify the exact cause of every material change, rerun the model, and show before-versus-after totals. Do not force the result to match an expected number.

Why it is essential: a plausible portfolio total can still hide lifecycle errors.

### 10. Build the interactive dashboard

Original intent: create a simple public HTML interface driven by CSV or JSON and styled from a supplied reference.

Clear prompt:

> Build a static HTML dashboard that loads the derived research data from JSON or CSV. Provide filters for year, category, direction, and outcome; show portfolio metrics, yearly and monthly totals, individual trade lifecycles, weights, dates, prices, holding periods, and gains or losses. Keep data, business rules, portfolio math, and interface rendering in separate modules so the calculations can be tested independently.

Why it comes after the model: the interface should display audited calculations, not define them.

### 11. Simplify labels and correct metric names

Original intent: make the interface understandable and correct confusing labels such as gain-weighted win rate.

Clear prompt:

> Review every visible metric as if explaining it to a non-financial user. Use plain labels, define the numerator and denominator, and state what makes the value rise or fall. Use "trade win rate" only for winning resolved trades divided by winning plus losing resolved trades. Give dollar-weighted gain share a different name.

### 12. Correct compounding and annual starting capital

Original intent: fix the all-years calculation and model each year as starting with $100,000.

Clear prompt:

> Model each calendar year as an independent $100,000 scenario. Size entries and additions from start-of-day equity at the action time; do not resize unchanged positions every day. Reduce allocated capital proportionally on trims. Calculate yearly return from ending capital divided by starting capital, and chain-link the yearly returns for the all-years result.

### 13. Add exports and outcome filters

Original intent: export the selected data and filter winners, losers, and incomplete trades.

Clear prompt:

> Add CSV export for the currently selected range and filters. Make outcome categories mutually exclusive: Winner and Loser require a closed, included, non-flat result resolved in the selected period; open, excluded, flat, and unresolved lifecycles are Incomplete. Export the same records and calculations visible in the filtered interface.

### 14. Separate logic and add tests

Original intent: refactor business rules and mathematical calculations so the model could be understood and trusted.

Clear prompt:

> Separate source facts, modeling policy, lifecycle rules, portfolio math, data audits, and interface code. Document every non-negotiable rule for future agents. Add focused tests for entries, additions, trims, final exits, shorts, action-day capital, yearly resets, compounding, outcome classification, source integrity, and yearly dollar reconciliation. Lock verified annual results with regression tests.

### 15. Review incomplete trades using source links

Original intent: make it easy to verify questionable lifecycles by opening their Bravos reports.

Clear prompt:

> For each selected lifecycle, provide a review button that opens every unique source report attached to its actions in chronological order. Show the number of available reports. Never manufacture a requested count: if the data contains five unique links and the user expects six, report the discrepancy and request the missing URL.

### 16. Correct partial exits and reconcile current holdings

Original intent: use Natera as a case study, preserve partial weight reductions, and compare estimated open trades with Bravos' official current portfolio.

Clear prompt:

> Audit every lifecycle whose latest action is a partial exit. A positive remaining weight means the position stays open through the model cutoff. Then compare the reconstructed open-position snapshot with the official portfolio snapshot by ticker, direction, and weight. Report exact matches, weight mismatches, missing positions, extra positions, and events occurring after the model cutoff.

### 17. Publish only after approval

Original intent: push verified revisions to the client-mockups repository and provide a live page link.

Clear prompt:

> Commit and push only the approved dashboard files to `[REPOSITORY]`. Run tests and data audits first, inspect the exact diff, and verify the remote commit. Then wait for the GitHub Pages HTML and required JSON/JavaScript assets to return HTTP 200 before calling the page live. Return the commit, repository folder, and cache-busted page URL.

## The improved order for future projects

The conversation reached the right system iteratively. A future project should use this shorter order:

1. Authorization and publication boundary.
2. Source universe and completeness criteria.
3. Authenticated-session verification.
4. Resumable raw extraction.
5. Event schema and explicit evidence labels.
6. Lifecycle state machine.
7. Missing-field research and confidence scoring.
8. Current official snapshot reconciliation.
9. Return policy written before calculations.
10. Model implementation and tests.
11. Small-trade spot checks and regression review.
12. Dashboard and exports.
13. Publication after explicit approval.

This order would have caught the NTRA partial-exit issue before portfolio totals or interface metrics were presented.

## Core data structure

### Article record

- article ID
- publication date
- title
- canonical URL
- raw HTML path
- normalized text path
- access status
- extraction status

### Event record

- lifecycle ID
- ticker and asset name
- action type
- long or short direction
- action date and price
- weight before and after
- source URL
- supporting evidence
- confidence and inference method

### Lifecycle record

- unique trade ID
- entry and audit-end dates
- status: closed, open at cutoff, cancelled, or unresolved
- complete ordered action list
- initial, peak, and remaining weight
- realized and unrealized components
- data-quality status and exclusion reason

### Official snapshot record

- snapshot date
- ticker
- direction
- current reported weight
- source location

The official snapshot is a reconciliation target, not a replacement for the historical event ledger.

## Non-negotiable modeling rules

1. Never classify a partial exit as a final exit while positive weight remains.
2. Do not use a date stored in a legacy `final_exit` field as proof of closure without checking the action type and remaining weight.
3. Entries and additions add capital at their own prices and action dates.
4. Trims remove the same proportion of the pooled position as the reported weight reduction.
5. Existing positions retain allocated capital until another action changes it.
6. Long and short direction must be applied exactly once.
7. Open positions include realized trim results plus an unrealized cutoff mark on the residual sleeve.
8. Trade percentages are descriptive; portfolio returns come from dollar contributions and portfolio equity.
9. Annual returns compound rather than add.
10. Incomplete or unresolved trades must be visible but excluded from calculations they cannot support.
11. Current holdings and historical model cutoffs must display their dates so later actions are not mistaken for extraction errors.

## Required validation checkpoints

### Extraction checks

- declared post count versus downloaded count
- expected pagination versus pages fetched
- earliest and latest dates
- duplicate IDs and URLs
- failed or restricted articles
- raw and normalized output saved
- resume manifest updated

### Lifecycle checks

- event dates are chronological
- previous `weight_after` equals next `weight_before`
- additions increase weight
- trims reduce weight but remain above zero
- final exits end at zero
- open status never follows a final exit
- closed status never follows a positive remaining weight
- repeated tickers are split into separate lifecycles

### Financial checks

- yearly starting capital is explicit
- entry/add sizing uses action-time equity
- yearly gain equals the sum of per-trade contributions
- losses and excluded records are disclosed
- annual returns are chain-linked
- no NaN, infinite, duplicate, orphan, or out-of-range rows
- current totals are regression-tested

### Publication checks

- public output contains derived data only
- private article bodies and credentials are absent
- intended files are the only staged changes
- tests and audits pass
- remote commit matches the local commit
- page, data, JavaScript, and stylesheet return HTTP 200

## Common failures and their prevention

| Failure | Prevention |
|---|---|
| Wrong Chrome profile | Verify profile identity and full-content access with one test article before extraction. |
| Cookie-copying fails | Use the already-authenticated controllable session; do not copy encrypted Chrome cookies. |
| Public excerpts mistaken for full content | Use the API for discovery and authorized browser access for member-only bodies. |
| Archive sampled instead of completed | Maintain a manifest with counts, pages, failures, and resume checkpoints. |
| Percentages simply added | Build a transaction ledger and reconcile dollar contributions to portfolio equity. |
| Positions resized every day | Change capital only on entries, additions, trims, and closes. |
| Partial exit treated as close | Require an explicit final exit or zero remaining weight. |
| Current portfolio differs from model | Compare snapshot dates and identify post-cutoff actions before calling it an error. |
| Only entry and exit links open | Collect every unique action `source_link` in lifecycle order. |
| Requested link count is wrong | Open the unique links supported by data and ask for the missing source instead of duplicating one. |
| Good-looking UI hides weak data | Keep exclusions, confidence, coverage, and audit results visible. |

## Reusable master prompt

Copy this prompt and replace the bracketed values:

> Research the complete authorized archive at `[SOURCE URL]` from `[START DATE]` through `[END DATE OR CURRENT]`. First verify the correct authenticated browser profile and confirm that full content is accessible. Build a complete manifest and prove coverage with source counts, pagination, dates, duplicates, failures, and access restrictions. Save raw content privately in resumable batches.
>
> Convert the source into an evidence-backed event ledger using this schema: `[FIELDS]`. Classify each event as `[ACTION TYPES]`, retain the supporting sentence and source URL, and label every extracted field explicit, derived, inferred, or unresolved. Group the events into individual lifecycles using written state-transition rules. Do not treat a partial reduction as a close while positive exposure remains.
>
> Research missing values from source reports first and use market proxies only when necessary, clearly labeled with confidence and methodology. Reconcile the reconstructed current state against `[OFFICIAL SNAPSHOT SOURCE]`, comparing identifiers, status, direction, and size as of explicit dates.
>
> Before calculating results, document the starting-capital, sizing, action-timing, long/short, partial-exit, open-mark, compounding, fee, and exclusion policies. Produce event-level, lifecycle-level, monthly, yearly, and current-state outputs. Include gains and losses, never add trade percentages into a portfolio return, and reconcile every portfolio total to individual contributions.
>
> Add automated checks for extraction completeness, action continuity, lifecycle status, numeric integrity, contribution reconciliation, and regression totals. Present the derived data in `[CSV/XLSX/HTML]` with filters for `[FILTERS]`, an export option, and links to every unique supporting report. Keep private source content out of public outputs. Do not publish until I explicitly approve it.

## Recommended prompt pack

For tighter control, issue the project as these eight prompts rather than one very large instruction:

1. **Scope:** Define the archive, dates, permissions, fields, deliverables, and completeness proof. Do not scrape yet.
2. **Access:** Verify the correct authenticated session with one full-content article.
3. **Extract:** Run the resumable scrape and return the manifest and failures.
4. **Structure:** Build the evidence-backed event ledger and lifecycle state machine.
5. **Enrich:** Research missing prices and weights with confidence labels.
6. **Reconcile:** Compare the reconstructed current state with the official dated snapshot.
7. **Model and audit:** Write the financial policy, calculate results, and pass tests before presenting totals.
8. **Present and publish:** Build the dashboard/export, review it locally, and publish only after a separate approval.

## Current implementation map

- `data/trades.json`: derived trade and daily-position data.
- `lib/model-policy.js`: explicit modeling assumptions.
- `lib/trade-rules.js`: dates, filters, outcomes, and action rules.
- `lib/portfolio-math.js`: allocation, contributions, annual resets, and compounding.
- `lib/data-audit.js`: source-contract and lifecycle integrity checks.
- `lib/review-links.js`: unique supporting-report links in lifecycle order.
- `app.js`: dashboard rendering, interaction, filters, and CSV export.
- `tests/`: business-rule, mathematical, data-integrity, and review-link tests.
- `AGENTS.md`: non-negotiable instructions for future agents.
- `MODEL_REVIEW.md`: formulas, results, limitations, and next improvements.

## Definition of done

The research is complete only when:

- the source universe is reconciled;
- authorized full content is preserved privately;
- structured events have evidence and confidence labels;
- lifecycle status and remaining weights are internally consistent;
- current state is reconciled against a dated official snapshot;
- formulas and exclusions are documented;
- totals reconcile to individual contributions;
- automated tests and audits pass;
- exports match the selected interface view;
- any public output is explicitly approved and independently verified after publishing.
