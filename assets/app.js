import { reactive, html, watch } from 'https://esm.sh/@arrow-js/core'
import { render } from 'https://esm.sh/@arrow-js/framework'
import Chart from 'https://esm.sh/chart.js/auto'
import 'https://esm.sh/chartjs-adapter-date-fns'
import { strings } from './i18n.js'

// ───────────── reactive root ─────────────

const state = reactive({
  rows: [],
  csvPath: '',
  context: null,
  activeTab: 'summary',
  categoryFilter: 'All',
  tableSort: { col: 'date', dir: 'desc' },
  tableSearch: '',
  detail: null,
})

// ───────────── UI-chrome strings ─────────────

export const t = (key) => {
  const v = strings[key]
  return v === undefined ? key : v
}

export const catLabel = (cat) => {
  if (!cat) return ''
  if (cat === 'All') return t('category_all')
  return cat
}

// ───────────── context helpers ─────────────

export const biomarkersContext = () => state.context?.biomarkers ?? {}
export const recommendationsContext = () => state.context?.recommendations ?? {}

// ───────────── number / row helpers ─────────────

export const fmt = (v) => {
  if (v === null || v === undefined || v === '') return '—'
  if (typeof v === 'number') {
    if (Math.abs(v) >= 100) return v.toFixed(0)
    if (Math.abs(v) >= 10) return v.toFixed(1)
    return v.toFixed(2)
  }
  return String(v)
}

export const fmtSigned = (v) => {
  if (v === null || v === undefined || v === '') return ''
  const s = fmt(Math.abs(v))
  if (v > 0) return `+${s}`
  if (v < 0) return `−${s}`
  return `±${s}`
}

const parseRow = (r) => ({
  ...r,
  value: r.value === '' ? null : Number(r.value),
  reference_low: r.reference_low === '' ? null : Number(r.reference_low),
  reference_high: r.reference_high === '' ? null : Number(r.reference_high),
})

export const basename = (p) => {
  if (!p) return ''
  const parts = String(p).split(/[\\/]/)
  return parts[parts.length - 1]
}

// ───────────── derived selectors ─────────────

export const testsByName = () => {
  const byName = {}
  for (const r of state.rows) {
    if (!byName[r.test_name]) byName[r.test_name] = []
    byName[r.test_name].push(r)
  }
  return byName
}

// ───────────── chrome components ─────────────

const metaLine = () => {
  if (!state.rows.length) return t('empty_title')
  const dates = [...new Set(state.rows.map((r) => r.date))].sort()
  const testCount = Object.keys(testsByName()).length
  return `${state.rows.length} ${t('meta_readings')} · ${testCount} ${t('meta_tests')} · ${dates[0]} — ${dates[dates.length - 1]}`
}

const sourceEntries = () => {
  const groups = {}
  for (const r of state.rows) {
    const src = r.source_file || '(unknown)'
    if (!groups[src]) groups[src] = { dates: new Set(), count: 0 }
    groups[src].dates.add(r.date)
    groups[src].count += 1
  }
  return Object.entries(groups)
    .map(([src, g]) => {
      const dates = [...g.dates].sort()
      return { src, count: g.count, first: dates[0], last: dates[dates.length - 1] }
    })
    .sort((a, b) => a.first.localeCompare(b.first) || a.src.localeCompare(b.src))
}

const jumpToRecord = (query) => {
  state.tableSearch = query
  state.activeTab = 'table'
}

const Sources = () => html`
  <details class="sources">
    <summary>
      <span>${() => t('sources_label')}</span>
      <span class="sources-count">${() => state.rows.length ? `· ${sourceEntries().length}` : ''}</span>
    </summary>
    <div class="sources-body">
      <p class="sources-intro">${() => t('sources_intro')}</p>
      <ul>
        ${() => sourceEntries().map((e) => html`
          <li @click="${() => jumpToRecord(e.src)}">
            <span class="src-name">${e.src}</span>
            <span class="src-dates">${e.first === e.last ? e.first : `${e.first} — ${e.last}`}</span>
            <span class="src-count">${e.count} ${() => t('sources_readings')}</span>
          </li>
        `.key(e.src))}
      </ul>
    </div>
  </details>
`

const Tabs = () => {
  const tabs = [
    ['summary', 'tab_summary'],
    ['charts',  'tab_charts'],
    ['table',   'tab_record'],
  ]
  return html`
    <nav class="tabs" role="tablist">
      ${tabs.map(([id, key]) => html`
        <button class="${() => `tab ${state.activeTab === id ? 'active' : ''}`}"
                @click="${() => { state.activeTab = id }}">
          ${() => t(key)}
        </button>
      `.key(id))}
    </nav>
  `
}

const Header = () => html`
  <header>
    <div class="wrap">
      <div class="masthead">
        <div class="folio">
          <span class="folio-no">${() => t('folio_no')}</span>
          <span class="folio-sep">·</span>
          <span class="folio-kind">${() => t('folio_kind')}</span>
        </div>
        <h1 class="title">
          <span>${() => t('title_main')}</span>
          <em>${() => t('title_accent')}</em>
        </h1>
        <p class="tagline">
          <span>${() => t('tagline_part1')}</span>
          <em>${() => t('tagline_part2')}</em>
          <span>${() => t('tagline_end')}</span>
        </p>
        <div class="ornament" aria-hidden="true">❧</div>
        <p id="meta" class="meta">${() => metaLine()}</p>
        ${Sources()}
      </div>
      ${Tabs()}
    </div>
  </header>
`

// ───────────── severity ─────────────

const SEVERITY_RANK = { attention: 0, watch: 1, info: 2 }

const severityLabel = (sev) => {
  if (sev === 'attention') return t('severity_attention')
  if (sev === 'watch')     return t('severity_watch')
  if (sev === 'info')      return t('severity_info')
  return sev
}

// ───────────── priorities ─────────────

const priorityEntries = () => {
  const recs = recommendationsContext()
  const byName = testsByName()
  const entries = []
  for (const [test, rec] of Object.entries(recs)) {
    const series = byName[test]
    if (!series?.length) continue
    entries.push({ test, rec, latest: series[series.length - 1] })
  }
  entries.sort((a, b) => {
    const ra = SEVERITY_RANK[a.rec.severity] ?? 9
    const rb = SEVERITY_RANK[b.rec.severity] ?? 9
    return ra - rb || a.test.localeCompare(b.test)
  })
  return entries
}

const Priorities = () => html`
  ${() => priorityEntries().length === 0 ? '' : html`
    <section class="priorities">
      <div class="panel-head priorities-head">
        <h2>${() => t('priorities_title')}</h2>
        <p class="panel-sub">${() => t('priorities_sub')}</p>
      </div>
      <div class="priorities-list">
        ${() => priorityEntries().map(({ test, rec, latest }) => {
          const flag = latest.flag || ''
          const hasRange = latest.reference_low != null || latest.reference_high != null
          const rangeLow = latest.reference_low ?? '—'
          const rangeHigh = latest.reference_high ?? '—'
          return html`
            <article class="${`priority-card sev-${rec.severity}`}"
                     @click="${() => { state.detail = test }}">
              <div class="priority-top">
                <span class="priority-name">${test}</span>
                <span class="${`priority-sev sev-${rec.severity}`}">${severityLabel(rec.severity)}</span>
              </div>
              <div class="priority-meta">
                <span class="priority-val">${fmt(latest.value)}<span class="unit">${latest.unit || ''}</span></span>
                ${flag ? html`<span class="${`flag ${flag}`}">${flag}</span>` : ''}
                ${hasRange ? html`<span class="priority-range">${t('detail_range')} ${rangeLow}–${rangeHigh}</span>` : ''}
                <span class="priority-range">${latest.date}</span>
              </div>
              <p class="priority-headline">${rec.headline}</p>
              <p class="priority-detail">${rec.detail}</p>
              ${(rec.actions || []).length ? html`
                <ul class="priority-actions">
                  ${(rec.actions || []).map((a) => html`<li>${a}</li>`)}
                </ul>
              ` : ''}
            </article>
          `.key(test)
        })}
      </div>
      <p class="priorities-disclaimer">
        <strong>${() => t('priorities_discl_strong')}</strong>
        <span>${() => t('priorities_discl')}</span>
      </p>
    </section>
  `}
`

// ───────────── latest-readings grid ─────────────

const summaryEntries = () => {
  const byName = testsByName()
  const names = Object.keys(byName).sort((a, b) => a.localeCompare(b))
  return names.map((name) => {
    const series = byName[name]
    const latest = series[series.length - 1]
    const prev = series.length > 1 ? series[series.length - 2] : null
    const delta = prev && prev.value != null && latest.value != null ? latest.value - prev.value : null
    const deltaClass = delta == null ? 'flat' : delta > 0 ? 'up' : delta < 0 ? 'down' : 'flat'
    const deltaStr = delta == null ? '—' : fmtSigned(delta)
    const uniqueSources = new Set(series.map((r) => r.source_file).filter(Boolean))
    return { name, series, latest, deltaClass, deltaStr, uniqueSourceCount: uniqueSources.size }
  })
}

const Provenance = (latest, uniqueSourceCount, totalReadings) => {
  const src = basename(latest.source_file)
  if (!src) return ''
  if (uniqueSourceCount <= 1) {
    return html`
      <div class="provenance">
        <span class="prov-label">${() => t('prov_from')}</span>
        <cite>${src}</cite>
      </div>
    `
  }
  return html`
    <div class="provenance">
      <span class="prov-label">${() => t('prov_latest')}</span>
      <cite>${src}</cite>
      <span class="multi">· ${totalReadings} ${() => t('meta_readings')} ${() => t('prov_across')} ${uniqueSourceCount} ${() => t('prov_sources')}</span>
    </div>
  `
}

const SummaryPanel = () => html`
  <section class="panel active">
    ${Priorities()}
    <div class="panel-head">
      <h2>${() => t('summary_title')}</h2>
      <p class="panel-sub">${() => t('summary_sub')}</p>
    </div>
    <div class="grid">
      ${() => summaryEntries().map(({ name, series, latest, deltaClass, deltaStr, uniqueSourceCount }) => {
        const flag = latest.flag || ''
        return html`
          <article class="card" @click="${() => { state.detail = name }}">
            <div class="name">
              <span class="name-text">${name}</span>
              ${flag ? html`<span class="${`flag ${flag}`}">${flag}</span>` : ''}
            </div>
            <div class="value">${fmt(latest.value)}<span class="unit">${latest.unit || ''}</span></div>
            <div class="sub">
              <span class="date">${latest.date}</span>
              <span class="${`delta ${deltaClass}`}">${deltaStr}</span>
            </div>
            ${Provenance(latest, uniqueSourceCount, series.length)}
          </article>
        `.key(name)
      })}
    </div>
    ${() => state.rows.length === 0 ? html`
      <div class="empty" style="grid-column: 1 / -1;">
        <p>${() => t('empty_title')}</p>
        <p>
          <span>${() => t('empty_body_pre')}</span>
          <code>scripts/append_to_csv.py --csv ${state.csvPath || 'health_data.csv'}</code>
          <span>${() => t('empty_body_post')}</span>
        </p>
      </div>
    ` : ''}
  </section>
`

// ───────────── Chart.js theme bootstrap ─────────────

const getVar = (name) => getComputedStyle(document.documentElement).getPropertyValue(name).trim()

Chart.defaults.font.family = '"Spectral", "Source Serif 4", Georgia, serif'
Chart.defaults.font.size = 12
Chart.defaults.color = getVar('--ink-soft')

const pickTimeUnit = (dates) => {
  if (dates.length < 2) return 'day'
  const first = new Date(dates[0]).getTime()
  const last = new Date(dates[dates.length - 1]).getTime()
  const spanDays = (last - first) / 86400000
  if (spanDays > 365 * 2) return 'year'
  if (spanDays > 90) return 'month'
  return 'day'
}

// ───────────── category filter ─────────────

const categoryList = () => {
  const cats = [...new Set(state.rows.map((r) => r.category).filter(Boolean))].sort()
  cats.unshift('All')
  return cats
}

const CategoryFilter = () => html`
  <div class="filter">
    ${() => categoryList().map((c) => html`
      <button class="${() => `chip ${state.categoryFilter === c ? 'active' : ''}`}"
              @click="${() => { state.categoryFilter = c }}">
        ${catLabel(c)}
      </button>
    `.key(c))}
  </div>
`

// ───────────── charts ─────────────

const chartNames = () => {
  const byName = testsByName()
  return Object.keys(byName)
    .filter((n) => state.categoryFilter === 'All' || byName[n][0].category === state.categoryFilter)
    .sort((a, b) => a.localeCompare(b))
}

const ChartsPanel = () => html`
  <section class="panel active">
    <div class="panel-head">
      <h2>${() => t('charts_title')}</h2>
      <p class="panel-sub">${() => t('charts_sub')}</p>
    </div>
    ${CategoryFilter()}
    <div id="chart-container">
      ${() => chartNames().length === 0 && state.rows.length ? html`
        <div class="empty" style="grid-column: 1 / -1;">
          <p>${() => t('empty_no_match')}</p>
        </div>
      ` : ''}
      ${() => chartNames().map((name) => {
        const byName = testsByName()
        const series = byName[name]
        const unit = series[series.length - 1].unit || ''
        const category = series[0].category || ''
        return html`
          <section class="chart-card" data-test="${name}">
            <h3>${name}</h3>
            <p class="sub">${catLabel(category)}${unit ? ` · ${unit}` : ''}</p>
            <div class="chart-wrap"><canvas data-canvas="${name}"></canvas></div>
          </section>
        `.key(name)
      })}
    </div>
  </section>
`

// ───────────── Chart.js lifecycle ─────────────

const chartInstances = new Map()   // test_name -> Chart

const buildChartConfig = (name, series) => {
  const rust     = getVar('--rust')
  const rustDeep = getVar('--rust-deep')
  const ink      = getVar('--ink')
  const inkSoft  = getVar('--ink-soft')
  const inkFaint = getVar('--ink-faint')
  const paper    = getVar('--paper-soft')
  const band     = getVar('--band')
  const bandEdge = getVar('--band-edge')
  const rule     = getVar('--rule-soft')

  const valuePoints = series.filter((r) => r.value != null)
  const points = valuePoints.map((r) => ({ x: r.date, y: r.value }))
  const lo = valuePoints.map((r) => r.reference_low).find((v) => v != null) ?? null
  const hi = valuePoints.map((r) => r.reference_high).find((v) => v != null) ?? null
  const xs = valuePoints.map((r) => r.date)
  const unit = series[series.length - 1].unit || ''
  const fromLabel = t('prov_from')

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
  ]

  if (hi != null) {
    datasets.push({
      label: 'Reference high',
      data: xs.map((x) => ({ x, y: hi })),
      borderColor: bandEdge,
      borderWidth: 1,
      borderDash: [3, 5],
      pointRadius: 0,
      fill: lo != null ? '+1' : false,
      backgroundColor: band,
      tension: 0,
      order: 2,
    })
  }
  if (lo != null) {
    datasets.push({
      label: 'Reference low',
      data: xs.map((x) => ({ x, y: lo })),
      borderColor: bandEdge,
      borderWidth: 1,
      borderDash: [3, 5],
      pointRadius: 0,
      fill: false,
      tension: 0,
      order: 3,
    })
  }

  return {
    type: 'line',
    data: { datasets },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
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
          titleFont: { family: '"Spectral", serif', size: 12, weight: '500' },
          bodyFont:  { family: '"Spectral", serif', size: 13, style: 'italic' },
          callbacks: {
            title: (items) => items[0]?.label ? new Date(items[0].parsed.x).toISOString().slice(0, 10) : '',
            label: (ctx) => {
              if (ctx.dataset.label === name) {
                const r = valuePoints[ctx.dataIndex]
                const flag = r?.flag ? `  · ${r.flag}` : ''
                return `${fmt(ctx.parsed.y)} ${unit}${flag}`
              }
              return `${ctx.dataset.label}: ${fmt(ctx.parsed.y)}`
            },
            afterLabel: (ctx) => {
              if (ctx.dataset.label !== name) return ''
              const r = valuePoints[ctx.dataIndex]
              const src = basename(r?.source_file)
              return src ? `${fromLabel} ${src}` : ''
            },
          },
        },
      },
      scales: {
        x: {
          type: 'time',
          time: { unit: pickTimeUnit(xs), tooltipFormat: 'yyyy-MM-dd' },
          grid: { color: rule, tickColor: rule, drawTicks: false },
          border: { color: inkFaint },
          ticks: {
            color: inkSoft,
            font: { family: '"Spectral", serif', size: 11, style: 'italic' },
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
  }
}

watch(() => {
  // Tracked reads — any change re-runs this watcher.
  const rows = state.rows
  const tab = state.activeTab
  const cat = state.categoryFilter
  void rows; void cat   // silence unused-var tools; reads are intentional

  if (tab !== 'charts' || !rows.length) {
    chartInstances.forEach((c) => c.destroy())
    chartInstances.clear()
    return
  }

  queueMicrotask(() => {
    const byName = testsByName()
    const names = chartNames()
    const wanted = new Set(names)

    for (const [name, inst] of chartInstances) {
      if (!wanted.has(name)) { inst.destroy(); chartInstances.delete(name) }
    }

    for (const name of names) {
      const canvas = document.querySelector(`canvas[data-canvas="${CSS.escape(name)}"]`)
      if (!canvas) continue
      chartInstances.get(name)?.destroy()
      const chart = new Chart(canvas, buildChartConfig(name, byName[name]))
      chartInstances.set(name, chart)
    }
  })
})

// ───────────── table ─────────────

const TABLE_COLUMNS = [
  'date', 'test_name', 'value', 'unit',
  'reference_low', 'reference_high', 'flag',
  'category', 'source_file',
]

const COL_I18N_KEY = {
  date: 'col_date', test_name: 'col_test', value: 'col_value', unit: 'col_unit',
  reference_low: 'col_low', reference_high: 'col_high', flag: 'col_flag',
  category: 'col_category', source_file: 'col_source',
}

const tableRows = () => {
  const q = state.tableSearch.trim().toLowerCase()
  const { col, dir } = state.tableSort
  const rows = state.rows.filter((r) => {
    if (!q) return true
    const searchable = [
      r.date, r.test_name,
      r.unit, r.category,
      r.source_file, r.flag,
      r.value != null ? String(r.value) : '',
    ].join(' ').toLowerCase()
    return searchable.includes(q)
  })
  rows.sort((a, b) => {
    let av = a[col], bv = b[col]
    if (col === 'category') { av = catLabel(av); bv = catLabel(bv) }
    const cmp = (typeof av === 'number' && typeof bv === 'number')
      ? av - bv
      : String(av ?? '').localeCompare(String(bv ?? ''))
    return dir === 'asc' ? cmp : -cmp
  })
  return rows
}

const clickColumn = (col) => {
  if (state.tableSort.col === col) {
    state.tableSort = { col, dir: state.tableSort.dir === 'asc' ? 'desc' : 'asc' }
  } else {
    state.tableSort = { col, dir: 'asc' }
  }
}

const TablePanel = () => html`
  <section class="panel active">
    <div class="panel-head">
      <h2>${() => t('record_title')}</h2>
      <p class="panel-sub">
        <span>${() => t('record_sub_pre')}</span>
        <code>health_data.csv</code>
        <span>${() => t('record_sub_post')}</span>
      </p>
    </div>
    <div class="table-controls">
      <input id="table-search" type="search"
             placeholder="${() => t('record_search')}"
             value="${() => state.tableSearch}"
             @input="${(e) => { state.tableSearch = e.target.value }}">
    </div>
    <div class="table-scroll">
      <table id="data-table">
        <thead><tr>
          ${TABLE_COLUMNS.map((c) => html`
            <th data-col="${c}" @click="${() => clickColumn(c)}">${() => t(COL_I18N_KEY[c])}</th>
          `.key(c))}
        </tr></thead>
        <tbody>
          ${() => tableRows().map((r, i) => html`
            <tr>
              ${TABLE_COLUMNS.map((c) => {
                const v = r[c]
                const cls = (c === 'value' || c === 'reference_low' || c === 'reference_high') ? 'num' : ''
                if (c === 'flag' && v) {
                  return html`<td><span class="${`flag ${v}`}">${v}</span></td>`
                }
                if (c === 'category')  return html`<td class="${cls}">${catLabel(v)}</td>`
                return html`<td class="${cls}">${v == null || v === '' ? '' : String(v)}</td>`
              })}
            </tr>
          `.key(`${r.date}|${r.test_name}|${r.source_file}|${i}`))}
        </tbody>
      </table>
    </div>
  </section>
`

// ───────────── detail modal ─────────────

const detailEntry = () => {
  const name = state.detail
  if (!name) return null
  const byName = testsByName()
  const series = byName[name]
  if (!series?.length) return null
  return {
    name,
    series,
    latest: series[series.length - 1],
    info: biomarkersContext()[name] ?? null,
    rec: recommendationsContext()[name] ?? null,
  }
}

const closeDetail = () => { state.detail = null }

// Open/close the dialog when state.detail changes.
// queueMicrotask ensures Arrow has rendered the <dialog> before we call showModal().
watch(() => {
  const shouldOpen = state.detail != null
  queueMicrotask(() => {
    const el = document.getElementById('detail')
    if (!el) return
    if (shouldOpen && !el.open && typeof el.showModal === 'function') {
      el.showModal()
      const scroll = el.querySelector('.detail-body')
      if (scroll) scroll.scrollTop = 0
    } else if (!shouldOpen && el.open) {
      el.close()
    }
  })
})

const DetailBody = (entry) => {
  const { name, series, latest, info, rec } = entry
  const flag = latest.flag || ''
  const hasRange = latest.reference_low != null || latest.reference_high != null
  const rangeLow = latest.reference_low ?? '—'
  const rangeHigh = latest.reference_high ?? '—'
  const hist = [...series].reverse()

  return html`
    <article class="detail-body">
      <header class="detail-head">
        <p class="detail-eyebrow">${catLabel(latest.category || '')}</p>
        <h2 id="detail-name">${name}</h2>
        <div class="detail-latest">
          <span class="detail-val">${fmt(latest.value)}<span class="unit">${latest.unit || ''}</span></span>
          ${flag ? html`<span class="${`flag ${flag}`}">${flag}</span>` : ''}
          <span class="detail-date">${latest.date}</span>
          <span class="detail-range">${hasRange ? `${t('detail_range')} ${rangeLow}..${rangeHigh}` : t('detail_no_range')}</span>
        </div>
      </header>

      ${rec ? html`
        <div class="${`detail-rec sev-${rec.severity}`}">
          <div class="detail-rec-top">
            <span class="${`detail-rec-label sev-${rec.severity}`}">${severityLabel(rec.severity)}</span>
          </div>
          <p class="detail-rec-headline">${rec.headline || ''}</p>
          <p class="detail-rec-detail">${rec.detail || ''}</p>
          ${(rec.actions || []).length ? html`
            <ul class="detail-rec-actions">
              ${(rec.actions || []).map((a) => html`<li>${a}</li>`)}
            </ul>
          ` : ''}
        </div>
      ` : ''}

      ${info ? html`
        <section class="detail-section">
          <h3>${() => t('detail_about')}</h3>
          <p>${info.description || ''}</p>
        </section>
        ${(info.high || info.low) ? html`
          <section class="detail-section">
            <h3>${() => t('detail_interpret')}</h3>
            <dl id="detail-interpret-body">
              ${info.high ? html`<dt class="hi">${() => t('detail_if_high')}</dt><dd>${info.high}</dd>` : ''}
              ${info.low  ? html`<dt class="lo">${() => t('detail_if_low')}</dt><dd>${info.low}</dd>` : ''}
            </dl>
          </section>
        ` : ''}
        ${(info.suggestions || []).length ? html`
          <section class="detail-section">
            <h3>${() => t('detail_suggest')}</h3>
            <ul id="detail-suggestions">${(info.suggestions || []).map((s) => html`<li>${s}</li>`)}</ul>
          </section>
        ` : ''}
      ` : html`
        <section class="detail-section">
          <h3>${() => t('detail_no_info_h')}</h3>
          <div class="detail-missing">${strings.detail_no_info(name)}</div>
        </section>
      `}

      <p class="detail-disclaimer">
        <strong>${() => t('detail_discl_strong')}</strong>
        <span>${() => t('detail_discl')}</span>
      </p>

      <section class="detail-section detail-history">
        <h3>
          <span>${() => t('detail_readings')}</span>
          <span class="detail-history-count">· ${strings.detail_reading_n(hist.length)}</span>
        </h3>
        <div class="detail-history-scroll">
          <table id="detail-history-table">
            <thead><tr>
              <th>${() => t('col_date')}</th>
              <th>${() => t('col_value')}</th>
              <th>${() => t('col_flag')}</th>
              <th>${() => t('col_source')}</th>
            </tr></thead>
            <tbody>
              ${hist.map((r) => html`
                <tr>
                  <td>${r.date}</td>
                  <td class="num">${fmt(r.value)} ${r.unit || ''}</td>
                  <td>${r.flag ? html`<span class="${`flag ${r.flag}`}">${r.flag}</span>` : ''}</td>
                  <td class="src" title="${r.source_file || ''}">${basename(r.source_file) || '—'}</td>
                </tr>
              `.key(`${r.date}|${r.source_file}`))}
            </tbody>
          </table>
        </div>
      </section>

      <footer class="detail-foot">
        <button class="detail-record-link"
                @click="${() => { closeDetail(); jumpToRecord(name) }}">
          ${() => t('detail_view_rec')}
        </button>
      </footer>
    </article>
  `
}

const DetailModal = () => html`
  <dialog id="detail" class="detail-modal"
          @click="${(e) => { if (e.target.id === 'detail') closeDetail() }}"
          @close="${() => closeDetail()}">
    <form method="dialog" class="detail-close-form">
      <button class="detail-close" aria-label="Close"
              @click="${() => { state.detail = null }}">✕</button>
    </form>
    ${() => {
      const entry = detailEntry()
      return entry ? DetailBody(entry) : ''
    }}
  </dialog>
`

// ───────────── root view ─────────────

const App = () => html`
  ${Header()}
  <main class="wrap">
    ${() => state.activeTab === 'summary' ? SummaryPanel() : ''}
    ${() => state.activeTab === 'charts'  ? ChartsPanel()  : ''}
    ${() => state.activeTab === 'table'   ? TablePanel()   : ''}
    <footer class="colophon">
      <span class="ornament">❦</span>
      <p>
        <span>${() => t('fonts_by')}</span>
        <em>Instrument Serif</em> & <em>Spectral</em>.
        <span>${() => t('colophon')}</span>
      </p>
    </footer>
  </main>
  ${DetailModal()}
`

render(document.getElementById('app'), App())

// ───────────── data load ─────────────

;(async () => {
  try {
    const res = await fetch('/api/data')
    const payload = await res.json()
    const rows = (payload.rows || []).map(parseRow)
    rows.sort((a, b) => a.date.localeCompare(b.date))
    state.rows = rows
    state.csvPath = payload.csv_path || ''
    state.context = payload.context ?? null
  } catch (err) {
    console.error(err)
    state.rows = []
  }
})()
