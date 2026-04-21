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

// ───────────── placeholder view ─────────────

const App = () => html`
  <main class="wrap">
    <p id="meta" class="meta">${() => state.rows.length
      ? `${state.rows.length} ${t('meta_readings')} · context ${state.context ? 'loaded' : 'none'}`
      : (t('empty_title') || 'No data')
    }</p>
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
