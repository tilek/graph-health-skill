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

// ───────────── root view ─────────────

const App = () => html`
  ${LangSwitch()}
  ${Header()}
  <main class="wrap">
    <section class="panel active">
      <p>Panels coming next task.</p>
    </section>
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
