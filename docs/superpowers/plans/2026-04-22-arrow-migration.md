# Arrow Frontend Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the vanilla-JS frontend under `assets/` with an Arrow-based, reactive, ESM-only app while preserving visual parity, feature parity, and the no-install delivery model.

**Architecture:** No-build, CDN ESM. One reactive root state object drives a single `App()` view. Chart.js is kept and mounted via a `watch()` side-effect. All data files become ESM modules exporting `{ en, ru }` bilingual objects.

**Tech Stack:** `@arrow-js/core` and `@arrow-js/framework` from esm.sh, Chart.js from esm.sh, Python stdlib server (unchanged).

---

## Project context

### What's changing
- `assets/index.html` — rewrites the entire shell to a minimal `<div id="app"></div>` + one module script.
- `assets/app.js` — full rewrite using Arrow templates and reactive state.
- `assets/biomarkers.js` + `assets/biomarkers.ru.js` → single `assets/biomarkers.js` exporting `{ en, ru }`.
- `assets/recommendations.js` + `assets/recommendations.ru.js` → single `assets/recommendations.js` exporting `{ en, ru }`.
- `assets/i18n.js` — converted to ESM exports.

### What's NOT changing
- `scripts/serve.py`, `scripts/append_to_csv.py` — untouched.
- `assets/styles.css` — every class name and DOM structure the CSS targets is reproduced exactly.
- CSV schema, `/api/data` endpoint shape.

### Rules during migration
- No window globals. Everything is ESM `import` / `export`.
- Prefer the simplest Arrow pattern. Don't introduce SSR, hydration, TypeScript, or bundlers.
- Preserve every class name used by `styles.css`. Grep before renaming anything DOM-facing.
- Each task's "verification" is manual-in-browser: `python3 scripts/serve.py --csv health_data.csv` and check.
- Intermediate commits may leave the dashboard half-working (we're on a branch). The final task restores full functionality.

### Existing data files — structure to preserve
- `i18n.js` exposes three globals today: `window.I18N = { en, ru }`, `window.TEST_NAMES_RU = {...}`, `window.CATEGORIES_RU = {...}`. Preserve all keys; only change delivery.
- `biomarkers.js` / `biomarkers.ru.js` each export an object keyed by canonical test name, with shape `{ description, high, low, suggestions[] }`.
- `recommendations.js` / `recommendations.ru.js` each export an object keyed by canonical test name, with shape `{ severity, headline, detail, actions[] }`. Severity is `"attention" | "watch" | "info"`.

---

## Task 1: Merge `biomarkers.js` with `biomarkers.ru.js`

**Files:**
- Modify: `assets/biomarkers.js` (replace entire contents)
- Delete: `assets/biomarkers.ru.js`

**Goal:** Single ESM module exporting both languages. No behavior change, just structure.

- [ ] **Step 1: Read both current files to get the full bilingual data**

Run:
```bash
wc -l assets/biomarkers.js assets/biomarkers.ru.js
```
Expected: both files non-empty, ~800 lines each.

- [ ] **Step 2: Replace `assets/biomarkers.js` with the merged ESM version**

New shape (preserve every existing biomarker entry verbatim):

```js
// Biomarker reference content, bilingual.
// Keyed by canonical test_name from health_data.csv.
// Shape per entry: { description, high, low, suggestions[] }

export const biomarkers = {
  en: {
    "Hemoglobin": {
      description: "The oxygen-carrying protein inside red blood cells. Determines how much oxygen your blood can deliver to tissues.",
      high: "Dehydration, smoking, high altitude, or rarely polycythemia (bone-marrow overproduction).",
      low: "Anemia — commonly iron deficiency, B12 or folate deficiency, blood loss, or chronic disease.",
      suggestions: [
        "If low: eat iron-rich foods (red meat, liver, lentils, spinach) and pair with vitamin C to boost absorption.",
        "Check ferritin and B12 together — they tell you which deficiency pattern this is.",
        "Rule out hidden blood loss (heavy menses, GI sources) with your doctor.",
        "If high: hydrate consistently; if you smoke, stopping raises the red-cell count back toward normal.",
      ],
    },
    // …every other entry currently in assets/biomarkers.js, copied verbatim…
  },
  ru: {
    "Hemoglobin": {
      description: "Белок красных кровяных клеток, переносящий кислород. Определяет, сколько кислорода кровь доставляет тканям.",
      high: "Обезвоживание, курение, высокогорье, редко — полицитемия (переизбыток в костном мозге).",
      low: "Анемия — чаще всего железодефицит, дефицит B12 или фолиевой кислоты, кровопотеря, хронические болезни.",
      suggestions: [
        "При низких значениях: красное мясо, печень, бобовые, шпинат; сочетайте с витамином C для всасывания.",
        "Одновременно проверьте ферритин и B12 — они подскажут тип дефицита.",
        "Исключите скрытую кровопотерю (обильные менструации, ЖКТ) совместно с врачом.",
        "При высоких значениях: пейте достаточно воды; если курите — отказ возвращает показатели к норме.",
      ],
    },
    // …every other entry currently in assets/biomarkers.ru.js, copied verbatim…
  },
}
```

**Copy the full English content from the existing `assets/biomarkers.js` file** (under `window.BIOMARKERS = { ... }`) into `biomarkers.en`. **Copy the full Russian content from `assets/biomarkers.ru.js`** (under `window.BIOMARKERS_RU = { ... }`) into `biomarkers.ru`. No entry may be dropped, renamed, or rephrased.

- [ ] **Step 3: Delete `assets/biomarkers.ru.js`**

```bash
rm assets/biomarkers.ru.js
```

- [ ] **Step 4: Verify shape with Node**

Run:
```bash
node --input-type=module -e "
import('./assets/biomarkers.js').then(m => {
  const en = Object.keys(m.biomarkers.en).length
  const ru = Object.keys(m.biomarkers.ru).length
  console.log('en entries:', en, 'ru entries:', ru)
  if (!m.biomarkers.en['Hemoglobin']?.description) throw new Error('missing EN Hemoglobin')
  if (!m.biomarkers.ru['Hemoglobin']?.description) throw new Error('missing RU Hemoglobin')
})
"
```
Expected: prints non-zero counts for both en and ru, no errors thrown.

- [ ] **Step 5: Commit**

```bash
git add assets/biomarkers.js
git add -u assets/biomarkers.ru.js
git commit -m "Merge biomarkers EN+RU into a single ESM module"
```

---

## Task 2: Merge `recommendations.js` with `recommendations.ru.js`

**Files:**
- Modify: `assets/recommendations.js` (replace entire contents)
- Delete: `assets/recommendations.ru.js`

**Goal:** Same pattern as Task 1, applied to recommendations.

- [ ] **Step 1: Replace `assets/recommendations.js` with the merged ESM version**

```js
// Personalized recommendations, bilingual.
// Keyed by test_name. Shape per entry: { severity, headline, detail, actions[] }
// severity: "attention" | "watch" | "info"

export const recommendations = {
  en: {
    "Insulin": {
      severity: "attention",
      headline: "Fasting insulin has risen 5× — early insulin-resistance signal",
      detail: "11.3 µIU/mL is still within range (2.6–24.9), but in 2016 you were at 2.0. Your HOMA-IR moved from 0.4 to 2.1 over the same period, and SHBG fell from 90 to 25.5 nmol/L. These three readings tell the same story: insulin sensitivity has slipped, even though HbA1c and fasting glucose still read normal. This is the earliest, most actionable metabolic signal in your panel.",
      actions: [
        "Add resistance training 3× per week. It raises muscle GLUT4 and drops fasting insulin faster than anything else.",
        "Cut refined carbs, sugar-sweetened drinks, and ultra-processed snacks. Lead meals with protein and fiber.",
        "Sleep 7+ hours consistently — one short night measurably reduces next-day insulin sensitivity.",
        "Walk 10–15 minutes after your two biggest meals — it flattens the glucose/insulin spike.",
      ],
    },
    // …every other entry currently in assets/recommendations.js, copied verbatim…
  },
  ru: {
    "Insulin": {
      severity: "attention",
      headline: "Инсулин натощак вырос в 5 раз — ранний сигнал инсулинорезистентности",
      detail: "11,3 µIU/мл ещё в пределах нормы (2,6–24,9), но в 2016-м у вас было 2,0. За тот же период HOMA-IR вырос с 0,4 до 2,1, а ГСПГ упал с 90 до 25,5 нмоль/л. Три показателя рассказывают одну историю: чувствительность к инсулину снизилась, хотя HbA1c и глюкоза ещё в норме. Это самый ранний и самый действенный метаболический сигнал в вашей панели.",
      actions: [
        "Добавьте силовые тренировки 3 раза в неделю. Они повышают GLUT4 в мышцах и снижают инсулин натощак быстрее всего остального.",
        "Сократите рафинированные углеводы, сладкие напитки и ультрапереработанные снеки. Начинайте приём пищи с белка и клетчатки.",
        "Сон 7+ часов стабильно — одна короткая ночь заметно снижает чувствительность к инсулину на следующий день.",
        "10–15 минут прогулки после двух крупных приёмов пищи сглаживают пик глюкозы и инсулина.",
      ],
    },
    // …every other entry currently in assets/recommendations.ru.js, copied verbatim…
  },
}
```

Copy all entries verbatim from the two existing files. Same rules as Task 1: no entries dropped, renamed, or rephrased.

- [ ] **Step 2: Delete `assets/recommendations.ru.js`**

```bash
rm assets/recommendations.ru.js
```

- [ ] **Step 3: Verify shape with Node**

```bash
node --input-type=module -e "
import('./assets/recommendations.js').then(m => {
  const en = Object.keys(m.recommendations.en).length
  const ru = Object.keys(m.recommendations.ru).length
  console.log('en entries:', en, 'ru entries:', ru)
  if (!m.recommendations.en['Insulin']?.severity) throw new Error('missing EN Insulin')
  if (!m.recommendations.ru['Insulin']?.severity) throw new Error('missing RU Insulin')
})
"
```
Expected: prints non-zero counts for both, no errors.

- [ ] **Step 4: Commit**

```bash
git add assets/recommendations.js
git add -u assets/recommendations.ru.js
git commit -m "Merge recommendations EN+RU into a single ESM module"
```

---

## Task 3: Convert `i18n.js` to ESM

**Files:**
- Modify: `assets/i18n.js` (replace entire contents)

**Goal:** Three named exports replace three globals.

- [ ] **Step 1: Replace `assets/i18n.js` with the ESM version**

Preserve every key from the current file. Only delivery changes:

```js
// UI string translations, canonical test-name and category labels.
// Fallback: if a key is missing in the chosen language, English is used by call sites.

export const strings = {
  en: {
    title_main:        "The Health",
    title_accent:      "Ledger",
    // …every other EN key from the current window.I18N.en, copied verbatim…
    // Includes function-valued keys like detail_no_info and detail_reading_n.
  },
  ru: {
    title_main:        "Медицинский",
    title_accent:      "Дневник",
    // …every other RU key from the current window.I18N.ru, copied verbatim…
  },
}

export const testNamesRu = {
  // …every entry currently in window.TEST_NAMES_RU, copied verbatim…
}

export const categoriesRu = {
  // …every entry currently in window.CATEGORIES_RU, copied verbatim…
}
```

Copy the three current globals verbatim into the three named exports. Function-valued entries (e.g. `detail_no_info(testName)`, `detail_reading_n(n)`) stay as arrow functions.

- [ ] **Step 2: Verify shape with Node**

```bash
node --input-type=module -e "
import('./assets/i18n.js').then(m => {
  const en = Object.keys(m.strings.en).length
  const ru = Object.keys(m.strings.ru).length
  const names = Object.keys(m.testNamesRu).length
  const cats = Object.keys(m.categoriesRu).length
  console.log('en strings:', en, 'ru strings:', ru, 'testNamesRu:', names, 'categoriesRu:', cats)
  if (typeof m.strings.en.detail_reading_n !== 'function') throw new Error('detail_reading_n must be a function')
})
"
```
Expected: prints positive counts for all four; no errors.

- [ ] **Step 3: Commit**

```bash
git add assets/i18n.js
git commit -m "Convert i18n.js to ESM exports"
```

---

## Task 4: Minimal `index.html` + Arrow bootstrap in `app.js`

**Files:**
- Modify: `assets/index.html` (replace entire contents)
- Modify: `assets/app.js` (replace entire contents — first slice)

**Goal:** Browser loads Arrow, state is populated from `/api/data`, a placeholder message renders. This proves the pipe works before we build out UI.

- [ ] **Step 1: Replace `assets/index.html`**

```html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>The Health Ledger</title>
<meta name="viewport" content="width=device-width, initial-scale=1">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Spectral:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400;1,500&display=swap" rel="stylesheet">
<link rel="stylesheet" href="styles.css">
</head>
<body>
<div class="paper-grain" aria-hidden="true"></div>
<div id="app"></div>
<script type="module" src="app.js"></script>
</body>
</html>
```

All prior inline DOM (header, tabs, panels, dialog) is gone — Arrow renders the whole app into `#app`. `paper-grain` stays outside because `styles.css` positions it behind everything.

- [ ] **Step 2: Replace `assets/app.js` with the bootstrap-only version**

```js
import { reactive, html, watch } from 'https://esm.sh/@arrow-js/core'
import { render } from 'https://esm.sh/@arrow-js/framework'
import Chart from 'https://esm.sh/chart.js/auto'
import { strings, testNamesRu, categoriesRu } from './i18n.js'
import { biomarkers } from './biomarkers.js'
import { recommendations } from './recommendations.js'

// ───────────── reactive root ─────────────

const state = reactive({
  rows: [],
  csvPath: '',
  lang: localStorage.getItem('lang') === 'ru' ? 'ru' : 'en',
  activeTab: 'summary',
  categoryFilter: 'All',
  tableSort: { col: 'date', dir: 'desc' },
  tableSearch: '',
  sourceFilter: null,
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

export const biomarkersForLang = () => biomarkers[state.lang] ?? biomarkers.en ?? {}
export const recommendationsForLang = () => recommendations[state.lang] ?? recommendations.en ?? {}

// ───────────── number/row helpers ─────────────

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
      ? `${state.rows.length} ${t('meta_readings')} loaded from ${state.csvPath}`
      : t('empty_title') || 'No data'
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
  } catch (err) {
    console.error(err)
    state.rows = []
  }
})()
```

- [ ] **Step 3: Start the server and verify in browser**

Run:
```bash
python3 scripts/serve.py --csv health_data.csv --no-open
```

In another terminal / browser tab, open `http://127.0.0.1:8765/`. Expected:
- Page loads.
- Browser devtools Console: no errors.
- Body shows one line like `N readings loaded from /path/to/health_data.csv`.
- Stop the server with Ctrl+C.

- [ ] **Step 4: Commit**

```bash
git add assets/index.html assets/app.js
git commit -m "Arrow bootstrap: minimal shell renders meta from /api/data"
```

---

## Task 5: Header, language switch, tabs, sources

**Files:**
- Modify: `assets/app.js` (append components; replace `App()` body)

**Goal:** The masthead, folio, EN/RU switch, tab bar, and the `<details>` source list all render and behave correctly.

- [ ] **Step 1: Add the component definitions above `App`**

Insert the following in `app.js` above the existing `const App = ...` definition (and remove the placeholder `App` definition):

```js
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

const jumpToRecord = (query) => {
  state.tableSearch = query
  state.activeTab = 'table'
}
```

- [ ] **Step 2: Replace the placeholder `App()` with the chrome-only shell**

```js
const App = () => html`
  ${LangSwitch()}
  ${Header()}
  <main class="wrap">
    <section class="panel active">
      <p>Panels coming next task.</p>
    </section>
  </main>
`
```

- [ ] **Step 3: Boot and verify in browser**

Run `python3 scripts/serve.py --csv health_data.csv --no-open` and open `http://127.0.0.1:8765/`. Expected:
- EN/RU switch visible top-right; clicking RU flips the masthead title, folio, tagline, tab labels to Russian.
- Meta line shows reading count and date range.
- Sources `<details>` expands and lists files.
- Clicking a source file sets `state.activeTab = 'table'` (you'll see the placeholder change; real table arrives in Task 8).
- Console: no errors.

Stop the server with Ctrl+C.

- [ ] **Step 4: Commit**

```bash
git add assets/app.js
git commit -m "Arrow: header, language switch, tabs, sources list"
```

---

## Task 6: Summary panel (priorities + latest-readings grid)

**Files:**
- Modify: `assets/app.js` (append components; update `App` to render summary panel when active)

**Goal:** At-a-glance tab renders priority cards (from recommendations data) and the grid of latest-reading cards. Clicking a card sets `state.detail` (wired to modal in Task 9).

- [ ] **Step 1: Add the summary helpers and components**

Append below the existing definitions:

```js
// ───────────── severity helpers ─────────────

const SEVERITY_RANK = { attention: 0, watch: 1, info: 2 }

const severityLabel = (sev) => {
  if (sev === 'attention') return t('severity_attention')
  if (sev === 'watch')     return t('severity_watch')
  if (sev === 'info')      return t('severity_info')
  return sev
}

// ───────────── priorities ─────────────

const priorityEntries = () => {
  const recs = recommendationsForLang()
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
```

- [ ] **Step 2: Update `App()` to swap panels**

Replace the `<main>` section of `App()`:

```js
const App = () => html`
  ${LangSwitch()}
  ${Header()}
  <main class="wrap">
    ${() => state.activeTab === 'summary' ? SummaryPanel() : ''}
    ${() => state.activeTab === 'charts'  ? html`<section class="panel active"><p>Charts coming next task.</p></section>` : ''}
    ${() => state.activeTab === 'table'   ? html`<section class="panel active"><p>Table coming next task.</p></section>` : ''}
  </main>
`
```

- [ ] **Step 3: Boot and verify**

Run `python3 scripts/serve.py --csv health_data.csv --no-open` and open the URL.

Expected:
- **At a glance** tab is the default. The priorities section shows items drawn from `recommendations.en`/`.ru`; each card has a colored severity stripe matching the CSS class `sev-attention` / `sev-watch` / `sev-info`.
- Below priorities: one card per test, with value, unit, date, delta vs. prior reading.
- Clicking a card sets `state.detail` — verify in devtools console: `window.__appState` isn't defined, but you'll wire the modal in Task 9. For now, click doesn't do anything visible.
- Switching to RU flips all priorities and summary strings, including card titles.
- Console: no errors.

Stop with Ctrl+C.

- [ ] **Step 4: Commit**

```bash
git add assets/app.js
git commit -m "Arrow: summary panel — priorities and latest-readings grid"
```

---

## Task 7: Charts panel (Chart.js via `watch()`)

**Files:**
- Modify: `assets/app.js` (append components; update `App` charts slot)

**Goal:** Over-time tab renders one Chart.js line chart per test with reference-range band, category filter chips, empty state when nothing matches.

- [ ] **Step 1: Add chart helpers, category filter, and the panel component**

Append to `app.js`:

```js
// ───────────── Chart.js theme bootstrap ─────────────

const getVar = (name) => getComputedStyle(document.documentElement).getPropertyValue(name).trim()

const themeChartDefaults = () => {
  Chart.defaults.font.family = '"Spectral", "Source Serif 4", Georgia, serif'
  Chart.defaults.font.size = 12
  Chart.defaults.color = getVar('--ink-soft')
}
themeChartDefaults()

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
      <button class="chip ${() => state.categoryFilter === c ? 'active' : ''}"
              @click="${() => { state.categoryFilter = c }}">
        ${() => catLabel(c)}
      </button>
    `.key(c))}
  </div>
`

// ───────────── charts ─────────────

const chartNames = () => {
  const byName = testsByName()
  return Object.keys(byName)
    .filter((n) => state.categoryFilter === 'All' || byName[n][0].category === state.categoryFilter)
    .sort((a, b) => testLabel(a).localeCompare(testLabel(b), state.lang === 'ru' ? 'ru' : 'en'))
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
            <h3>${testLabel(name)}</h3>
            <p class="sub">${catLabel(category)}${unit ? ` · ${unit}` : ''}</p>
            <div class="chart-wrap"><canvas data-canvas="${name}"></canvas></div>
          </section>
        `.key(name)
      })}
    </div>
  </section>
`

// ───────────── Chart.js lifecycle via watch ─────────────

const chartInstances = new Map()  // test_name -> Chart

const buildChartConfig = (name, series, lang) => {
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
  const lang = state.lang

  if (tab !== 'charts' || !rows.length) {
    chartInstances.forEach((c) => c.destroy())
    chartInstances.clear()
    return
  }

  queueMicrotask(() => {
    const byName = testsByName()
    const names = chartNames()
    const wanted = new Set(names)

    // Destroy charts no longer visible
    for (const [name, inst] of chartInstances) {
      if (!wanted.has(name)) { inst.destroy(); chartInstances.delete(name) }
    }

    // Create/recreate for visible charts
    for (const name of names) {
      const canvas = document.querySelector(`canvas[data-canvas="${CSS.escape(name)}"]`)
      if (!canvas) continue
      chartInstances.get(name)?.destroy()
      const chart = new Chart(canvas, buildChartConfig(name, byName[name], lang))
      chartInstances.set(name, chart)
    }
  })
})
```

Notes for the engineer:
- `queueMicrotask` defers until after Arrow finishes DOM updates, so `querySelector` finds the newly rendered canvases.
- Destroy-and-recreate on language change is intentional — Chart.js labels are captured at construction and don't respond to reactive reads. Recreation is the simplest correct behavior.

- [ ] **Step 2: Update `App()` to render the charts panel**

Replace the charts placeholder line in `App()`:

```js
${() => state.activeTab === 'charts' ? ChartsPanel() : ''}
```

- [ ] **Step 3: Boot and verify**

Run the server and switch to the **Over time** tab. Expected:
- One chart per test. X-axis uses time formatting, Y-axis shows values.
- Reference range is a sage-colored band between low and high dashed lines; where only one bound is present, only that dashed line shows.
- Category filter chips at top: clicking one narrows the chart list. "All" restores the full set.
- Clicking a data point shows a tooltip with value, unit, flag, and source file.
- Switching language redraws all charts; tooltip label "from" becomes Russian.
- Switching to another tab destroys charts (no leaks). Switching back rebuilds them.
- Console: no errors.

Stop with Ctrl+C.

- [ ] **Step 4: Commit**

```bash
git add assets/app.js
git commit -m "Arrow: charts panel with Chart.js lifecycle via watch()"
```

---

## Task 8: Table panel (search + sortable columns)

**Files:**
- Modify: `assets/app.js` (append component; update `App` table slot)

**Goal:** The Record tab renders the full CSV as a sortable, filterable table.

- [ ] **Step 1: Add the table component**

Append to `app.js`:

```js
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
      r.date, r.test_name, testLabel(r.test_name),
      r.unit, r.category, catLabel(r.category),
      r.source_file, r.flag,
      r.value != null ? String(r.value) : '',
    ].join(' ').toLowerCase()
    return searchable.includes(q)
  })
  rows.sort((a, b) => {
    let av = a[col], bv = b[col]
    if (col === 'test_name') { av = testLabel(av); bv = testLabel(bv) }
    if (col === 'category')  { av = catLabel(av);  bv = catLabel(bv)  }
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
      <input type="search"
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
                  return html`<td><span class="flag ${v}">${v}</span></td>`
                }
                if (c === 'test_name') return html`<td class="${cls}">${testLabel(v)}</td>`
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
```

- [ ] **Step 2: Update `App()` to render the table panel**

Replace the table placeholder line:

```js
${() => state.activeTab === 'table' ? TablePanel() : ''}
```

- [ ] **Step 3: Boot and verify**

Run the server, switch to **The record** tab. Expected:
- Every CSV row shows as a table row. Columns match current dashboard: date, test, value, unit, low, high, flag, category, source.
- Clicking a column header sorts; clicking again flips asc/desc.
- Typing in the search input filters rows to those with matching text (case-insensitive).
- Clicking a file in the **Sources** `<details>` (see Task 5) populates the search box and switches to this tab.
- RU language switches the test and category labels to Russian in the rendered cells, and re-applies to search matching.
- Console: no errors.

Stop with Ctrl+C.

- [ ] **Step 4: Commit**

```bash
git add assets/app.js
git commit -m "Arrow: table panel with search and sortable columns"
```

---

## Task 9: Detail modal

**Files:**
- Modify: `assets/app.js` (append component; update `App` to include modal)

**Goal:** Clicking a card or priority opens a `<dialog>` with the test's full history, description, interpretation, suggestions, and personalized recommendation.

- [ ] **Step 1: Add the detail-modal component**

Append to `app.js`:

```js
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
    info: biomarkersForLang()[name] ?? null,
    rec: recommendationsForLang()[name] ?? null,
  }
}

// Open/close the dialog when state.detail changes.
// We use watch + microtask so Arrow has rendered the <dialog> element before we call showModal().
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

const closeDetail = () => { state.detail = null }

const DetailBody = (entry) => {
  const { name, series, latest, info, rec } = entry
  const flag = latest.flag || ''
  const hasRange = latest.reference_low != null || latest.reference_high != null
  const rangeStr = hasRange
    ? `${t('detail_range')} ${latest.reference_low ?? '—'}..${latest.reference_high ?? '—'}`
    : t('detail_no_range')

  const hist = [...series].reverse()
  const readingsFn = strings[state.lang]?.detail_reading_n ?? ((n) => `${n} readings`)
  const noInfoFn = strings[state.lang]?.detail_no_info ?? ((n) => `No reference notes yet for "${n}".`)

  return html`
    <article class="detail-body">
      <header class="detail-head">
        <p class="detail-eyebrow">${() => catLabel(latest.category || '')}</p>
        <h2>${testLabel(name)}</h2>
        <div class="detail-latest">
          <span class="detail-val">${fmt(latest.value)}<span class="unit">${latest.unit || ''}</span></span>
          ${flag ? html`<span class="flag ${flag}">${flag}</span>` : ''}
          <span class="detail-date">${latest.date}</span>
          <span class="detail-range">${rangeStr}</span>
        </div>
      </header>

      ${rec ? html`
        <div class="detail-rec sev-${rec.severity}">
          <div class="detail-rec-top">
            <span class="detail-rec-label sev-${rec.severity}">${severityLabel(rec.severity)}</span>
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
            <dl>
              ${info.high ? html`<dt class="hi">${() => t('detail_if_high')}</dt><dd>${info.high}</dd>` : ''}
              ${info.low  ? html`<dt class="lo">${() => t('detail_if_low')}</dt><dd>${info.low}</dd>` : ''}
            </dl>
          </section>
        ` : ''}
        ${(info.suggestions || []).length ? html`
          <section class="detail-section">
            <h3>${() => t('detail_suggest')}</h3>
            <ul>${(info.suggestions || []).map((s) => html`<li>${s}</li>`)}</ul>
          </section>
        ` : ''}
      ` : html`
        <section class="detail-section">
          <h3>${() => t('detail_no_info_h')}</h3>
          <div class="detail-missing">${noInfoFn(testLabel(name))}</div>
        </section>
      `}

      <p class="detail-disclaimer">
        <strong>${() => t('detail_discl_strong')}</strong>
        <span>${() => t('detail_discl')}</span>
      </p>

      <section class="detail-section detail-history">
        <h3>
          <span>${() => t('detail_readings')}</span>
          <span class="detail-history-count">· ${readingsFn(hist.length)}</span>
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
                  <td>${r.flag ? html`<span class="flag ${r.flag}">${r.flag}</span>` : ''}</td>
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
```

- [ ] **Step 2: Include `DetailModal` in `App()`**

Update `App()` so the modal renders at the root:

```js
const App = () => html`
  ${LangSwitch()}
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
```

- [ ] **Step 3: Boot and verify**

Run the server. Expected:
- Click a summary card → modal opens, showing test name, latest value, description, interpretation, suggestions, history table, and (if present) personalized recommendation.
- Click a priority card → same modal.
- Close via the ✕ button, clicking outside the dialog body, or pressing Escape (native `<dialog>` behavior).
- After close, modal doesn't re-open on state change; clicking another card opens it again with the new test.
- "View in the record" link closes the modal, switches to the table tab, and populates search with the test name.
- RU: all modal strings switch.
- Console: no errors.

Stop with Ctrl+C.

- [ ] **Step 4: Commit**

```bash
git add assets/app.js
git commit -m "Arrow: detail modal with per-test history and recommendations"
```

---

## Task 10: End-to-end verification

**Files:** none modified — run the full spec checklist and fix anything that fails.

- [ ] **Step 1: Start the server**

```bash
python3 scripts/serve.py --csv health_data.csv
```

Open `http://127.0.0.1:8765/`.

- [ ] **Step 2: Walk the spec verification list**

For each item, confirm behavior; if broken, fix in `assets/app.js` and commit the fix separately.

1. Page loads with no console errors.
2. **Summary tab** — priorities render, one card per test, flags colored correctly.
3. **Charts tab** — one chart per test, reference-range band visible, category filter chips switch what renders, empty-match shows the right message.
4. **Table tab** — search filters, column headers toggle sort direction.
5. **Language switch** — EN ⇄ RU flips *every* string: title, tagline, tab labels, chart axes (after reload/repaint), modal content, table column headers, category chip labels.
6. **Detail modal** — clicking a card opens it, every section populates, close works, "View in the record" navigates correctly.
7. **Sources filter** — clicking a file filters the table.
8. **Reload after append** — run `python3 scripts/append_to_csv.py` with a small additional JSON input, then reload the browser; new rows appear.
9. **Responsive** — shrink the window to phone width; charts and grid should still render without layout collapse (same as pre-migration).

- [ ] **Step 3: Confirm the old `.ru.js` files are gone**

```bash
ls assets/biomarkers.ru.js assets/recommendations.ru.js 2>&1 || echo "both removed as expected"
```
Expected output includes "No such file or directory" and "both removed as expected".

- [ ] **Step 4: Confirm no `window.*` globals remain**

```bash
grep -rn "window\.\(I18N\|TEST_NAMES_RU\|CATEGORIES_RU\|BIOMARKERS\|RECOMMENDATIONS\)" assets/
```
Expected: no matches. (No output.)

- [ ] **Step 5: If any fixes were needed during Step 2, commit each separately**

Example:
```bash
git add assets/app.js
git commit -m "Fix: <short description of the regression>"
```

- [ ] **Step 6: Final commit sweep**

If the working tree is clean, the migration is complete. Otherwise:

```bash
git status
git diff
```

Confirm everything is intentional, commit if needed.

---

## Out of scope (do not implement)

- Server-side rendering (`@arrow-js/ssr` / `@arrow-js/hydrate`).
- TypeScript or any build step.
- Unit test infrastructure.
- New features, visual redesign, or copy changes.
- Changes to `scripts/serve.py`, `scripts/append_to_csv.py`, or the CSV schema.

## Done criteria

- All ten tasks checked off.
- `assets/biomarkers.ru.js` and `assets/recommendations.ru.js` are deleted.
- No `window.*` globals in `assets/`.
- All nine verification bullets in Task 10 Step 2 pass.
- The dashboard looks indistinguishable from the pre-migration version in both EN and RU modes.
