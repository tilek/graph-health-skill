(() => {
  const state = {
    rows: [],
    tests: {},          // test_name -> array of rows, sorted by date
    categoryFilter: "All",
    tableSort: { col: "date", dir: "desc" },
  };

  function getVar(name) {
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  }

  // Warm Chart.js defaults
  if (typeof Chart !== "undefined") {
    Chart.defaults.font.family = '"Spectral", "Source Serif 4", Georgia, serif';
    Chart.defaults.font.size = 12;
    Chart.defaults.color = getVar("--ink-soft");
  }

  const fmt = (v) => {
    if (v === null || v === undefined || v === "") return "—";
    if (typeof v === "number") {
      if (Math.abs(v) >= 100) return v.toFixed(0);
      if (Math.abs(v) >= 10) return v.toFixed(1);
      return v.toFixed(2);
    }
    return String(v);
  };

  const fmtSigned = (v) => {
    if (v === null || v === undefined || v === "") return "";
    const s = fmt(Math.abs(v));
    if (v > 0) return `+${s}`;
    if (v < 0) return `−${s}`;
    return `±${s}`;
  };

  const parseRow = (r) => ({
    ...r,
    value: r.value === "" ? null : Number(r.value),
    reference_low: r.reference_low === "" ? null : Number(r.reference_low),
    reference_high: r.reference_high === "" ? null : Number(r.reference_high),
  });

  async function load() {
    const res = await fetch("/api/data");
    const payload = await res.json();
    state.rows = (payload.rows || []).map(parseRow);
    state.csvPath = payload.csv_path;

    if (!state.rows.length) {
      renderEmpty();
      return;
    }

    state.rows.sort((a, b) => a.date.localeCompare(b.date));
    state.tests = {};
    for (const r of state.rows) {
      if (!state.tests[r.test_name]) state.tests[r.test_name] = [];
      state.tests[r.test_name].push(r);
    }

    renderMeta();
    renderSources();
    renderPriorities();
    renderSummary();
    renderCategoryFilter();
    renderCharts();
    renderTable();
  }

  const SEVERITY_RANK = { attention: 0, watch: 1, info: 2 };
  const SEVERITY_LABEL = { attention: "Needs attention", watch: "Worth watching", info: "Context" };

  function renderPriorities() {
    const recs = window.RECOMMENDATIONS || {};
    const entries = [];
    for (const [test, rec] of Object.entries(recs)) {
      if (!state.tests[test]) continue;
      const latest = state.tests[test][state.tests[test].length - 1];
      entries.push({ test, rec, latest });
    }
    entries.sort((a, b) => {
      const ra = SEVERITY_RANK[a.rec.severity] ?? 9;
      const rb = SEVERITY_RANK[b.rec.severity] ?? 9;
      return ra - rb || a.test.localeCompare(b.test);
    });

    const section = document.getElementById("priorities");
    const list = document.getElementById("priorities-list");
    if (!entries.length) {
      section.hidden = true;
      return;
    }
    section.hidden = false;

    list.innerHTML = entries.map(({ test, rec, latest }) => {
      const flag = latest.flag || "";
      const rangeStr = (latest.reference_low != null || latest.reference_high != null)
        ? `range ${latest.reference_low ?? "—"}–${latest.reference_high ?? "—"}`
        : "";
      const actionsHtml = (rec.actions || []).map((a) => `<li>${escapeHtml(a)}</li>`).join("");
      return `
        <article class="priority-card sev-${rec.severity}" data-test="${escapeHtml(test)}">
          <div class="priority-top">
            <span class="priority-name">${escapeHtml(test)}</span>
            <span class="priority-sev sev-${rec.severity}">${escapeHtml(SEVERITY_LABEL[rec.severity] || rec.severity)}</span>
          </div>
          <div class="priority-meta">
            <span class="priority-val">${fmt(latest.value)}<span class="unit">${escapeHtml(latest.unit || "")}</span></span>
            ${flag ? `<span class="flag ${flag}">${flag}</span>` : ""}
            ${rangeStr ? `<span class="priority-range">${escapeHtml(rangeStr)}</span>` : ""}
            <span class="priority-range">${escapeHtml(latest.date)}</span>
          </div>
          <p class="priority-headline">${escapeHtml(rec.headline)}</p>
          <p class="priority-detail">${escapeHtml(rec.detail)}</p>
          ${actionsHtml ? `<ul class="priority-actions">${actionsHtml}</ul>` : ""}
        </article>`;
    }).join("");

    list.querySelectorAll(".priority-card").forEach((card) => {
      card.addEventListener("click", () => openDetail(card.dataset.test));
    });
  }

  function basename(p) {
    if (!p) return "";
    const parts = String(p).split(/[\\/]/);
    return parts[parts.length - 1];
  }

  function renderSources() {
    const groups = {};
    for (const r of state.rows) {
      const src = r.source_file || "(unknown)";
      if (!groups[src]) groups[src] = { dates: new Set(), count: 0 };
      groups[src].dates.add(r.date);
      groups[src].count += 1;
    }
    const entries = Object.entries(groups).map(([src, g]) => {
      const dates = [...g.dates].sort();
      return { src, count: g.count, first: dates[0], last: dates[dates.length - 1] };
    }).sort((a, b) => a.first.localeCompare(b.first) || a.src.localeCompare(b.src));

    document.getElementById("sources-count").textContent = `· ${entries.length}`;

    const list = document.getElementById("sources-list");
    list.innerHTML = entries.map((e) => {
      const span = e.first === e.last ? e.first : `${e.first} — ${e.last}`;
      return `
        <li data-src="${escapeHtml(e.src)}" title="Click to view all readings from this file">
          <span class="src-name">${escapeHtml(e.src)}</span>
          <span class="src-dates">${escapeHtml(span)}</span>
          <span class="src-count">${e.count} readings</span>
        </li>`;
    }).join("");

    list.querySelectorAll("li").forEach((li) => {
      li.addEventListener("click", () => jumpToRecord(li.dataset.src));
    });
  }

  function jumpToRecord(query) {
    const searchEl = document.getElementById("table-search");
    searchEl.value = query;
    searchEl.dispatchEvent(new Event("input"));
    activateTab("table");
    searchEl.focus();
    searchEl.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function activateTab(name) {
    document.querySelectorAll(".tab").forEach((t) =>
      t.classList.toggle("active", t.dataset.target === name));
    document.querySelectorAll(".panel").forEach((p) =>
      p.classList.toggle("active", p.id === name));
  }

  function renderEmpty() {
    const target = document.getElementById("summary-grid");
    target.innerHTML = `
      <div class="empty" style="grid-column: 1 / -1;">
        <p>The ledger is empty.</p>
        <p>Record your first reading with <code>scripts/append_to_csv.py --csv ${escapeHtml(state.csvPath || "health_data.csv")}</code>, then refresh.</p>
      </div>`;
    document.getElementById("meta").textContent = "No readings yet";
  }

  function renderMeta() {
    const dates = [...new Set(state.rows.map((r) => r.date))].sort();
    const testCount = Object.keys(state.tests).length;
    document.getElementById("meta").textContent =
      `${state.rows.length} readings · ${testCount} tests · ${dates[0]} — ${dates[dates.length - 1]}`;
  }

  function renderSummary() {
    const grid = document.getElementById("summary-grid");
    const names = Object.keys(state.tests).sort();
    grid.innerHTML = names.map((name) => {
      const series = state.tests[name];
      const latest = series[series.length - 1];
      const prev = series.length > 1 ? series[series.length - 2] : null;
      const delta = prev && prev.value != null && latest.value != null ? latest.value - prev.value : null;
      const deltaClass = delta == null ? "flat" : delta > 0 ? "up" : delta < 0 ? "down" : "flat";
      const deltaStr = delta == null ? "—" : fmtSigned(delta);
      const flag = latest.flag || "";
      const uniqueSources = new Set(series.map((r) => r.source_file).filter(Boolean));
      const provenance = renderProvenance(latest, uniqueSources.size, series.length);
      return `
        <article class="card" data-test="${escapeHtml(name)}" title="Click to see every reading of ${escapeHtml(name)} with its source">
          <div class="name">
            <span class="name-text">${escapeHtml(name)}</span>
            ${flag ? `<span class="flag ${flag}">${flag}</span>` : ""}
          </div>
          <div class="value">${fmt(latest.value)}<span class="unit">${escapeHtml(latest.unit || "")}</span></div>
          <div class="sub">
            <span class="date">${escapeHtml(latest.date)}</span>
            <span class="delta ${deltaClass}">${escapeHtml(deltaStr)}</span>
          </div>
          ${provenance}
        </article>`;
    }).join("");

    grid.querySelectorAll(".card").forEach((card) => {
      card.addEventListener("click", () => openDetail(card.dataset.test));
    });
  }

  function openDetail(testName) {
    const series = state.tests[testName];
    if (!series || !series.length) return;
    const latest = series[series.length - 1];
    const info = (window.BIOMARKERS || {})[testName];

    document.getElementById("detail-category").textContent = latest.category || "";
    document.getElementById("detail-name").textContent = testName;

    const flag = latest.flag || "";
    const rangeStr = (latest.reference_low != null || latest.reference_high != null)
      ? `range ${latest.reference_low ?? "—"}..${latest.reference_high ?? "—"}`
      : "no reference range reported";
    document.getElementById("detail-latest").innerHTML = `
      <span class="detail-val">${fmt(latest.value)}<span class="unit">${escapeHtml(latest.unit || "")}</span></span>
      ${flag ? `<span class="flag ${flag}">${flag}</span>` : ""}
      <span class="detail-date">${escapeHtml(latest.date)}</span>
      <span class="detail-range">${escapeHtml(rangeStr)}</span>
    `;

    // Personalized recommendation block (if any)
    const rec = (window.RECOMMENDATIONS || {})[testName];
    const recBox = document.getElementById("detail-rec");
    if (rec) {
      recBox.hidden = false;
      recBox.className = `detail-rec sev-${rec.severity}`;
      const labelEl = document.getElementById("detail-rec-label");
      labelEl.textContent = SEVERITY_LABEL[rec.severity] || rec.severity;
      labelEl.className = `detail-rec-label sev-${rec.severity}`;
      document.getElementById("detail-rec-headline").textContent = rec.headline || "";
      document.getElementById("detail-rec-detail").textContent = rec.detail || "";
      const recActions = document.getElementById("detail-rec-actions");
      recActions.innerHTML = (rec.actions || []).map((a) => `<li>${escapeHtml(a)}</li>`).join("");
      recActions.style.display = (rec.actions && rec.actions.length) ? "" : "none";
    } else {
      recBox.hidden = true;
    }

    const aboutSec = document.getElementById("detail-about");
    const interpSec = document.getElementById("detail-interpret");
    const suggestSec = document.getElementById("detail-suggest");

    if (info) {
      aboutSec.style.display = "";
      interpSec.style.display = "";
      suggestSec.style.display = "";
      document.getElementById("detail-desc").textContent = info.description || "";
      const interpBody = document.getElementById("detail-interpret-body");
      const rows = [];
      if (info.high) rows.push(`<dt class="hi">If high</dt><dd>${escapeHtml(info.high)}</dd>`);
      if (info.low)  rows.push(`<dt class="lo">If low</dt><dd>${escapeHtml(info.low)}</dd>`);
      interpBody.innerHTML = rows.join("");
      interpSec.style.display = rows.length ? "" : "none";
      const sug = document.getElementById("detail-suggestions");
      sug.innerHTML = (info.suggestions || []).map((s) => `<li>${escapeHtml(s)}</li>`).join("");
      suggestSec.style.display = (info.suggestions && info.suggestions.length) ? "" : "none";
    } else {
      aboutSec.innerHTML = `
        <h3>About this test</h3>
        <div class="detail-missing">No reference notes yet for “${escapeHtml(testName)}”. The numerical history below is pulled directly from your source files.</div>`;
      interpSec.style.display = "none";
      suggestSec.style.display = "none";
    }

    // Readings history (newest first)
    const hist = [...series].reverse();
    document.getElementById("detail-history-count").textContent = `· ${hist.length} reading${hist.length === 1 ? "" : "s"}`;
    const tbody = document.querySelector("#detail-history-table tbody");
    tbody.innerHTML = hist.map((r) => `
      <tr>
        <td>${escapeHtml(r.date)}</td>
        <td class="num">${fmt(r.value)} ${escapeHtml(r.unit || "")}</td>
        <td>${r.flag ? `<span class="flag ${r.flag}">${r.flag}</span>` : ""}</td>
        <td class="src" title="${escapeHtml(r.source_file || "")}">${escapeHtml(basename(r.source_file) || "—")}</td>
      </tr>`).join("");

    const dialog = document.getElementById("detail");
    const record = document.getElementById("detail-view-record");
    record.onclick = () => {
      if (typeof dialog.close === "function") dialog.close();
      jumpToRecord(testName);
    };

    // Clicking the backdrop closes the dialog
    dialog.onclick = (ev) => {
      if (ev.target === dialog) dialog.close();
    };

    if (typeof dialog.showModal === "function") {
      dialog.showModal();
      dialog.scrollTop = 0;
      const scroll = dialog.querySelector(".detail-body");
      if (scroll) scroll.scrollTop = 0;
    } else {
      // Fallback for very old browsers: just jump to record
      jumpToRecord(testName);
    }
  }

  function renderProvenance(latest, uniqueSourceCount, totalReadings) {
    const src = basename(latest.source_file);
    if (!src) return "";
    if (uniqueSourceCount <= 1) {
      return `<div class="provenance"><span class="prov-label">from</span><cite>${escapeHtml(src)}</cite></div>`;
    }
    return `<div class="provenance"><span class="prov-label">latest from</span><cite>${escapeHtml(src)}</cite> <span class="multi">· ${totalReadings} readings across ${uniqueSourceCount} sources</span></div>`;
  }

  function renderCategoryFilter() {
    const cats = [...new Set(state.rows.map((r) => r.category).filter(Boolean))].sort();
    cats.unshift("All");
    const container = document.getElementById("category-filter");
    container.innerHTML = cats.map((c) =>
      `<button class="chip ${c === state.categoryFilter ? "active" : ""}" data-cat="${escapeHtml(c)}">${escapeHtml(c)}</button>`
    ).join("");
    container.querySelectorAll(".chip").forEach((btn) => {
      btn.addEventListener("click", () => {
        state.categoryFilter = btn.dataset.cat;
        renderCategoryFilter();
        renderCharts();
      });
    });
  }

  const charts = [];

  function renderCharts() {
    const container = document.getElementById("chart-container");
    charts.forEach((c) => c.destroy());
    charts.length = 0;
    container.innerHTML = "";

    const names = Object.keys(state.tests)
      .filter((n) => state.categoryFilter === "All" || state.tests[n][0].category === state.categoryFilter)
      .sort();

    if (!names.length) {
      container.innerHTML = `<div class="empty" style="grid-column: 1 / -1;"><p>No tests in this category.</p></div>`;
      return;
    }

    const rust     = getVar("--rust");
    const rustDeep = getVar("--rust-deep");
    const ink      = getVar("--ink");
    const inkSoft  = getVar("--ink-soft");
    const inkFaint = getVar("--ink-faint");
    const paper    = getVar("--paper-soft");
    const band     = getVar("--band");
    const bandEdge = getVar("--band-edge");
    const rule     = getVar("--rule-soft");

    for (const name of names) {
      const series = state.tests[name].filter((r) => r.value != null);
      if (!series.length) continue;

      const card = document.createElement("section");
      card.className = "chart-card";
      const unit = series[series.length - 1].unit || "";
      const category = series[0].category || "";
      card.innerHTML = `
        <h3>${escapeHtml(name)}</h3>
        <p class="sub">${escapeHtml(category)}${unit ? ` · measured in ${escapeHtml(unit)}` : ""}</p>
        <div class="chart-wrap"><canvas></canvas></div>`;
      container.appendChild(card);
      const canvas = card.querySelector("canvas");

      const points = series.map((r) => ({ x: r.date, y: r.value }));
      const lo = series.map((r) => r.reference_low).find((v) => v != null) ?? null;
      const hi = series.map((r) => r.reference_high).find((v) => v != null) ?? null;
      const xs = series.map((r) => r.date);

      const datasets = [
        {
          label: name,
          data: points,
          borderColor: rust,
          backgroundColor: rust,
          borderWidth: 2,
          tension: 0.2,
          fill: false,
          pointRadius: 5,
          pointHoverRadius: 7,
          pointBackgroundColor: paper,
          pointBorderColor: rustDeep,
          pointBorderWidth: 2,
          order: 0,
        },
      ];

      if (hi != null) {
        datasets.push({
          label: "Reference high",
          data: xs.map((x) => ({ x, y: hi })),
          borderColor: bandEdge,
          borderWidth: 1,
          borderDash: [3, 5],
          pointRadius: 0,
          fill: lo != null ? "+1" : false,
          backgroundColor: band,
          tension: 0,
          order: 2,
        });
      }
      if (lo != null) {
        datasets.push({
          label: "Reference low",
          data: xs.map((x) => ({ x, y: lo })),
          borderColor: bandEdge,
          borderWidth: 1,
          borderDash: [3, 5],
          pointRadius: 0,
          fill: false,
          tension: 0,
          order: 3,
        });
      }

      const chart = new Chart(canvas, {
        type: "line",
        data: { datasets },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          interaction: { mode: "index", intersect: false },
          layout: { padding: { top: 8, right: 6, bottom: 0, left: 0 } },
          plugins: {
            legend: { display: false },
            tooltip: {
              backgroundColor: ink,
              titleColor: paper,
              bodyColor: paper,
              borderColor: rust,
              borderWidth: 1,
              cornerRadius: 2,
              displayColors: false,
              padding: { x: 12, y: 9 },
              titleFont: { family: '"Spectral", serif', size: 12, weight: "500" },
              bodyFont:  { family: '"Spectral", serif', size: 13, style: "italic" },
              callbacks: {
                title: (items) => items[0]?.label ? new Date(items[0].parsed.x).toISOString().slice(0, 10) : "",
                label: (ctx) => {
                  if (ctx.dataset.label === name) {
                    const r = series[ctx.dataIndex];
                    const flag = r?.flag ? `  · ${r.flag}` : "";
                    return `${fmt(ctx.parsed.y)} ${unit}${flag}`;
                  }
                  return `${ctx.dataset.label}: ${fmt(ctx.parsed.y)}`;
                },
                afterLabel: (ctx) => {
                  if (ctx.dataset.label !== name) return "";
                  const r = series[ctx.dataIndex];
                  const src = basename(r?.source_file);
                  return src ? `from ${src}` : "";
                },
              },
            },
          },
          scales: {
            x: {
              type: "time",
              time: { unit: pickTimeUnit(xs), tooltipFormat: "yyyy-MM-dd" },
              grid: { color: rule, tickColor: rule, drawTicks: false },
              border: { color: inkFaint },
              ticks: {
                color: inkSoft,
                font: { family: '"Spectral", serif', size: 11, style: "italic" },
                padding: 8,
                maxRotation: 0,
              },
            },
            y: {
              grid: { color: rule, tickColor: rule, drawTicks: false },
              border: { color: inkFaint },
              ticks: {
                color: inkSoft,
                font: { family: '"Spectral", serif', size: 11 },
                padding: 8,
              },
            },
          },
        },
      });
      charts.push(chart);
    }
  }

  function pickTimeUnit(dates) {
    if (dates.length < 2) return "day";
    const first = new Date(dates[0]).getTime();
    const last = new Date(dates[dates.length - 1]).getTime();
    const spanDays = (last - first) / 86400000;
    if (spanDays > 365 * 2) return "year";
    if (spanDays > 90) return "month";
    return "day";
  }

  function renderTable() {
    const columns = ["date", "test_name", "value", "unit", "reference_low", "reference_high", "flag", "category", "source_file"];
    const labels = {
      date: "Date",
      test_name: "Test",
      value: "Value",
      unit: "Unit",
      reference_low: "Low",
      reference_high: "High",
      flag: "Flag",
      category: "Category",
      source_file: "Source",
    };
    const thead = document.querySelector("#data-table thead tr");
    thead.innerHTML = columns.map((c) => `<th data-col="${c}">${labels[c]}</th>`).join("");
    thead.querySelectorAll("th").forEach((th) => {
      th.addEventListener("click", () => {
        const col = th.dataset.col;
        if (state.tableSort.col === col) {
          state.tableSort.dir = state.tableSort.dir === "asc" ? "desc" : "asc";
        } else {
          state.tableSort = { col, dir: "asc" };
        }
        drawTableBody();
      });
    });

    document.getElementById("table-search").addEventListener("input", drawTableBody);
    drawTableBody();

    function drawTableBody() {
      const q = document.getElementById("table-search").value.trim().toLowerCase();
      const { col, dir } = state.tableSort;
      const rows = [...state.rows].filter((r) => {
        if (!q) return true;
        return columns.some((c) => String(r[c] ?? "").toLowerCase().includes(q));
      });
      rows.sort((a, b) => {
        const av = a[col], bv = b[col];
        const cmp = (typeof av === "number" && typeof bv === "number")
          ? av - bv
          : String(av ?? "").localeCompare(String(bv ?? ""));
        return dir === "asc" ? cmp : -cmp;
      });
      const tbody = document.querySelector("#data-table tbody");
      tbody.innerHTML = rows.map((r) =>
        `<tr>${columns.map((c) => {
          const v = r[c];
          const cls = (c === "value" || c === "reference_low" || c === "reference_high") ? "num" : "";
          if (c === "flag" && v) {
            return `<td><span class="flag ${v}">${v}</span></td>`;
          }
          return `<td class="${cls}">${escapeHtml(v == null || v === "" ? "" : String(v))}</td>`;
        }).join("")}</tr>`
      ).join("");
    }
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
    }[c]));
  }

  function wireTabs() {
    document.querySelectorAll(".tab").forEach((tab) => {
      tab.addEventListener("click", () => activateTab(tab.dataset.target));
    });
  }

  wireTabs();
  load().catch((err) => {
    document.getElementById("meta").textContent = "Failed to load data: " + err.message;
    console.error(err);
  });
})();
