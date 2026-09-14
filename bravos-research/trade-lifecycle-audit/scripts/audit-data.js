import { readFile } from "node:fs/promises";
import { auditDataset } from "../lib/data-audit.js";

const payload = JSON.parse(await readFile(new URL("../data/trades.json", import.meta.url), "utf8"));
const report = auditDataset(payload);

console.log(JSON.stringify(report, null, 2));
if (report.criticalIssues.length) process.exitCode = 1;
