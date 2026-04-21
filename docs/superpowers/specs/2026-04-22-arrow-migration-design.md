# Frontend migration to Arrow — design

## Goal

Replace the imperative vanilla-JS frontend in `assets/` with [Arrow](https://github.com/justin-schroeder/arrow-js)'s reactive template model, while preserving:

- The zero-install delivery story (no `pip install`, no `npm install`, no bundler).
- The existing Python-stdlib server (`scripts/serve.py` untouched).
- Visual parity with today's dashboard (same CSS, same look).
- All current features: language switch, tabs, priorities, summary cards, charts, sortable table, detail modal, sources filter.

Less code than today is a goal, not a stretch target.

## Delivery mode

**No-build, CDN ESM.** Arrow and Chart.js load from esm.sh at runtime:

```js
import { reactive, html, watch } from 'https://esm.sh/@arrow-js/core'
import { render } from 'https://esm.sh/@arrow-js/framework'
import Chart from 'https://esm.sh/chart.js/auto'
```

`index.html` contains a single `<script type="module" src="app.js"></script>`. No Vite, no `pnpm`, no SSR, no hydration. First page load still needs internet (same as Chart.js today); afterwards the browser caches the modules.

## File layout

```
assets/
  index.html          # minimal shell: <div id="app"></div>
  app.js              # Arrow templates, reactive state, data fetch, chart integration
  i18n.js             # export { strings, formatters }
  biomarkers.js       # export const biomarkers = { en: {...}, ru: {...} }
  recommendations.js  # export const rules = { en: [...], ru: [...] }
  styles.css          # unchanged
```

Changes from today:

- `biomarkers.js` + `biomarkers.ru.js` → one `biomarkers.js` with `{ en, ru }`. Same for `recommendations.js`.
- All five JS files become ESM modules — `import` / `export`, no window globals.
- `index.html` drops all inline DOM scaffolding and every `data-i18n` attribute. Arrow renders the whole app.

## Reactive state

One root `reactive()` object drives the UI:

```js
const state = reactive({
  lang: 'en',                          // 'en' | 'ru'
  rows: [],                            // raw CSV rows from /api/data
  csvPath: '',
  activeTab: 'summary',                // 'summary' | 'charts' | 'table'
  categoryFilter: null,                // null = all categories
  tableSearch: '',
  tableSort: { col: 'date', dir: 'desc' },
  sourceFilter: null,                  // filename, or null
  detail: null,                        // { testName } when modal open
})
```

Derived values (latest-per-test, priorities, filtered/sorted table rows) are plain functions of `state`, called lazily inside `${() => ...}` template expressions so Arrow tracks the reads.

Language switching is `state.lang = 'ru'`. Every translated string is `${() => t(key, state.lang)}`. No DOM walking, no `applyI18n()`.

## Rendering structure

One top-level `App()` component, a handful of sub-components, all in `app.js`:

```js
const App = () => html`
  ${LangSwitch(state)}
  ${Header(state)}
  ${Tabs(state)}
  <main class="wrap">
    ${() => state.activeTab === 'summary' ? SummaryPanel(state) : ''}
    ${() => state.activeTab === 'charts'  ? ChartsPanel(state)  : ''}
    ${() => state.activeTab === 'table'   ? TablePanel(state)   : ''}
    ${Colophon(state)}
  </main>
  ${DetailModal(state)}
`

render(document.getElementById('app'), App())
```

Sub-components:

- `LangSwitch` — EN/RU buttons, set `state.lang`.
- `Header` — masthead, meta line, sources `<details>` (click to set `state.sourceFilter`).
- `Tabs` — three buttons, set `state.activeTab`.
- `SummaryPanel` — priorities list + latest-readings grid. Card click sets `state.detail`.
- `ChartsPanel` — category filter chips + one chart card per test.
- `TablePanel` — search input + sortable table. Column header click updates `state.tableSort`.
- `DetailModal` — native `<dialog>`, shown when `state.detail !== null`. Includes history, description, recommendations.

## Chart.js integration

Each chart card renders `<canvas>` through `html`. A `watch()` creates the Chart instance once the canvas is mounted and destroys/recreates it when inputs change (rows, language, category filter).

```js
const ChartCard = (testName) => {
  let chart = null
  let canvas = null
  const ref = (el) => { canvas = el }
  watch(() => {
    const data = seriesFor(state.rows, testName)
    const labels = chartLabels(state.lang)
    if (!canvas) return
    chart?.destroy()
    chart = new Chart(canvas, buildConfig(data, labels))
  })
  return html`<div class="chart-card"><canvas @ref="${ref}"></canvas></div>`
}
```

(Exact ref-callback syntax follows Arrow's conventions — confirmed during implementation against `.arrow-js/skill/api.md`.)

One watcher per chart card — lifecycle is tied to the card being in the DOM.

## Data flow

On startup:

```js
const res = await fetch('/api/data')
const { rows, csv_path } = await res.json()
state.rows = rows
state.csvPath = csv_path
```

That's the whole data flow. No polling. The server reads the CSV on every request, so users reload the page to pick up new rows — same as today.

## What stays the same

- `scripts/serve.py` — unchanged.
- `scripts/append_to_csv.py` — unchanged.
- CSV schema — unchanged.
- `assets/styles.css` — unchanged. Every class name and DOM structure the CSS targets is reproduced by Arrow templates.
- Fonts, CDN font loading, Chart.js visual output — unchanged.

## Out of scope

- SSR / hydration (`@arrow-js/ssr`, `@arrow-js/hydrate`) — no SEO benefit for a private local dashboard.
- TypeScript — project is plain JS today; no reason to introduce a compile step.
- Tests — project has no test infrastructure; verification stays manual-in-browser.
- Design changes. Visual output should be indistinguishable from today.

## Verification

Run manually after migration:

1. `python3 scripts/serve.py --csv health_data.csv` boots; page loads with no console errors.
2. **Summary tab**: priorities render, one card per test in the grid, flags (`H`/`L`/`N`) colored correctly.
3. **Charts tab**: one chart per test, reference-range band visible, category filter switches what renders.
4. **Table tab**: search filters rows, clicking a column header toggles sort direction.
5. **Language switch**: EN ⇄ RU flips every string — titles, taglines, tab labels, chart axes, modal content. No residual strings in the other language.
6. **Detail modal**: clicking a summary card opens it; history table, description, recommendations populate; close works.
7. **Sources filter**: clicking a file in the sources `<details>` filters the table to that file.
8. After `append_to_csv.py` adds new rows, a browser reload picks them up.

No regressions vs. today's dashboard.
