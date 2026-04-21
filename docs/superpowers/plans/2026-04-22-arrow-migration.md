# Arrow Frontend Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rewrite the frontend in Arrow (reactive, ESM) **and** remove all bundled per-test reference content from the skill. Agents generate a `health_context.json` in the user's workspace during extraction; the server serves it alongside CSV rows.

**Architecture:** No-build, CDN ESM. One reactive root state. Per-test reference / recommendation content moves from four bundled JS files into a runtime-fetched single-language JSON file in the user's workspace.

**Tech Stack:** `@arrow-js/core`, `@arrow-js/framework`, Chart.js via esm.sh; Python stdlib server.

---

## Project context

### What's changing
- `scripts/serve.py` — extends `/api/data` to include a `context` field loaded from `health_context.json` next to the CSV.
- `SKILL.md` — pipeline diagram + new step documenting `health_context.json`.
- `assets/index.html` — replaced with a minimal shell.
- `assets/app.js` — full rewrite using Arrow.
- `assets/i18n.js` — converted to ESM exports; UI chrome only.
- **Deleted:** `assets/biomarkers.js`, `assets/biomarkers.ru.js`, `assets/recommendations.js`, `assets/recommendations.ru.js`.

### What's NOT changing
- `scripts/append_to_csv.py` — untouched.
- CSV schema.
- `assets/styles.css` — untouched.
- `references/` directory.

### Rules during migration
- No window globals. Everything is ESM `import` / `export`.
- Prefer the simplest Arrow pattern. Don't introduce SSR, hydration, TypeScript, or bundlers.
- Preserve every CSS class name used by `styles.css`.
- Each task's verification is manual: start the server, load the browser, look at it.
- Intermediate commits may leave the dashboard half-working. The final task confirms end-to-end parity.

### Context JSON format (single source of truth for this plan)

`health_context.json`, written by the agent, in the **same directory as the CSV**:

```json
{
  "biomarkers": {
    "<TestName>": {
      "description": "string",
      "high":        "string | optional",
      "low":         "string | optional",
      "suggestions": ["string", "..."]
    }
  },
  "recommendations": {
    "<TestName>": {
      "severity": "attention | watch | info",
      "headline": "string",
      "detail":   "string",
      "actions":  ["string", "..."]
    }
  }
}
```

Either top-level key may be absent or `{}`. File may be absent — consumer treats all of it as optional.

---

## Task 1: Delete the four bundled content files

**Files:**
- Delete: `assets/biomarkers.js`
- Delete: `assets/biomarkers.ru.js`
- Delete: `assets/recommendations.js`
- Delete: `assets/recommendations.ru.js`

**Goal:** Remove content that is about to be generated dynamically. Dashboard is broken after this task; it comes back online in Task 5.

- [ ] **Step 1: Delete the four files**

```bash
rm assets/biomarkers.js assets/biomarkers.ru.js assets/recommendations.js assets/recommendations.ru.js
```

- [ ] **Step 2: Verify they're gone**

```bash
ls assets/biomarkers.js assets/biomarkers.ru.js assets/recommendations.js assets/recommendations.ru.js 2>&1 | grep -c "No such file"
```
Expected: `4`

- [ ] **Step 3: Commit**

```bash
git add -u assets/biomarkers.js assets/biomarkers.ru.js assets/recommendations.js assets/recommendations.ru.js
git commit -m "Remove bundled biomarker and recommendation content

The agent now writes these to health_context.json in the user's
workspace during extraction. See SKILL.md for the format."
```

---

## Task 2: Extend `scripts/serve.py` to serve context JSON

**Files:**
- Modify: `scripts/serve.py` — `_send_data` method

**Goal:** `/api/data` returns `{ rows, csv_path, context }`. `context` is the parsed `health_context.json` next to the CSV, or `null` when missing or unreadable.

- [ ] **Step 1: Update `_send_data`**

Open `scripts/serve.py`. Replace the body of `_send_data` with:

```python
        def _send_data(self):
            rows: list[dict] = []
            if csv_path.exists():
                with csv_path.open(newline="") as f:
                    rows = list(csv.DictReader(f))

            context = None
            context_path = csv_path.parent / "health_context.json"
            if context_path.exists():
                try:
                    with context_path.open() as f:
                        context = json.load(f)
                except (OSError, json.JSONDecodeError) as exc:
                    print(f"  warning: could not read {context_path}: {exc}")

            body = json.dumps({
                "rows": rows,
                "csv_path": str(csv_path),
                "context": context,
            }).encode("utf-8")
            self.send_response(200)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.send_header("Cache-Control", "no-store")
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)
```

No other changes to the file.

- [ ] **Step 2: Verify with a missing context file**

From the project root:

```bash
python3 scripts/serve.py --csv health_data.csv --no-open --port 8765 &
SERVER_PID=$!
sleep 0.5
curl -s http://127.0.0.1:8765/api/data | python3 -c "import json,sys; d=json.load(sys.stdin); print('rows:', len(d['rows']), 'context:', d['context'])"
kill $SERVER_PID
```

Expected output: `rows: <N> context: None` (no `health_context.json` exists yet in the project root).

- [ ] **Step 3: Verify with a valid context file**

```bash
cat > /tmp/health_context.json <<'EOF'
{
  "biomarkers": { "Hemoglobin": { "description": "test", "suggestions": [] } },
  "recommendations": {}
}
EOF
cp /tmp/health_context.json ./health_context.json

python3 scripts/serve.py --csv health_data.csv --no-open --port 8766 &
SERVER_PID=$!
sleep 0.5
curl -s http://127.0.0.1:8766/api/data | python3 -c "import json,sys; d=json.load(sys.stdin); print('has context:', d['context'] is not None); print('biomarker keys:', list((d['context'] or {}).get('biomarkers', {}).keys()))"
kill $SERVER_PID
rm ./health_context.json
```

Expected output:
```
has context: True
biomarker keys: ['Hemoglobin']
```

- [ ] **Step 4: Verify with malformed context file**

```bash
echo "not json {" > ./health_context.json

python3 scripts/serve.py --csv health_data.csv --no-open --port 8767 &
SERVER_PID=$!
sleep 0.5
curl -s http://127.0.0.1:8767/api/data | python3 -c "import json,sys; d=json.load(sys.stdin); print('context:', d['context'])"
kill $SERVER_PID
rm ./health_context.json
```

Expected output: `context: None` (and the server printed a warning about the JSON decode error).

- [ ] **Step 5: Commit**

```bash
git add scripts/serve.py
git commit -m "serve.py: include context JSON in /api/data payload

Reads health_context.json from the CSV's directory on every request.
Missing or malformed file yields context: null plus a warning log.
No new endpoint, no new CLI flag."
```

---

## Task 3: Update `SKILL.md` with the context JSON workflow

**Files:**
- Modify: `SKILL.md`

**Goal:** SKILL.md's pipeline diagram and step-by-step now cover writing `health_context.json`.

- [ ] **Step 1: Update the workflow diagram**

Find the code block that begins with `source(s) ──► agent normalizes`. Replace it with:

```
source(s) ──► agent normalizes ──► scripts/append_to_csv.py ──► health_data.csv
                               ╰─► agent writes ────────────► health_context.json ─┐
                                                                                   ▼
                                                                 scripts/serve.py ──► dashboard
```

- [ ] **Step 2: Insert a new step 4 before "Launch the dashboard"**

Renumber the current "### 4. Launch the dashboard" to "### 5. Launch the dashboard" and insert the following new section above it:

```markdown
### 4. Write the context JSON (optional but recommended)

Alongside the CSV, write `health_context.json` in the same directory. This is what the dashboard's priorities panel and detail modal display per test. Agents regenerate it whenever new rows land.

Shape:

```json
{
  "biomarkers": {
    "Hemoglobin": {
      "description": "What this biomarker measures, 1–3 sentences.",
      "high": "Common causes of elevated values.",
      "low":  "Common causes of depressed values.",
      "suggestions": [
        "Actionable, lifestyle-first bullet.",
        "Another bullet."
      ]
    }
  },
  "recommendations": {
    "Insulin": {
      "severity": "attention",
      "headline": "One-line summary tied to this user's actual values.",
      "detail":   "1–3 sentences citing specific readings and trends.",
      "actions": [
        "Concrete step 1.",
        "Concrete step 2."
      ]
    }
  }
}
```

Rules:

- **Single language.** Write in whichever language suits the user's data and preference. There is no bilingual nesting.
- **Keyed by canonical test name** — exactly the `test_name` values used in `health_data.csv`.
- **Both top-level keys are optional.** Omit `biomarkers` or `recommendations` entirely if you have nothing for them.
- **Only include tests the user actually has.** No point describing Hemoglobin if it's not in the CSV.
- **`severity`** is one of `"attention"` (flagged / act now), `"watch"` (in range but drifting / part of a pattern), or `"info"` (context, likely benign).
- **Keep it concise.** This content is read by a human; verbose writing costs tokens every extraction and makes the dashboard harder to scan.
- The file is **optional** — if it's missing, the dashboard hides the priorities panel and shows "no reference notes yet" in the detail modal. Writing it is strongly recommended.
```

- [ ] **Step 3: Update the "Files in this skill" section**

Remove references to `biomarkers.js`, `biomarkers.ru.js`, `recommendations.js`, `recommendations.ru.js` if they appear in the file listing. Update the `assets/` bullet to:

```markdown
- `assets/index.html`, `assets/app.js`, `assets/i18n.js`, `assets/styles.css` — the dashboard frontend (Arrow + Chart.js, loaded from CDN)
```

- [ ] **Step 4: Verify the rendered Markdown**

```bash
grep -n "health_context.json" SKILL.md | head
grep -n "biomarkers.js\|biomarkers.ru.js\|recommendations.js\|recommendations.ru.js" SKILL.md
```

Expected: first grep has matches; second grep prints nothing.

- [ ] **Step 5: Commit**

```bash
git add SKILL.md
git commit -m "SKILL.md: document health_context.json workflow

Agents now write a single-language JSON alongside the CSV containing
biomarker reference notes and personalized recommendations. The file
is optional; the dashboard degrades gracefully when it's absent."
```

---

## Task 4: Convert `i18n.js` to ESM

**Files:**
- Modify: `assets/i18n.js` — replace entire contents

**Goal:** Named exports replace the three current globals. No string content added or dropped.

- [ ] **Step 1: Replace `assets/i18n.js` with the ESM version**

Preserve every key from the current file verbatim (including function-valued entries like `detail_no_info(name)` and `detail_reading_n(n)`). Only delivery changes:

```js
// UI string translations, canonical test-name and category labels.
// Fallback: if a key is missing in the chosen language, English is used by call sites.

export const strings = {
  en: {
    // …every key from the current window.I18N.en, copied verbatim,
    // including function-valued keys like detail_no_info and detail_reading_n…
  },
  ru: {
    // …every key from the current window.I18N.ru, copied verbatim…
  },
}

export const testNamesRu = {
  // …every entry from the current window.TEST_NAMES_RU, copied verbatim…
}

export const categoriesRu = {
  // …every entry from the current window.CATEGORIES_RU, copied verbatim…
}
```

Copy the three current globals into the three named exports. Function-valued entries stay as arrow functions.

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
  if (typeof m.strings.en.detail_no_info !== 'function') throw new Error('detail_no_info must be a function')
})
"
```

Expected: positive counts for all four; no errors.

- [ ] **Step 3: Commit**

```bash
git add assets/i18n.js
git commit -m "Convert i18n.js to ESM exports"
```

---

## Task 5: Minimal `index.html` + Arrow bootstrap in `app.js`

**Files:**
- Modify: `assets/index.html` — replace entire contents
- Modify: `assets/app.js` — replace entire contents (first slice)

**Goal:** Browser loads Arrow, fetches `/api/data`, populates `state.rows` and `state.context`, and renders a placeholder meta line.

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

- [ ] **Step 2: Replace `assets/app.js` with the bootstrap slice**

```js
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
```

- [ ] **Step 3: Boot and verify**

```bash
python3 scripts/serve.py --csv health_data.csv --no-open
```

Open `http://127.0.0.1:8765/` in a browser. Expected:
- Meta line reads something like `N readings · context none` (because no `health_context.json` exists yet).
- Browser Console: no errors.
- Ctrl+C to stop.

Now create a tiny context file and reload:

```bash
cat > health_context.json <<'EOF'
{
  "biomarkers": { "Hemoglobin": { "description": "t", "suggestions": [] } },
  "recommendations": {}
}
EOF
python3 scripts/serve.py --csv health_data.csv --no-open
```

Reload the browser: meta line says `... · context loaded`. Ctrl+C, then `rm health_context.json`.

- [ ] **Step 4: Commit**

```bash
git add assets/index.html assets/app.js
git commit -m "Arrow bootstrap: minimal shell, fetch rows + context"
```

---

## Task 6: Header, language switch, tabs, sources

**Files:**
- Modify: `assets/app.js` — append components; replace `App()` body

**Goal:** Masthead, folio, tagline, EN/RU buttons, tab bar, and the `<details>` source list all render and behave.

- [ ] **Step 1: Add components above the current `const App = ...` definition**

Insert into `app.js`:

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

- [ ] **Step 3: Boot and verify**

```bash
python3 scripts/serve.py --csv health_data.csv --no-open
```

Open the browser. Expected:
- Masthead renders title, folio, tagline, ornament, meta line.
- EN/RU switch flips all chrome strings.
- Tabs render, clicking changes `state.activeTab` (visible effect: placeholder section still shows, but tabs' active class updates).
- Sources `<details>` expands, lists files with date ranges and reading counts.
- Clicking a source → tab changes to table (placeholder).
- Console: no errors.

Ctrl+C.

- [ ] **Step 4: Commit**

```bash
git add assets/app.js
git commit -m "Arrow: header, language switch, tabs, sources"
```

---

## Task 7: Summary panel (priorities + latest-readings grid)

**Files:**
- Modify: `assets/app.js` — append components; update `App` to render summary panel when active

**Goal:** At-a-glance tab. Priorities section renders from `state.context.recommendations` (hidden when empty or missing). Latest-readings grid renders one card per test. Clicking a card sets `state.detail` (wired to modal in Task 10).

- [ ] **Step 1: Add helpers and components**

Append to `app.js`:

```js
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
```

- [ ] **Step 2: Update `App()`**

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

Without `health_context.json`:
```bash
python3 scripts/serve.py --csv health_data.csv --no-open
```

Expected:
- No priorities section (graceful hide).
- Latest-readings grid renders, one card per test.
- Flag badges appear on flagged cards.
- Cards click (no visible effect yet — modal arrives in Task 10).
- Console: no errors.

Now add a context file with one recommendation and reload:

```bash
cat > health_context.json <<'EOF'
{
  "biomarkers": {},
  "recommendations": {
    "Hemoglobin": {
      "severity": "watch",
      "headline": "Sample priority",
      "detail": "Renders only to verify the panel shows when context has recommendations.",
      "actions": ["Action one", "Action two"]
    }
  }
}
EOF
```

Reload the browser — priorities section now appears with one card for Hemoglobin (only if Hemoglobin is actually in the CSV; pick any test name you know exists). Ctrl+C, `rm health_context.json`.

- [ ] **Step 4: Commit**

```bash
git add assets/app.js
git commit -m "Arrow: summary panel — priorities (from context) and latest-readings grid"
```

---

## Task 8: Charts panel

**Files:**
- Modify: `assets/app.js` — append components; update `App` charts slot

**Goal:** Over-time tab renders one Chart.js line chart per test with reference-range band and category filter.

- [ ] **Step 1: Add helpers, category filter, panel component, and the chart watcher**

Append to `app.js`:

```js
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
  const lang = state.lang
  void rows; void cat; void lang   // silence unused-var tools; reads are intentional

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
```

- [ ] **Step 2: Update `App()` charts slot**

Replace the charts placeholder:

```js
${() => state.activeTab === 'charts' ? ChartsPanel() : ''}
```

- [ ] **Step 3: Boot and verify**

```bash
python3 scripts/serve.py --csv health_data.csv --no-open
```

Switch to **Over time**. Expected:
- One chart per test, X-axis formatted as time, Y-axis numeric.
- Reference range is a band between the two dashed lines (sage tint from `--band`); when only one bound exists, only that dashed line shows.
- Category chips at top: clicking narrows the list; "All" restores.
- Tooltip shows value + unit + flag + source file.
- Leaving and returning to the tab recreates charts without errors.
- Console: no errors.

Ctrl+C.

- [ ] **Step 4: Commit**

```bash
git add assets/app.js
git commit -m "Arrow: charts panel with Chart.js lifecycle via watch()"
```

---

## Task 9: Table panel (search + sort)

**Files:**
- Modify: `assets/app.js` — append component; update `App` table slot

- [ ] **Step 1: Add the table component**

Append:

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

- [ ] **Step 2: Update `App()` table slot**

```js
${() => state.activeTab === 'table' ? TablePanel() : ''}
```

- [ ] **Step 3: Boot and verify**

Expected:
- Switch to **The record** — every CSV row renders.
- Search input filters case-insensitively.
- Column header clicks toggle sort; direction flips on second click.
- Clicking a source in the `<details>` (Task 6) switches to this tab with the search populated.
- Language switch flips column headers and test/category cell labels.
- Console: no errors.

- [ ] **Step 4: Commit**

```bash
git add assets/app.js
git commit -m "Arrow: table panel with search and sortable columns"
```

---

## Task 10: Detail modal

**Files:**
- Modify: `assets/app.js` — append component; include modal in `App`

**Goal:** Clicking a card opens a `<dialog>` with the per-test history and — when the context JSON has them — biomarker info and personalized recommendation. Otherwise shows "no reference notes yet."

- [ ] **Step 1: Add the modal component and the open/close watcher**

Append:

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

- [ ] **Step 2: Include `DetailModal` in `App()` (and add colophon)**

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

- [ ] **Step 3: Boot and verify (without context)**

```bash
python3 scripts/serve.py --csv health_data.csv --no-open
```

- Click any summary card → modal opens.
- Header: category, test name, latest value + unit, flag, date, reference range.
- No "recommendation" block.
- About/interpret/suggest sections are replaced with "no reference notes yet" using the current language's formatter.
- History table populated.
- ✕, Escape, and clicking the backdrop all close the modal.
- "View in the record" closes the modal and switches to the table tab with the search pre-populated.

Ctrl+C.

- [ ] **Step 4: Boot and verify (with context)**

Create a context file with both keys:

```bash
cat > health_context.json <<'EOF'
{
  "biomarkers": {
    "Hemoglobin": {
      "description": "Oxygen-carrying protein.",
      "high": "Dehydration, smoking.",
      "low":  "Anemia.",
      "suggestions": ["Iron-rich food.", "Check ferritin and B12."]
    }
  },
  "recommendations": {
    "Hemoglobin": {
      "severity": "watch",
      "headline": "Trending near the lower edge",
      "detail":   "Dropped from X to Y over Z months.",
      "actions":  ["Recheck in 3 months.", "Add dietary iron."]
    }
  }
}
EOF

python3 scripts/serve.py --csv health_data.csv --no-open
```

- Reload the browser.
- Click a Hemoglobin summary card (replace with any test name present in both the CSV and your context file).
- Modal now shows the recommendation block with severity color, headline, detail, actions.
- Modal shows About / What changes it / Ways to move the needle sections.
- Language flip changes chrome strings; the biomarker and recommendation prose stays in whatever language the JSON used.

Ctrl+C, `rm health_context.json`.

- [ ] **Step 5: Commit**

```bash
git add assets/app.js
git commit -m "Arrow: detail modal with per-test history and context-backed content"
```

---

## Task 11: End-to-end verification

**Files:** none modified unless a regression is found.

- [ ] **Step 1: Start the server**

```bash
python3 scripts/serve.py --csv health_data.csv
```

Walk the spec verification list in the browser:

1. Dashboard loads with no console errors even when `health_context.json` is absent.
2. Add a small `health_context.json` next to the CSV → reload → priorities panel appears, detail modal shows description / recommendations for keyed tests.
3. **Summary tab** — priorities render (when present), one card per test, flag badges colored.
4. **Charts tab** — one chart per test, reference-range band visible, category chips narrow the set.
5. **Table tab** — search filters; column clicks toggle sort.
6. **Language switch** — EN ⇄ RU flips UI chrome (titles, tabs, columns, ornaments, tooltip labels, test and category names). Biomarker and recommendation prose stay in their original language (expected).
7. **Detail modal** — clicking a card opens; close button, Escape key, backdrop click all close.
8. **Sources filter** — clicking a file filters the table.
9. **Malformed context** — break `health_context.json` (`echo "bad json" > health_context.json`), reload: dashboard still works, priorities hidden, detail modal falls back to "no reference notes yet." Fix or delete the file afterward.
10. **Reload after append** — run `append_to_csv.py` with a tiny additional reading, reload browser: new row appears in the table, chart updates for that test.

- [ ] **Step 2: Confirm old files are gone**

```bash
ls assets/biomarkers.js assets/biomarkers.ru.js assets/recommendations.js assets/recommendations.ru.js 2>&1 | grep -c "No such file"
```
Expected: `4`.

- [ ] **Step 3: Confirm no `window.*` globals remain**

```bash
grep -rn "window\.\(I18N\|TEST_NAMES_RU\|CATEGORIES_RU\|BIOMARKERS\|RECOMMENDATIONS\)" assets/
```
Expected: no output.

- [ ] **Step 4: If any fixes were needed, commit each separately**

```bash
git add <paths>
git commit -m "Fix: <specific regression>"
```

---

## Out of scope

- SSR / hydration.
- TypeScript or any build step.
- Unit test infrastructure.
- Automated migration of the pre-existing `recommendations.js` content into `health_context.json`. Users who want their old content back regenerate it via the agent.
- Changes to `scripts/append_to_csv.py` or the CSV schema.

## Done criteria

- All eleven tasks checked.
- Four bundled content files deleted.
- `scripts/serve.py` serves `context` in `/api/data`.
- `SKILL.md` documents the context JSON workflow.
- No `window.*` globals in `assets/`.
- Verification list in Task 11 Step 1 passes.
- Dashboard looks indistinguishable from the pre-migration version when a context JSON matching the old content is present.
