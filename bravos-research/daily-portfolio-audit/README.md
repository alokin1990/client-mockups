# Bravos daily portfolio audit

Separate daily-trend version of the existing lifecycle dashboard. No yearly resets. It fetches ../trade-lifecycle-audit/data/trades.json and data/marks.json and replays a share-and-cash ledger in the browser. No dependencies or build required for static hosting. Keep both sibling folders in place.

## Use

Both pages have a shared navigation: Trade Review for individual lifecycles and Daily Portfolio for the continuous daily ledger. Use the common-root preview on port 4174 for working navigation between both local pages; the standalone port-4173 preview does not serve sibling folders.

- Pick a year or date window. Filters only change the view, not the account history.
- View portfolio value, cash and net active value, or daily P/L in the chart.
- Click a chart point, move the date slider, or click a daily row to inspect actions, report links, position marks and reconciled daily contributions.
- Calculation basis offers Original daily coverage (default) or With exit-based recovery estimates, including separately labeled incomplete-trim estimates.
- The four headline dollar cards are rounded to whole dollars for display only. Detailed tables and CSV retain their existing precision.
- Export daily CSV for the date window. Action-days-only affects the screen table, not the exported full calendar-day range.

## Local checks

Run `npm test`. Run `npm run prepare` from this folder only when the local private source archive and cached quotes are available; this regenerates derived marks and audit summaries without requesting new network data. `npm run preview` serves the two sibling dashboard folders locally at http://127.0.0.1:4174/daily-portfolio-audit/.

See MODEL_REVIEW.md for formulas and current limitations; AGENTS.md for future editing rules. Source article bodies, credentials and browser sessions must never be published with this page.
