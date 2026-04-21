# graph-health-skill

An [agent skill](https://agentskills.io) that ingests medical lab data from **any** source — PDFs, xlsx/csv exports (WellnessFX, Function Health, etc.), JSON, pasted text, screenshots — and turns it into a longitudinal CSV plus a local dashboard with trend charts, reference ranges, and personalized notes.

Works with [Claude Code](https://docs.claude.com/en/docs/claude-code), [OpenCode](https://opencode.ai), [Codex](https://github.com/openai/codex), and every other agent-skills-compatible agent.

Your agent does the parsing. Two small stdlib-Python scripts handle CSV writes and serve the dashboard.

## What the dashboard gives you

- **At a glance** — one card per test with latest value, change vs. previous draw, flag (H/L/N), and the source file each number came from
- **What deserves your attention** — priorities sorted by severity (*attention* / *watch* / *info*), each with a headline, 1–3 sentences referencing your actual numbers, and concrete lifestyle-first actions
- **Over time** — one time-series chart per test with a shaded reference-range band; every data point cites its source file in the tooltip
- **The record** — the raw CSV as a filterable, sortable table
- **Detail view** — click any card for your personalized note, a description of the biomarker, what high/low means, lifestyle suggestions, and your full reading history

All educational content carries a **"not medical advice"** disclaimer.

Dark-cream paper aesthetic with *Instrument Serif* + *Spectral*. Switchable EN/RU UI.

## Install

```bash
npx skills add tilek/graph-health-skill
```

The [`npx skills`](https://github.com/vercel-labs/skills) CLI detects whatever agents you have installed (Claude Code, OpenCode, Codex, …) and wires the skill into each. Use `-g` for a user-wide install, `-a <agent>` to target one agent, `-y` to skip prompts.

## Update

```bash
npx skills update graph-health-skill
```

Your `health_data.csv` lives in your own workspace — updates only touch the skill's own files. If a pull changes `recommendations.js`, ask your agent to regenerate the personalized notes against your current readings.

## Where your data lives

Pick a folder for your health data — `~/health`, `~/Documents/labs`, anywhere — and run the agent from there:

```bash
mkdir -p ~/health && cd ~/health
# ask the agent to ingest your lab reports from here
```

The skill writes `health_data.csv` in the current working directory by default. **It never writes into its own install tree.** Back up or move your workspace without touching the skill.

## Typical session

```
you:     (in ~/health) Ingest ~/Downloads/2026-04-02 lab.pdf
agent:   Wrote 24 rows to ~/health/health_data.csv.
         Six are out of range: Vitamin D (73.9 nmol/L), RBC (5.81), …
         Dashboard: http://127.0.0.1:8765/

you:     Also add ~/Downloads/wellnessfx_export.xlsx — decade of history
agent:   Normalized 77 markers, unit-converted, deduped, appended 427 rows.
         496 readings total. Refresh the browser.
```

### Supported sources

- **PDF** — `Read` tool
- **xlsx / xls** — pandas + openpyxl (typically via `uv run --with pandas --with openpyxl`)
- **CSV / TSV** — `Read` tool or pandas
- **JSON** — flat arrays, nested shapes, or FHIR `Observation` resources
- **Plain text** — patient-portal pastes, OCR output
- **Photos / screenshots** — read directly; fails gracefully on low-resolution scans
- **Wearables** — Apple Health `export.xml`, Oura / Whoop CSVs

The skill normalizes test names across sources (*HGB* / *Hb* / *Гемоглобин* → `Hemoglobin`) and converts US units to SI when the CSV already holds SI entries, so one test charts as one continuous series.

## CSV schema

| column | type | notes |
|---|---|---|
| `date` | ISO date | collection / draw / report date |
| `test_name` | string | canonical clinical name (see [`references/test-names.md`](references/test-names.md)) |
| `value` | number | numeric, no unit |
| `unit` | string | `g/L`, `mmol/L`, `%`, etc. |
| `reference_low` | number or empty | lower bound |
| `reference_high` | number or empty | upper bound |
| `category` | string | `Complete Blood Count`, `Metabolic Panel`, `Lipid Panel`, `Liver Panel`, `Thyroid Panel`, `Vitamins & Minerals`, `Hormones`, `Urinalysis`, `Fatty Acids`, `Body Metrics`, `Other` |
| `flag` | `H` / `L` / `N` / empty | auto-computed |
| `source_file` | string | originating file |

The append script is idempotent — re-running on the same source is a no-op. Dedup key: `(date, test_name)`.

## Running the dashboard manually

```bash
cd ~/health
python3 path/to/graph-health-skill/scripts/serve.py --csv health_data.csv
```

Serves on port 8765 (or the next free), opens your browser, Ctrl+C to stop. Re-reads the CSV on every request — adding more readings just needs a refresh.

## File layout

```
graph-health-skill/
├── SKILL.md                  # agent instructions
├── scripts/
│   ├── append_to_csv.py      # idempotent CSV writer
│   └── serve.py              # stdlib HTTP server for the dashboard
├── assets/                   # dashboard frontend (Arrow + Chart.js, CDN-loaded)
│   ├── index.html, app.js, styles.css
│   └── i18n.js               # UI chrome strings
└── references/
    ├── extraction-guide.md   # per-format patterns, unit conversions
    └── test-names.md         # canonical names + aliases
```

## Privacy

Your `health_data.csv` lives in your workspace, **never** inside the skill install. Updates can't touch your data; pushing skill changes can't leak your readings. The dashboard runs on `127.0.0.1` and makes no network calls beyond loading Chart.js from a CDN on first page load.

## Dependencies

Skill scripts use only the Python 3.9+ stdlib. Frontend loads `chart.js` + `chartjs-adapter-date-fns` from jsDelivr once. Spreadsheet extraction prefers `uv run --with pandas --with openpyxl`; if `uv` is absent, `.xlsx` can be parsed as a ZIP of XML with the stdlib.

## Extending

- **Test alias or canonical name** → [`references/test-names.md`](references/test-names.md)
- **New source format** → [`references/extraction-guide.md`](references/extraction-guide.md)
- **Biomarker reference note** → [`assets/biomarkers.js`](assets/biomarkers.js) (and `.ru.js`)
- **Regenerating personalized recommendations** → ask your agent; they reference your actual values and should be rebuilt when new data lands

## License

MIT.
