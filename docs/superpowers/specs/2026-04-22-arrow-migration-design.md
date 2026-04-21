# Frontend migration to Arrow — design

## Goal

Replace the imperative vanilla-JS frontend in `assets/` with [Arrow](https://github.com/justin-schroeder/arrow-js)'s reactive template model, **and** remove all bundled per-test reference content from the skill — agents generate it per-user at extraction time instead. Preserve:

- The zero-install delivery story (no `pip install`, no `npm install`, no bundler).
- The existing Python-stdlib server (`scripts/serve.py` extended by one endpoint slice).
- Visual parity with today's dashboard (same CSS, same look).
- All current features: priorities, summary cards, charts, sortable table, detail modal, sources filter, EN/RU chrome.

Less code than today is an explicit goal. The four bundled content files (`biomarkers.js`, `biomarkers.ru.js`, `recommendations.js`, `recommendations.ru.js`) — about 2,200 lines combined — are deleted.

## Delivery mode

**No-build, CDN ESM.** Arrow and Chart.js load from esm.sh at runtime:

```js
import { reactive, html, watch } from 'https://esm.sh/@arrow-js/core'
import { render } from 'https://esm.sh/@arrow-js/framework'
import Chart from 'https://esm.sh/chart.js/auto'
```

`index.html` contains a single `<script type="module" src="app.js"></script>`. No Vite, no pnpm, no SSR, no hydration.

## Data model

### CSV (unchanged)

Same schema, same `append_to_csv.py`, same location (user's workspace, typically `~/health/health_data.csv`).

### Context JSON (new)

A companion file, `health_context.json`, lives **in the same directory as the CSV** — in the user's workspace, not in the skill install. The agent writes it during extraction; the user's dashboard reads it.

Shape:

```json
{
  "biomarkers": {
    "Hemoglobin": {
      "description": "The oxygen-carrying protein inside red blood cells…",
      "high": "Dehydration, smoking, high altitude…",
      "low":  "Anemia — commonly iron deficiency…",
      "suggestions": [
        "If low: eat iron-rich foods…",
        "Rule out hidden blood loss…"
      ]
    }
  },
  "recommendations": {
    "Insulin": {
      "severity": "attention",
      "headline": "Fasting insulin has risen 5× — early insulin-resistance signal",
      "detail":   "11.3 µIU/mL is still within range…",
      "actions": [
        "Add resistance training 3× per week…",
        "Cut refined carbs…"
      ]
    }
  }
}
```

Rules:

- **Single language.** Whichever language matches the user's data / preference. No `{ en, ru }` nesting.
- **Keyed by canonical test name** — same keys used in the CSV's `test_name` column.
- **Either top-level object may be missing or empty.** Consumer treats missing as "no content to show."
- **Optional file.** If `health_context.json` doesn't exist, the dashboard still renders the CSV — priorities section hides, detail modal shows "no reference notes yet."

### How the agent produces it

`SKILL.md` instructs the agent to write `health_context.json` alongside the CSV during extraction. Step added after the current "Hand the rows to the CSV script":

> After appending rows, regenerate `health_context.json` in the same directory as the CSV. Include a `biomarkers` entry for each distinct test in the CSV (general reference notes) and a `recommendations` entry for tests where the user's actual data warrants attention. Re-run whenever new readings land.

Agents are told to keep it concise. Tests the user doesn't have can be omitted entirely. Biomarkers that have no actionable suggestions can also be omitted.

## Server changes

`scripts/serve.py` extends the existing `/api/data` endpoint:

```
GET /api/data  →  { rows: [...], csv_path: "...", context: {...} | null }
```

The server computes `context_path = csv_path.parent / "health_context.json"`. If the file exists, it parses it as JSON and returns it under `context`. If missing or unparseable, `context: null` and a log line warns. Reads on every request so users can re-run the agent and reload the page without restarting the server — same mechanic as the CSV.

No new endpoint, no new CLI flag, no new dependencies.

## File layout (assets)

```
assets/
  index.html          # minimal shell: <div id="app"></div>
  app.js              # Arrow templates, reactive state, data+context fetch, charts
  i18n.js             # export { strings, testNamesRu, categoriesRu }
  styles.css          # unchanged
```

Deleted:
- `assets/biomarkers.js`
- `assets/biomarkers.ru.js`
- `assets/recommendations.js`
- `assets/recommendations.ru.js`

`i18n.js` keeps only UI chrome: titles, taglines, tab labels, column headers, empty-state copy, date-label formatters, and the `TEST_NAMES_RU` / `CATEGORIES_RU` lookups for translating test and category names in the UI. Nothing per-test-content.

## Reactive state

```js
const state = reactive({
  lang: 'en',                          // 'en' | 'ru' — UI chrome only
  rows: [],                            // CSV rows
  csvPath: '',
  context: null,                       // { biomarkers, recommendations } | null
  activeTab: 'summary',                // 'summary' | 'charts' | 'table'
  categoryFilter: 'All',
  tableSearch: '',
  tableSort: { col: 'date', dir: 'desc' },
  detail: null,                        // test name when modal open
})
```

Derived values (latest-per-test, priorities, filtered table rows) are plain functions read lazily inside `${() => ...}` template expressions.

## Rendering structure

One root `App()`, a handful of sub-components, all in `app.js`:

```js
const App = () => html`
  ${LangSwitch()}
  ${Header()}
  <main class="wrap">
    ${() => state.activeTab === 'summary' ? SummaryPanel() : ''}
    ${() => state.activeTab === 'charts'  ? ChartsPanel()  : ''}
    ${() => state.activeTab === 'table'   ? TablePanel()   : ''}
    ${Colophon()}
  </main>
  ${DetailModal()}
`
```

Sub-components:

- `LangSwitch` — EN/RU buttons; flips UI chrome only.
- `Header` — masthead, meta line, sources `<details>`.
- `Tabs` — three buttons; `state.activeTab`.
- `SummaryPanel` — priorities list (hidden if `state.context?.recommendations` is empty) + latest-readings grid.
- `ChartsPanel` — category chips + one chart card per test.
- `TablePanel` — search + sortable table.
- `DetailModal` — per-test history + (if present in context) biomarker info + recommendation.

## Chart.js integration

Each chart card renders a `<canvas data-canvas="TestName">` in its template. A single `watch()` in `app.js` tracks `state.rows`, `state.lang`, `state.categoryFilter`, and `state.activeTab`; when any change, it queues a microtask, finds each visible canvas by selector, destroys the prior Chart instance, and creates a new one. Simplest correct integration; no per-card watchers.

## Language switch — scope reduction

Today's app re-renders every string (including biomarker descriptions and recommendations) on `state.lang` change. After this migration, the language switch only flips:

- UI chrome strings (titles, tab labels, meta line, column headers, tooltip `from` label, etc.)
- Test-name display (`TEST_NAMES_RU` lookup) and category-name display (`CATEGORIES_RU`)

Biomarker descriptions and recommendations render in whatever language the agent wrote — no translation layer.

## Fetch flow

On startup:

```js
const res = await fetch('/api/data')
const { rows, csv_path, context } = await res.json()
state.rows = rows.map(parseRow)
state.csvPath = csv_path
state.context = context ?? null
```

One request, both payloads.

## SKILL.md updates

Two edits:

1. **Pipeline diagram** — add the context file:
   ```
   source(s) ──► agent normalizes ──► append_to_csv.py ──► health_data.csv
                                  ╰─► agent writes ────► health_context.json ─┐
                                                                              ▼
                                                             scripts/serve.py ► dashboard
   ```

2. **New step 4a** ("Write the context JSON") between "Hand the rows to the CSV script" and "Launch the dashboard," with format spec and example. The step explains:
   - Where to write (same directory as the CSV)
   - What shape (the JSON schema above)
   - When to re-run (whenever new rows land)
   - That the file is optional (no context = dashboard skips those sections)
   - Reminder to keep content concise — tokens matter

## What stays the same

- `scripts/append_to_csv.py` — unchanged.
- CSV schema — unchanged.
- `assets/styles.css` — unchanged. All CSS classes referenced are reproduced by the Arrow templates.
- Fonts, Chart.js visual output — unchanged.

## Out of scope

- SSR / hydration.
- TypeScript or any build step.
- Unit tests (project has no test infrastructure).
- Design changes. Dashboard should look indistinguishable in EN mode.
- Migrating existing user `recommendations.js` content into `health_context.json` automatically. If a user still wants their prior content, they (or the agent in a fresh extraction) writes it into the new format.

## Verification

Manual, in-browser, after migration:

1. Fresh workspace with only `health_data.csv` (no `health_context.json`): `python3 scripts/serve.py --csv health_data.csv` boots; dashboard loads; priorities section hidden; detail modal shows "no reference notes yet" for every test.
2. Add a `health_context.json` next to the CSV with a couple of biomarkers and one recommendation: reload the browser — priorities section appears; detail modal now shows description, high/low, suggestions, and personalized recommendation for those entries.
3. **Summary tab**: one card per test, flags colored correctly, priority cards visible when recommendations exist.
4. **Charts tab**: one chart per test, reference-range band visible, category filter works.
5. **Table tab**: search filters, column headers sort.
6. **Language switch**: EN ⇄ RU flips UI chrome — titles, tabs, columns, meta, ornament labels, tooltip "from" — and test-name/category display. Biomarker descriptions and recommendations stay in their original language (expected).
7. **Detail modal**: clicking a summary card opens it; history populates; description/recommendations appear only when present in context.
8. **Sources filter**: clicking a file in the sources `<details>` switches to the table tab with that file pre-searched.
9. **Malformed `health_context.json`** (invalid JSON): server logs a warning, endpoint returns `context: null`, dashboard still works.

No regressions vs. today's dashboard (when a context JSON is present).
