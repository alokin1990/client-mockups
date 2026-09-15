# Bravos trade lifecycle audit

Static dashboard for reviewing reconstructed trade actions and an action-sized $100,000 yearly portfolio model.

## Local checks

```text
npm test
npm run audit
```

Serve this directory over HTTP to use the dashboard; opening `index.html` directly cannot load `data/trades.json` in most browsers.

The formulas, assumptions, audit findings, and next improvements are documented in `MODEL_REVIEW.md`. The full prompt sequence and reusable research method are in `RESEARCH_WORKFLOW_GUIDE.md`. Future agents must also follow `AGENTS.md`.
