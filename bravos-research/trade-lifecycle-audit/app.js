const state = {
  trades: [],
  dailyPositions: [],
  filtered: [],
  selectedId: null,
  sortKey: "entry_date",
  sortDirection: "desc",
};

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
  reset: document.querySelector("#resetFilters"),
  resultCount: document.querySelector("#resultCount"),
  totalPnl: document.querySelector("#totalPnl"),
  averageReturn: document.querySelector("#averageReturn"),
  winRate: document.querySelector("#winRate"),
  annualizedReturn: document.querySelector("#annualizedReturn"),
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
  const years = [...new Set(state.trades.map((trade) => trade.entry_date?.slice(0, 4)).filter(Boolean))].sort((a, b) => b.localeCompare(a));
  const categories = [...new Set(state.trades.map((trade) => trade.sector).filter(Boolean))].sort((a, b) => a.localeCompare(b));
  els.year.insertAdjacentHTML("beforeend", years.map((year) => `<option value="${year}">${year}</option>`).join(""));
  els.category.insertAdjacentHTML("beforeend", categories.map((category) => `<option value="${escapeHtml(category)}">${escapeHtml(category)}</option>`).join(""));
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
    (year === "all" || trade.entry_date?.startsWith(year))
    && (category === "all" || trade.sector === category)
    && (direction === "all" || trade.direction === direction)
  ));

  if (!state.filtered.some((trade) => trade.position_id === state.selectedId)) {
    state.selectedId = state.filtered[0]?.position_id ?? null;
  }

  renderSummary();
  renderCategoryChart();
  renderTable();
  renderSelectedTrade();
}

function renderSummary() {
  els.resultCount.textContent = state.filtered.length.toLocaleString("en-US");
  const pnlRows = state.filtered.filter((trade) => finite(trade.total_pnl));
  const returnRows = state.filtered.filter((trade) => finite(trade.return_on_average_capital));
  const filteredIds = new Set(state.filtered.map((trade) => trade.position_id));
  const dailyPnl = new Map();
  for (const row of state.dailyPositions) {
    if (!filteredIds.has(row.position_id) || !finite(row.pnl)) continue;
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
  const winRate = pnlRows.length ? pnlRows.filter((trade) => trade.total_pnl > 0).length / pnlRows.length : null;
  setSignedValue(els.totalPnl, compoundedReturn, fmtPercent);
  setSignedValue(els.averageReturn, averageReturn, fmtPercent);
  els.winRate.textContent = finite(winRate) ? fmtPercent(winRate).replace("+", "") : "n.a.";
  setSignedValue(els.annualizedReturn, annualizedReturn, fmtPercent);
}

function renderCategoryChart() {
  const totals = new Map();
  for (const trade of state.filtered) {
    if (!finite(trade.total_pnl)) continue;
    totals.set(trade.sector, (totals.get(trade.sector) ?? 0) + trade.total_pnl);
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
      <span class="bar-value ${valueClass(value)}">${fmtSigned(value, 2)}</span>
    </div>`;
  }).join("");
}

function compareTrades(a, b) {
  const left = a[state.sortKey];
  const right = b[state.sortKey];
  const factor = state.sortDirection === "asc" ? 1 : -1;
  if (left == null && right == null) return 0;
  if (left == null) return 1;
  if (right == null) return -1;
  if (typeof left === "number" && typeof right === "number") return (left - right) * factor;
  return String(left).localeCompare(String(right)) * factor;
}

function renderCell(trade, column) {
  const value = trade[column.key];
  if (column.type === "select") return `<button class="select-trade" type="button" data-position="${escapeHtml(value)}">${escapeHtml(value)}</button>`;
  if (column.type === "date") return escapeHtml(value || "n.a.");
  if (column.type === "number") return finite(value) ? value.toLocaleString("en-US") : "n.a.";
  if (column.type === "number4") return fmtNumber(value, 4);
  if (column.type === "signed4") return `<span class="${valueClass(value)}">${fmtSigned(value, 4)}</span>`;
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
    ${columns.map((column) => `<td class="${["number", "number4", "signed4", "percent", "score"].includes(column.type) ? "numeric" : ""} ${column.type === "lifecycle" ? "lifecycle-cell" : ""}">${renderCell(trade, column)}</td>`).join("")}
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
      return `${action.date} · ${action.type} · weight ${before} → ${after} · ${price}`;
    })
    : String(trade.exposure_lifecycle || "No lifecycle available").split(" | ");
  els.lifecycle.innerHTML = actions.map((action) => `<li>${escapeHtml(action)}</li>`).join("");

  setSignedValue(els.auditPnl, trade.total_pnl, (value) => finite(value) ? `${value > 0 ? "+" : ""}$${fmtNumber(value, 4)} / $100` : "n.a.");
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
