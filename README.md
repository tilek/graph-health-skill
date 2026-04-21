# graph-health-skill

A [Claude Code](https://docs.claude.com/en/docs/claude-code) skill that ingests medical lab data from **any** source — PDF reports, xlsx / csv exports from platforms like WellnessFX or Function Health, JSON exports, plain text pasted from a patient portal, even screenshots of results — and turns it into a longitudinal CSV plus a local dashboard that plots every biomarker over time with reference ranges, provenance, and personalized notes.

Claude does the unstructured-data parsing. Two small Python scripts handle the deterministic parts: writing to a CSV and serving the dashboard.

## What the dashboard gives you

- **At a glance** — one card per test showing the latest value, change vs. the previous draw, a flag (H/L/N), and a provenance line citing the source file
- **What deserves your attention** — a priorities section at the top of the dashboard, auto-sorted by severity: *attention* (currently flagged), *watch* (in range but trending toward a threshold), *info* (noted for completeness). Each item includes a headline, a 1–3 sentence explanation that references your actual numbers, and concrete lifestyle-first actions
- **Over time** — one time-series chart per test with a shaded reference-range band. Every data point's tooltip cites the source file it came from
- **The record** — the raw CSV as a filterable table with sort + search
- **Sources index** — a collapsible disclosure in the header listing every ingested file with its date span and reading count; click any source to filter the record view to just that file
- **Detail view** — clicking any card opens a dialog with: your personalized note (if any), a general description of the biomarker, what high/low means, lifestyle suggestions, and your full per-date reading history with sources

All educational content carries a **"not medical advice"** disclaimer. Bring your results to your doctor for interpretation.

Visually the dashboard is set in *Instrument Serif* + *Spectral* on a warm paper palette with terracotta, sage, and ochre accents — an "apothecary's ledger" aesthetic rather than a clinical UI.

## Installing the skill

### Recommended: [`npx skills`](https://github.com/vercel-labs/skills) (Vercel Labs)

One command, works with Claude Code and 40+ other agents:

```bash
npx skills add -g -a claude-code tilek/graph-health-skill
```

- `-g` installs globally (user-level, available in every project)
- `-a claude-code` targets Claude Code specifically (drop it to install for every agent you have)
- Omit `-g` to install as a project-local skill under the current working directory

You can also pass the full URL (`https://github.com/tilek/graph-health-skill`) or a `git@…` SSH URL.

### Alternative: manual git clone

If you don't want `npx skills`, clone into the Claude Code skills directory yourself:

```bash
git clone https://github.com/tilek/graph-health-skill.git ~/.claude/skills/graph-health-skill
```

Or symlink a working copy:

```bash
ln -s "$PWD" ~/.claude/skills/graph-health-skill
```

Either way, the skill activates when Claude detects a health-data request (lab report, blood work, biomarker tracking, etc.).

## Where your data lives

The install path above (`~/.claude/skills/graph-health-skill`) is where the skill's *code* lives — SKILL.md, scripts, the dashboard frontend. **It is not where your CSV goes.**

Your `health_data.csv` lives in whatever directory you're working in when you ask Claude to ingest a report. The skill writes to `health_data.csv` in the current working directory by default. A common pattern:

```bash
mkdir -p ~/health
cd ~/health
# From inside this folder, ask Claude to ingest your lab reports.
# The skill creates ~/health/health_data.csv, and runs the dashboard
# serving that file — entirely separate from the skill install.
```

Pick any folder you like — `~/health`, `~/Documents/labs`, anywhere. The skill never writes into its own install directory, and you can move or back up your workspace without touching the skill.

## Updating the skill

### If you installed with `npx skills`

```bash
npx skills update graph-health-skill
```

Or update every skill at once with `npx skills update`.

### If you installed manually

```bash
cd ~/.claude/skills/graph-health-skill
git pull
```

Either way, your health data is in a completely separate location (your workspace — see [Where your data lives](#where-your-data-lives)), so an update only touches the skill's own files (SKILL.md, scripts, assets, references) and never touches your readings. The dashboard picks up changes on the next browser refresh; if `serve.py` itself was updated, restart it (Ctrl+C and rerun).

If a manual `git pull` reports local changes, you've tweaked a skill file (e.g. added entries to `biomarkers.js` or `references/test-names.md`). Stash them first (`git stash`), pull, then reapply (`git stash pop`) — or fork the repo if you're maintaining a significantly customized version.

After an update that changes `recommendations.js`, regenerate your personalized notes by asking Claude something like *"the skill was updated; regenerate my personalized recommendations from `health_data.csv`"*. Those notes reference your actual values, so they should be rebuilt whenever either the data or the skill's analysis logic changes.

## Using it — a typical session

```
you:     (in ~/health)
         I have my blood work at ~/Downloads/2026-04-02 lab.pdf. Ingest it.
Claude:  [reads the PDF, extracts 24 rows]
         Wrote 24 rows to ~/health/health_data.csv. Six are out of range:
         Vitamin D (73.9 nmol/L), RBC (5.81), ...
         Starting the dashboard at http://127.0.0.1:8765/.

you:     Also add ~/Downloads/wellnessfx_export.xlsx — it's a decade of history.
Claude:  [reads the xlsx, normalizes 77 markers, converts units to match
         existing CSV, dedupes, appends 427 rows]
         496 readings total now. Refresh your browser.
```

### Supported sources

- **PDF** — Claude reads via the `Read` tool (rendered text + layout)
- **xlsx / xls** — via `pandas` + `openpyxl`, typically invoked inline with `uv run --with pandas --with openpyxl`
- **CSV / TSV** — `Read` tool or `pandas`
- **JSON** — including FHIR `Observation` resources
- **Plain text** — pasted from a patient portal, OCR output, etc.
- **Photos / screenshots** — Claude reads images directly; fails gracefully on low-resolution scans
- **Wearables** — Apple Health `export.xml`, Oura / Whoop CSV exports (filtered to one reading per day)

The skill normalizes test names across sources ("HGB", "Hb", `Гемоглобин (HGB)` → `Hemoglobin`) and converts between US units (mg/dL, ng/dL, g/dL) and SI units (mmol/L, µmol/L, nmol/L, g/L) so the same test charts as a single continuous series even when the source labs use different conventions.

## CSV schema

`health_data.csv` has these columns, in this order:

| column | type | notes |
|---|---|---|
| `date` | ISO date (`YYYY-MM-DD`) | collection / draw / report date |
| `test_name` | string | canonical clinical name (see [`references/test-names.md`](references/test-names.md)) |
| `value` | number | numeric value, no unit |
| `unit` | string | `g/L`, `mmol/L`, `%`, etc. |
| `reference_low` | number or empty | lower bound of the normal range |
| `reference_high` | number or empty | upper bound of the normal range |
| `category` | string | `Complete Blood Count`, `Metabolic Panel`, `Lipid Panel`, `Liver Panel`, `Thyroid Panel`, `Vitamins & Minerals`, `Hormones`, `Urinalysis`, `Fatty Acids`, `Body Metrics`, `Other` |
| `flag` | `H` / `L` / `N` / empty | auto-computed by the append script from `value` + range |
| `source_file` | string | basename of the originating file |

The append script is idempotent: re-running on the same source is a no-op. Dedup key is `(date, test_name)`.

## Running the dashboard manually

From your workspace (where `health_data.csv` lives), point the skill's `serve.py` at it:

```bash
cd ~/health
python3 ~/.claude/skills/graph-health-skill/scripts/serve.py --csv health_data.csv
```

Starts an HTTP server on port 8765 (or the next free port), opens your browser, and serves the dashboard. Ctrl+C to stop. The server re-reads the CSV on every request, so adding more readings just needs a browser refresh.

## File layout (the skill's own files)

This is the tree inside the skill install directory. Your health data is *not* here — see [Where your data lives](#where-your-data-lives).

```
graph-health-skill/
├── SKILL.md                      # main skill instructions for Claude
├── README.md                     # this file
├── scripts/
│   ├── append_to_csv.py          # idempotent CSV writer with dedup + flag computation
│   └── serve.py                  # stdlib HTTP server for the dashboard
├── assets/
│   ├── index.html                # dashboard markup
│   ├── app.js                    # rendering, charts, provenance, priorities, modal
│   ├── styles.css                # the warm paper aesthetic
│   ├── biomarkers.js             # ~95 biomarker reference notes (what it is, high/low, suggestions)
│   ├── biomarkers.ru.js          # Russian translations of the above
│   ├── recommendations.js        # personalized notes — regenerated when new data lands
│   ├── recommendations.ru.js     # Russian translations of the above
│   └── i18n.js                   # UI strings + test-name / category translations (EN/RU)
└── references/
    ├── extraction-guide.md       # per-format extraction patterns and unit conversions
    └── test-names.md             # canonical names + aliases + category list
```

## Privacy

Your `health_data.csv` lives in your own workspace directory — **never** inside the skill install. That separation is the primary privacy mechanism: updates to the skill can't accidentally touch your data, and pushing changes to your fork of the skill can't accidentally leak your readings.

The skill's own `.gitignore` excludes `health_data.csv` as a development safety net (so if you happen to edit the skill from within a workspace that also holds a CSV, it won't get committed), but the main point is that your CSV simply isn't in the same tree.

The dashboard runs entirely on `127.0.0.1` and makes no network calls beyond fetching Chart.js + date-fns from a CDN on first load.

## Dependencies

The skill's Python scripts use only the Python 3 standard library (3.9+). The frontend loads `chart.js` and `chartjs-adapter-date-fns` from jsDelivr on first load; everything else is served locally. No `pip install` needed to run the dashboard.

Extraction from spreadsheets uses `pandas` + `openpyxl`. The preferred invocation is `uv run --with pandas --with openpyxl python3 -c "..."` — inline dependencies, no global install. If `uv` isn't available and `pip install` is blocked, `.xlsx` can also be parsed directly as a ZIP of XML files with the stdlib `zipfile` + `xml.etree` modules.

## Extending

- **New biomarker alias or canonical name** → add to [`references/test-names.md`](references/test-names.md)
- **New source format** → add a section to [`references/extraction-guide.md`](references/extraction-guide.md)
- **New biomarker reference note** → add an entry to [`assets/biomarkers.js`](assets/biomarkers.js) keyed by the canonical test name
- **Regenerating personalized recommendations** → ask Claude; the notes in [`assets/recommendations.js`](assets/recommendations.js) reference specific values and should be refreshed whenever new data lands

## License

MIT.
