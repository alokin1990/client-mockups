const state = {
  trades: [],
  dailyPositions: [],
  filtered: [],
  selectedId: null,
  sortKey: "entry_date",
  sortDirection: "desc",
  capitalModel: null,
};

const YEARLY_STARTING_CAPITAL = 100000;

const columns = [
  { key: "position_id", label: "Position ID", type: "select" },
  { key: "trade_number", label: "Trade No.", type: "number" },
  { key: "ticker", label: "Ticker" },
  { key: "asset", label: "Asset" },
  { key: "direction", label: "Direction" },
  { key: "status", label: "Status" },
  { key: "entry_date", label: "Entry Date", type: "date" },
  { key: "audit_end_date", label: "Exit or Mark Date", type: "date" },
  { key: "calendar_days", label: "Calendar Days", type: "number" },
  { key: "exposure_lifecycle", label: "Exposure Lifecycle", type: "lifecycle" },
  { key: "time_weighted_average_weight", label: "Time-Weighted Avg Weight", type: "number4" },
  { key: "modeled_entry_capital", label: "Modeled Entry Capital", type: "currency2" },
  { key: "modeled_gain_loss", label: "Gain / Loss ($)", type: "signedCurrency2" },
  { key: "total_pnl", label: "Total P/L ($/100)", type: "signed4" },
  { key: "return_on_average_capital", label: "Return on Avg Capital", type: "percent" },
  { key: "annualized_cash_flow_irr", label: "Annualized Cash-Flow IRR", type: "percent" },
  { key: "spy_return", label: "SPY Benchmark Return", type: "percent" },
  { key: "alpha_vs_spy", label: "Alpha vs SPY", type: "percent" },
  { key: "relative_efficiency_score", label: "Relative Efficiency Score", type: "score" },
  { key: "sector", label: "Sector / Theme" },
  { key: "setup", label: "Entry Setup" },
  { key: "model_status", label: "Model Status" },
  { key: "entry_link", label: "Entry Link", type: "link" },
  { key: "exit_link", label: "Exit Link", type: "link" },
];

const els = {
  year: document.querySelector("#yearFilter"),
  category: document.querySelector("#categoryFilter"),
  exportCsv: document.querySelector("#exportCsv"),
  reset: document.querySelector("#resetFilters"),
  resultCount: document.querySelector("#resultCount"),
  totalPnl: document.querySelector("#totalPnl"),
  averageReturn: document.querySelector("#averageReturn"),
  winRate: document.querySelector("#winRate"),
  annualizedReturn: document.querySelector("#annualizedReturn"),
  yearlyCapitalBody: document.querySelector("#yearlyCapitalBody"),
  categoryChart: document.querySelector("#categoryChart"),
  tableHead: document.querySelector("#tradeTable thead"),
  tableBody: document.querySelector("#tradeTable tbody"),
  empty: document.querySelector("#emptyState"),
  loading: document.querySelector("#loadingState"),
  asOf: document.querySelector("#asOfText"),
  selectionTitle: document.querySelector("#selectionTitle"),
  selectionMeta: document.querySelector("#selectionMeta"),
  entrySource: document.querySelector("#entrySource"),
  exitSource: document.querySelector("#exitSource"),
  auditKicker: document.querySelector("#auditKicker"),
  auditTitle: document.querySelector("#auditTitle"),
  auditStatus: document.querySelector("#auditStatus"),
  lifecycle: document.querySelector("#lifecycleList"),
  auditPnl: document.querySelector("#auditPnl"),
  auditEntryCapital: document.querySelector("#auditEntryCapital"),
  auditWeight: document.querySelector("#auditWeight"),
  auditReturn: document.querySelector("#auditReturn"),
  auditIrr: document.querySelector("#auditIrr"),
  auditSpy: document.querySelector("#auditSpy"),
  auditAlpha: document.querySelector("#auditAlpha"),
  auditScore: document.querySelector("#auditScore"),
};

const finite = (value) => typeof value === "number" && Number.isFinite(value);
const fmtNumber = (value, digits = 2) => finite(value)
  ? new Intl.NumberFormat("en-US", { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(value)
  : "n.a.";
const fmtSigned = (value, digits = 2) => finite(value)
  ? `${value > 0 ? "+" : ""}${fmtNumber(value, digits)}`
  : "n.a.";
const fmtPercent = (value) => finite(value)
  ? `${value > 0 ? "+" : ""}${new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value * 100)}%`
  : "n.a.";
const fmtCurrency = (value, digits = 2) => finite(value)
  ? new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: digits, maximumFractionDigits: digits }).format(value)
  : "n.a.";
const fmtSignedCurrency = (value, digits = 2) => finite(value)
  ? `${value > 0 ? "+" : ""}${fmtCurrency(value, digits)}`
  : "n.a.";

function valueClass(value) {
  if (!finite(value) || value === 0) return "";
  return value > 0 ? "value-positive" : "value-negative";
}

function setSignedValue(element, value, formatter = fmtSigned) {
  element.textContent = formatter(value);
  element.classList.remove("value-positive", "value-negative");
  const className = valueClass(value);
  if (className) element.classList.add(className);
}

function populateFilters() {
  const years = [...new Set(state.trades.flatMap((trade) => [trade.entry_date?.slice(0, 4), trade.audit_end_date?.slice(0, 4)]).filter(Boolean))].sort((a, b) => b.localeCompare(a));
  const categories = [...new Set(state.trades.map((trade) => trade.sector).filter(Boolean))].sort((a, b) => a.localeCompare(b));
  els.year.insertAdjacentHTML("beforeend", years.map((year) => `<option value="${year}">${year}</option>`).join(""));
  els.category.insertAdjacentHTML("beforeend", categories.map((category) => `<option value="${escapeHtml(category)}">${escapeHtml(category)}</option>`).join(""));
}

function tradeOverlapsYear(trade, year) {
  if (year === "all") return true;
  const start = `${year}-01-01`;
  const end = `${year}-12-31`;
  return Boolean(trade.entry_date && trade.audit_end_date && trade.entry_date <= end && trade.audit_end_date >= start);
}

function buildCapitalModel() {
  const rowsByDate = new Map();
  const dailyCapital = new Map();
  for (const row of state.dailyPositions) {
    if (!finite(row.pnl)) continue;
    if (!rowsByDate.has(row.date)) rowsByDate.set(row.date, []);
    rowsByDate.get(row.date).push(row);
    if (finite(row.capital_base)) dailyCapital.set(`${row.position_id}|${row.date}`, row.capital_base);
  }

  const datesByYear = new Map();
  for (const date of rowsByDate.keys()) {
    const year = date.slice(0, 4);
    if (!datesByYear.has(year)) datesByYear.set(year, []);
    datesByYear.get(year).push(date);
  }

  const tradeGainByYear = new Map();
  const startEquityByDate = new Map();
  const yearly = [...datesByYear.keys()].sort().map((year) => {
    let equity = YEARLY_STARTING_CAPITAL;
    const dates = datesByYear.get(year).sort();
    for (const date of dates) {
      const startEquity = equity;
      startEquityByDate.set(date, startEquity);
      let dailyGain = 0;
      for (const row of rowsByDate.get(date)) {
        const contribution = startEquity * row.pnl / 100;
        dailyGain += contribution;
        const key = `${year}|${row.position_id}`;
        tradeGainByYear.set(key, (tradeGainByYear.get(key) ?? 0) + contribution);
      }
      equity += dailyGain;
    }
    return {
      year,
      startingCapital: YEARLY_STARTING_CAPITAL,
      gainLoss: equity - YEARLY_STARTING_CAPITAL,
      endingCapital: equity,
      return: equity / YEARLY_STARTING_CAPITAL - 1,
      firstDate: dates[0],
      lastDate: dates.at(-1),
    };
  });

  const tradeGain = new Map();
  for (const [key, value] of tradeGainByYear) {
    const positionId = key.split("|")[1];
    tradeGain.set(positionId, (tradeGain.get(positionId) ?? 0) + value);
  }

  const entryCapital = new Map();
  for (const trade of state.trades) {
    const equity = startEquityByDate.get(trade.entry_date);
    const weight = dailyCapital.get(`${trade.position_id}|${trade.entry_date}`);
    if (finite(equity) && finite(weight)) entryCapital.set(trade.position_id, equity * weight / 100);
  }

  return { yearly, tradeGain, tradeGainByYear, startEquityByDate, entryCapital };
}

function selectedYear() {
  return els.year.value;
}

function modeledTradeGain(trade) {
  const year = selectedYear();
  if (!state.capitalModel) return null;
  if (year === "all") return state.capitalModel.tradeGain.get(trade.position_id) ?? null;
  return state.capitalModel.tradeGainByYear.get(`${year}|${trade.position_id}`) ?? null;
}

function columnValue(trade, column) {
  if (column.key === "modeled_entry_capital") return state.capitalModel?.entryCapital.get(trade.position_id) ?? null;
  if (column.key === "modeled_gain_loss") return modeledTradeGain(trade);
  return trade[column.key];
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function selectedDirection() {
  return document.querySelector('input[name="direction"]:checked')?.value ?? "all";
}

function applyFilters() {
  const year = els.year.value;
  const category = els.category.value;
  const direction = selectedDirection();
  state.filtered = state.trades.filter((trade) => (
    tradeOverlapsYear(trade, year)
    && (category === "all" || trade.sector === category)
    && (direction === "all" || trade.direction === direction)
  ));

  if (!state.filtered.some((trade) => trade.position_id === state.selectedId)) {
    state.selectedId = state.filtered[0]?.position_id ?? null;
  }

  els.exportCsv.disabled = state.filtered.length === 0;

  renderSummary();
  renderYearlyCapital();
  renderCategoryChart();
  renderTable();
  renderSelectedTrade();
}

function csvValue(trade, column) {
  const value = columnValue(trade, column);
  if (value == null) return "";
  if (column.type === "percent") return finite(value) ? `${(value * 100).toFixed(4)}%` : "";
  if (["number", "number4", "signed4", "score", "currency2", "signedCurrency2"].includes(column.type)) return finite(value) ? String(value) : "";
  return String(value);
}

function escapeCsv(value) {
  const safe = /^[=+@]/.test(value) ? `'${value}` : value;
  return `"${safe.replaceAll('"', '""')}"`;
}

function fileSlug(value) {
  return String(value).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "all";
}

function exportFilteredCsv() {
  if (!state.filtered.length) return;
  const headers = columns.map((column) => escapeCsv(column.label));
  const rows = [...state.filtered].sort(compareTrades).map((trade) => columns.map((column) => escapeCsv(csvValue(trade, column))).join(","));
  const csv = `\uFEFF${[headers.join(","), ...rows].join("\r\n")}`;
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const year = els.year.value === "all" ? "all-years" : els.year.value;
  const category = els.category.value === "all" ? "all-categories" : fileSlug(els.category.value);
  const direction = selectedDirection() === "all" ? "all-directions" : selectedDirection().toLowerCase();
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `bravos-trades-${year}-${category}-${direction}.csv`;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function renderSummary() {
  els.resultCount.textContent = state.filtered.length.toLocaleString("en-US");
  const returnRows = state.filtered.filter((trade) => finite(trade.return_on_average_capital));
  const filteredIds = new Set(state.filtered.map((trade) => trade.position_id));
  const year = selectedYear();
  const dailyPnl = new Map();
  for (const row of state.dailyPositions) {
    if (!filteredIds.has(row.position_id) || !finite(row.pnl) || (year !== "all" && !row.date.startsWith(year))) continue;
    dailyPnl.set(row.date, (dailyPnl.get(row.date) ?? 0) + row.pnl);
  }
  const dailyEntries = [...dailyPnl.entries()].sort(([dateA], [dateB]) => dateA.localeCompare(dateB));
  const compoundedReturn = dailyEntries.length
    ? dailyEntries.reduce((growth, [, pnl]) => growth * (1 + pnl / 100), 1) - 1
    : null;
  const firstDate = dailyEntries.length ? new Date(`${dailyEntries[0][0]}T00:00:00Z`) : null;
  const lastDate = dailyEntries.length ? new Date(`${dailyEntries.at(-1)[0]}T00:00:00Z`) : null;
  const elapsedDays = firstDate && lastDate ? Math.max((lastDate - firstDate) / 86400000, 1) : null;
  const annualizedReturn = finite(compoundedReturn) && elapsedDays && compoundedReturn > -1
    ? Math.pow(1 + compoundedReturn, 365 / elapsedDays) - 1
    : null;
  const averageReturn = returnRows.length ? returnRows.reduce((sum, trade) => sum + trade.return_on_average_capital, 0) / returnRows.length : null;
  const modeledGains = state.filtered.map(modeledTradeGain).filter(finite);
  const grossGains = modeledGains.reduce((sum, value) => sum + Math.max(value, 0), 0);
  const grossLosses = modeledGains.reduce((sum, value) => sum + Math.abs(Math.min(value, 0)), 0);
  const gainWeightedWinRate = grossGains + grossLosses > 0 ? grossGains / (grossGains + grossLosses) : null;
  setSignedValue(els.totalPnl, compoundedReturn, fmtPercent);
  setSignedValue(els.averageReturn, averageReturn, fmtPercent);
  els.winRate.textContent = finite(gainWeightedWinRate) ? fmtPercent(gainWeightedWinRate).replace("+", "") : "n.a.";
  setSignedValue(els.annualizedReturn, annualizedReturn, fmtPercent);
}

function renderYearlyCapital() {
  const requestedYear = selectedYear();
  const knownYears = [...new Set(state.trades.flatMap((trade) => [trade.entry_date?.slice(0, 4), trade.audit_end_date?.slice(0, 4)]).filter(Boolean))].sort((a, b) => b.localeCompare(a));
  const years = requestedYear === "all" ? knownYears : [requestedYear];
  const results = new Map((state.capitalModel?.yearly ?? []).map((row) => [row.year, row]));
  els.yearlyCapitalBody.innerHTML = years.map((year) => {
    const row = results.get(year);
    if (!row) return `<tr><td>${year}</td><td>${fmtCurrency(YEARLY_STARTING_CAPITAL, 0)}</td><td>n.a.</td><td>n.a.</td><td>n.a.</td></tr>`;
    return `<tr>
      <td>${year}</td>
      <td>${fmtCurrency(row.startingCapital, 0)}</td>
      <td class="${valueClass(row.gainLoss)}">${fmtSignedCurrency(row.gainLoss, 2)}</td>
      <td>${fmtCurrency(row.endingCapital, 2)}</td>
      <td class="${valueClass(row.return)}">${fmtPercent(row.return)}</td>
    </tr>`;
  }).join("");
}

function renderCategoryChart() {
  const totals = new Map();
  for (const trade of state.filtered) {
    const value = modeledTradeGain(trade);
    if (!finite(value)) continue;
    totals.set(trade.sector, (totals.get(trade.sector) ?? 0) + value);
  }
  const sorted = [...totals.entries()].sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]));
  const displayed = sorted.slice(0, 8);
  if (sorted.length > 8) displayed.push(["Other categories", sorted.slice(8).reduce((sum, [, value]) => sum + value, 0)]);
  const max = Math.max(...displayed.map(([, value]) => Math.abs(value)), 0.000001);

  if (!displayed.length) {
    els.categoryChart.innerHTML = '<div class="empty-state">No modeled P/L is available for this view.</div>';
    return;
  }

  els.categoryChart.innerHTML = displayed.map(([label, value]) => {
    const width = Math.abs(value) / max * 50;
    const left = value >= 0 ? 50 : 50 - width;
    return `<div class="bar-row">
      <span class="bar-label" title="${escapeHtml(label)}">${escapeHtml(label)}</span>
      <span class="bar-track"><span class="bar-zero"></span><span class="bar-fill ${value < 0 ? "negative" : ""}" style="left:${left}%;width:${width}%"></span></span>
      <span class="bar-value ${valueClass(value)}">${fmtSignedCurrency(value, 0)}</span>
    </div>`;
  }).join("");
}

function compareTrades(a, b) {
  const column = columns.find((item) => item.key === state.sortKey) ?? { key: state.sortKey };
  const left = columnValue(a, column);
  const right = columnValue(b, column);
  const factor = state.sortDirection === "asc" ? 1 : -1;
  if (left == null && right == null) return 0;
  if (left == null) return 1;
  if (right == null) return -1;
  if (typeof left === "number" && typeof right === "number") return (left - right) * factor;
  return String(left).localeCompare(String(right)) * factor;
}

function renderCell(trade, column) {
  const value = columnValue(trade, column);
  if (column.type === "select") return `<button class="select-trade" type="button" data-position="${escapeHtml(value)}">${escapeHtml(value)}</button>`;
  if (column.type === "date") return escapeHtml(value || "n.a.");
  if (column.type === "number") return finite(value) ? value.toLocaleString("en-US") : "n.a.";
  if (column.type === "number4") return fmtNumber(value, 4);
  if (column.type === "signed4") return `<span class="${valueClass(value)}">${fmtSigned(value, 4)}</span>`;
  if (column.type === "currency2") return fmtCurrency(value, 2);
  if (column.type === "signedCurrency2") return `<span class="${valueClass(value)}">${fmtSignedCurrency(value, 2)}</span>`;
  if (column.type === "percent") return `<span class="${valueClass(value)}">${fmtPercent(value)}</span>`;
  if (column.type === "score") return fmtNumber(value, 1);
  if (column.type === "link") return value ? `<a href="${escapeHtml(value)}" target="_blank" rel="noopener">Open ↗</a>` : "n.a.";
  return escapeHtml(value || "n.a.");
}

function renderTable() {
  const rows = [...state.filtered].sort(compareTrades);
  els.tableHead.innerHTML = `<tr>${columns.map((column) => {
    const active = column.key === state.sortKey;
    const direction = active ? state.sortDirection : "none";
    return `<th scope="col" aria-sort="${direction === "asc" ? "ascending" : direction === "desc" ? "descending" : "none"}"><button type="button" data-sort="${column.key}">${escapeHtml(column.label)}${active ? (direction === "asc" ? " ↑" : " ↓") : ""}</button></th>`;
  }).join("")}</tr>`;
  els.tableBody.innerHTML = rows.map((trade) => `<tr class="${trade.position_id === state.selectedId ? "selected" : ""}" data-position="${escapeHtml(trade.position_id)}">
    ${columns.map((column) => `<td class="${["number", "number4", "signed4", "currency2", "signedCurrency2", "percent", "score"].includes(column.type) ? "numeric" : ""} ${column.type === "lifecycle" ? "lifecycle-cell" : ""}">${renderCell(trade, column)}</td>`).join("")}
  </tr>`).join("");
  els.empty.hidden = rows.length !== 0;
  document.querySelector("#tradeTable").hidden = rows.length === 0;
}

function setSourceLink(element, url) {
  if (url) {
    element.href = url;
    element.target = "_blank";
    element.rel = "noopener";
    element.classList.remove("disabled");
  } else {
    element.href = "#";
    element.removeAttribute("target");
    element.classList.add("disabled");
  }
}

function renderSelectedTrade() {
  const trade = state.trades.find((item) => item.position_id === state.selectedId);
  if (!trade) {
    els.selectionTitle.textContent = "No trade selected";
    els.selectionMeta.textContent = "Change the filters to show available positions.";
    els.auditTitle.textContent = "No matching trade";
    els.auditStatus.textContent = "—";
    els.lifecycle.innerHTML = "<li>No lifecycle is available.</li>";
    return;
  }

  els.selectionTitle.textContent = `${trade.ticker} · ${trade.asset}`;
  els.selectionMeta.textContent = `${trade.direction} · ${trade.sector} · ${trade.entry_date} to ${trade.audit_end_date} · ${trade.calendar_days ?? "n.a."} days`;
  setSourceLink(els.entrySource, trade.entry_link);
  setSourceLink(els.exitSource, trade.exit_link);
  els.auditKicker.textContent = `${trade.asset} · ${trade.direction}`;
  els.auditTitle.textContent = `$${trade.ticker} · Trade #${trade.trade_number}`;
  els.auditStatus.textContent = trade.status;

  const actions = Array.isArray(trade.actions) && trade.actions.length
    ? trade.actions.map((action) => {
      const before = finite(action.weight_before) ? fmtNumber(action.weight_before, 1) : "n.a.";
      const after = finite(action.weight_after) ? fmtNumber(action.weight_after, 1) : "n.a.";
      const price = finite(action.price) ? `$${fmtNumber(action.price, 2)}` : "n.a.";
      const equity = state.capitalModel?.startEquityByDate.get(action.date);
      const exposure = finite(equity) && finite(action.weight_after) ? equity * action.weight_after / 100 : null;
      const exposureText = finite(exposure) ? ` · exposure after ${fmtCurrency(exposure, 0)}` : "";
      return `${action.date} · ${action.type} · weight ${before} → ${after} · ${price}${exposureText}`;
    })
    : String(trade.exposure_lifecycle || "No lifecycle available").split(" | ");
  els.lifecycle.innerHTML = actions.map((action) => `<li>${escapeHtml(action)}</li>`).join("");

  els.auditEntryCapital.textContent = fmtCurrency(state.capitalModel?.entryCapital.get(trade.position_id) ?? null, 2);
  setSignedValue(els.auditPnl, modeledTradeGain(trade), fmtSignedCurrency);
  els.auditWeight.textContent = fmtNumber(trade.time_weighted_average_weight, 4);
  setSignedValue(els.auditReturn, trade.return_on_average_capital, fmtPercent);
  setSignedValue(els.auditIrr, trade.annualized_cash_flow_irr, fmtPercent);
  setSignedValue(els.auditSpy, trade.spy_return, fmtPercent);
  setSignedValue(els.auditAlpha, trade.alpha_vs_spy, fmtPercent);
  els.auditScore.textContent = finite(trade.relative_efficiency_score) ? `${fmtNumber(trade.relative_efficiency_score, 1)} / 10` : "n.a.";
}

function wireEvents() {
  els.year.addEventListener("change", applyFilters);
  els.category.addEventListener("change", applyFilters);
  document.querySelectorAll('input[name="direction"]').forEach((input) => input.addEventListener("change", applyFilters));
  els.exportCsv.addEventListener("click", exportFilteredCsv);
  els.reset.addEventListener("click", () => {
    els.year.value = "all";
    els.category.value = "all";
    document.querySelector("#directionAll").checked = true;
    applyFilters();
  });
  els.tableHead.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-sort]");
    if (!button) return;
    const key = button.dataset.sort;
    if (state.sortKey === key) state.sortDirection = state.sortDirection === "asc" ? "desc" : "asc";
    else { state.sortKey = key; state.sortDirection = "asc"; }
    renderTable();
  });
  els.tableBody.addEventListener("click", (event) => {
    const row = event.target.closest("tr[data-position]");
    if (!row) return;
    state.selectedId = row.dataset.position;
    renderTable();
    renderSelectedTrade();
    document.querySelector("#auditTitle").scrollIntoView({ behavior: "smooth", block: "center" });
  });
}

async function initialize() {
  wireEvents();
  try {
    const response = await fetch("./data/trades.json", { cache: "no-store" });
    if (!response.ok) throw new Error(`Trade data request failed with ${response.status}`);
    const payload = await response.json();
    state.trades = Array.isArray(payload.trades) ? payload.trades : [];
    state.dailyPositions = Array.isArray(payload.daily_positions) ? payload.daily_positions : [];
    state.capitalModel = buildCapitalModel();
    state.selectedId = state.trades.some((trade) => trade.position_id === "P0305") ? "P0305" : state.trades[0]?.position_id ?? null;
    els.asOf.textContent = `Data through ${payload.metadata?.cutoff_date ?? "latest available date"}`;
    populateFilters();
    applyFilters();
    els.loading.hidden = true;
  } catch (error) {
    console.error(error);
    els.loading.textContent = "Trade data could not be loaded.";
    els.empty.hidden = false;
    els.empty.textContent = "The dashboard needs to be served over HTTP so it can read data/trades.json.";
  }
}

initialize();
