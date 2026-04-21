import { reactive, html, watch } from 'https://esm.sh/@arrow-js/core'
import { render } from 'https://esm.sh/@arrow-js/framework'
import Chart from 'https://esm.sh/chart.js/auto'
import { strings, testNamesRu, categoriesRu } from './i18n.js'

// ───────────── reactive root ─────────────

const state = reactive({
  rows: [],
  csvPath: '',
  context: null,
  lang: localStorage.getItem('lang') === 'ru' ? 'ru' : 'en',
  activeTab: 'summary',
  categoryFilter: 'All',
  tableSort: { col: 'date', dir: 'desc' },
  tableSearch: '',
  detail: null,
})

// ───────────── translation helpers ─────────────

export const t = (key) => {
  const pack = strings[state.lang] ?? {}
  const fallback = strings.en ?? {}
  const v = pack[key] !== undefined ? pack[key] : fallback[key]
  return v === undefined ? key : v
}

export const testLabel = (name) => {
  if (state.lang === 'ru') return testNamesRu[name] ?? name
  return name
}

export const catLabel = (cat) => {
  if (!cat) return ''
  if (cat === 'All') return t('category_all')
  if (state.lang === 'ru') return categoriesRu[cat] ?? cat
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

// ───────────── language persistence ─────────────

watch(() => {
  localStorage.setItem('lang', state.lang)
  document.documentElement.setAttribute('lang', state.lang)
})

// ───────────── chrome components ─────────────

const LangSwitch = () => html`
  <nav class="lang-switch" aria-label="Language">
    <button class="lang-btn ${() => state.lang === 'en' ? 'active' : ''}"
            @click="${() => { state.lang = 'en' }}">EN</button>
    <span class="lang-sep">·</span>
    <button class="lang-btn ${() => state.lang === 'ru' ? 'active' : ''}"
            @click="${() => { state.lang = 'ru' }}">RU</button>
  </nav>
`

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
        <button class="tab ${() => state.activeTab === id ? 'active' : ''}"
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
          const rangeStr = hasRange
            ? `${t('detail_range')} ${latest.reference_low ?? '—'}–${latest.reference_high ?? '—'}`
            : ''
          return html`
            <article class="priority-card sev-${rec.severity}"
                     @click="${() => { state.detail = test }}">
              <div class="priority-top">
                <span class="priority-name">${testLabel(test)}</span>
                <span class="priority-sev sev-${rec.severity}">${severityLabel(rec.severity)}</span>
              </div>
              <div class="priority-meta">
                <span class="priority-val">${fmt(latest.value)}<span class="unit">${latest.unit || ''}</span></span>
                ${flag ? html`<span class="flag ${flag}">${flag}</span>` : ''}
                ${rangeStr ? html`<span class="priority-range">${rangeStr}</span>` : ''}
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
  const names = Object.keys(byName).sort((a, b) =>
    testLabel(a).localeCompare(testLabel(b), state.lang === 'ru' ? 'ru' : 'en'))
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
              <span class="name-text">${testLabel(name)}</span>
              ${flag ? html`<span class="flag ${flag}">${flag}</span>` : ''}
            </div>
            <div class="value">${fmt(latest.value)}<span class="unit">${latest.unit || ''}</span></div>
            <div class="sub">
              <span class="date">${latest.date}</span>
              <span class="delta ${deltaClass}">${deltaStr}</span>
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

// ───────────── root view ─────────────

const App = () => html`
  ${LangSwitch()}
  ${Header()}
  <main class="wrap">
    ${() => state.activeTab === 'summary' ? SummaryPanel() : ''}
    ${() => state.activeTab === 'charts'  ? html`<section class="panel active"><p>Charts coming next task.</p></section>` : ''}
    ${() => state.activeTab === 'table'   ? html`<section class="panel active"><p>Table coming next task.</p></section>` : ''}
  </main>
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
