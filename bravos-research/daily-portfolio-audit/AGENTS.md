# Daily portfolio audit agent instructions

This is a separate continuous-account diagnostic, not the yearly-reset lifecycle model. Start with $100,000 once before the first usable entry. Date filters never reset or replay the account. Preserve the original dashboard and source dataset.

Read MODEL_REVIEW.md before changing math. Keep source preparation in scripts/, pure ledger math in lib/, and presentation in app.js. Size entries/additions from previous end-of-day equity; store actual pooled shares and cost. Entries, trims, and closes move cash. A sale's proceeds are not its profit. Shorts credit sale proceeds and create a marked liability; broker available buying power is not modeled.

Never invent missing prices or use future quotes. Carry the last known price explicitly with provenance and age. Endpoint-only recovered trades are estimates, not daily market marks. Preserve original actions and skipped-trim warnings. Exclude unresolved action chains and display every reason. No annualized headline or claims of confirmed account performance. Test both accounting identities daily and inspect representative trades, losses, shorts, adds, trims, and year crossings.
