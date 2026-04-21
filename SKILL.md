---
name: graph-health-skill
description: Extract numerical lab results from any health-data source — PDF reports, Excel/CSV exports (Quest, WellnessFX, Supabase), JSON dumps, wearable-device exports, or plain text — into a longitudinal CSV, then launch a local dashboard (Python HTTP server + Chart.js frontend) that plots every metric over time with its reference range. Use whenever the user has blood work, a check-up report, a spreadsheet of lab values, a health-platform export, or asks to track biomarkers or visualize health data — even if they only say "here is my blood test", "ingest this xlsx", or "plot my cholesterol history" without naming this skill.
license: MIT
metadata:
  version: "1.1"
---

# Graph Health Skill

Turn any health-data source — medical PDFs, lab spreadsheets, platform exports — into a longitudinal CSV dataset and visualize each metric over time in a local dashboard.

## When to use

The user has one or more sources of numerical health data and wants to:

- Extract the structured readings into a CSV
- Plot values over time with reference ranges
- Track biomarkers across visits

Typical sources include:

- Medical lab **PDFs** (Quest, LabCorp, AquaLab, clinic printouts, printed check-up reports)
- Lab-platform **spreadsheets / CSV exports** (WellnessFX, InsideTracker, Function Health, Supabase dumps, a hand-maintained xlsx)
- **JSON exports** from consumer health apps or EHR APIs
- **Plain text** someone pasted from a patient portal
- **Photos / screenshots** of reports (needs OCR — see caveats below)

The skill is format-agnostic: the only thing that matters is that the final rows match the CSV schema below.

## The workflow in one picture

```
source(s) ──► agent normalizes ──► scripts/append_to_csv.py ──► health_data.csv
                               ╰─► agent writes ────────────► health_context.json ─┐
                                                                                   ▼
                                                                 scripts/serve.py ──► dashboard
```

The agent (Claude Code, OpenCode, Codex, etc. — anything that speaks the agent-skills spec) does the format-specific parsing and unit normalization. That's the part that needs judgment. The two Python scripts handle the deterministic parts: idempotent CSV updates and serving the dashboard. The frontend (`assets/index.html`, `assets/app.js`) reads the CSV via an HTTP endpoint and renders it with Chart.js.

## Step-by-step

### 1. Locate the sources and the target CSV

Ask the user for the source path(s). If they pass a directory, list candidate files in it and confirm which to process. Common patterns: `*.pdf`, `*.xlsx`, `*.csv`, `*.json`, `*.txt`.

Decide where the CSV lives. Default: `health_data.csv` in the **user's current working directory** — which is their personal health workspace (e.g. `~/health/`), *not* this skill's install directory. The skill never writes data into its own install tree. If a CSV already exists in the user's workspace, reuse it so new readings append to the existing history instead of starting fresh — the whole point of this skill is that the CSV grows across visits and sources.

If the current working directory is the skill's own directory (i.e. you're being invoked from inside the skill source — usually during skill development), confirm with the user where they actually want the CSV to live before writing.

### 2. Extract structured rows from each source

Use the tool appropriate to the format:

- **PDF** — `Read` tool. The agent reads the rendered text + layout.
- **xlsx / xls** — pandas via `uv run --with pandas --with openpyxl python3 ...` (inline-deps; no global install). `pd.read_excel(path, sheet_name=None)` to inspect all sheets.
- **csv / tsv** — `Read` tool for small files, or pandas for big ones.
- **json** — `Read` tool; shape varies per source, so understand the schema before mapping.
- **Photo / screenshot / scanned PDF** — The agent can read images directly with `Read`. If the image is low-resolution or OCR-quality is poor, tell the user rather than guess.

For each source, extract these per-row fields:

- **Date** — the collection / draw / result date shown on the source, not today's date. Use ISO format `YYYY-MM-DD`.
- **Each numerical reading** — name, value, unit, reference range (low / high), and category.

Normalize test names so the same test across different sources charts as a single series. "Hemoglobin", "HGB", `% Neutrophil`, and `Нейтрофилы (Neu%)` should all map to the canonical names in [references/test-names.md](references/test-names.md). Prefer the full, widely-used clinical name so future extractions stay consistent; add new canonical names to that file if you find a test that isn't listed.

**Unit conversions matter.** When the same test exists in the CSV in a different unit than your incoming source, convert the incoming value (and its reference range) to match the existing CSV. SI-unit labs (Europe, Russia/CIS, most of Asia) report in mmol/L, µmol/L, g/L; US labs report in mg/dL, g/dL, ng/dL. Mixing these would fake a 10×–20× swing in the trend chart. See the conversion table in [references/extraction-guide.md](references/extraction-guide.md). When you convert, tell the user what you converted.

If a reference range is not given by the source, leave `reference_low` and `reference_high` empty. Do not invent one.

For format-specific walk-throughs (PDF layouts, xlsx schemas, common platform exports, OCR'd scans), see [references/extraction-guide.md](references/extraction-guide.md).

### 3. Hand the rows to the CSV script

Write the extracted rows as a JSON array to a temp file, then call the append script:

```bash
python3 scripts/append_to_csv.py --csv health_data.csv --input /tmp/extracted.json
```

The script:

- Creates the CSV with a header if it doesn't exist
- Deduplicates by `(date, test_name)` — a re-extracted row overwrites the old one, so you can safely re-run on the same PDF
- Computes the `flag` column (`H`/`L`/`N`) from the value and the reference range when not supplied
- Sorts chronologically

It will print a short summary (`Wrote N rows, M new, K updated`). Read that output and relay a one-line summary to the user.

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

### 5. Launch the dashboard

```bash
python3 scripts/serve.py --csv health_data.csv
```

This starts an HTTP server on port 8765 (or the next free port), opens the user's browser at `http://127.0.0.1:<port>/`, and serves:

- A summary grid — one card per test, showing the latest value, change vs. previous, and flag
- A trends section — one time-series chart per test with a shaded reference-range band
- A data table — the raw CSV with filter and sort

The server is a blocking process. Tell the user to press Ctrl+C in the terminal when they're done.

If the user is already running the dashboard in another terminal and only wants to refresh the data, they can just reload the browser tab — the server reads the CSV on every request.

## CSV schema

Columns, in this exact order:

| column | type | notes |
|---|---|---|
| `date` | ISO date (`YYYY-MM-DD`) | collection / report date |
| `test_name` | string | canonical clinical name (see references/test-names.md) |
| `value` | number | numeric value, no unit inside |
| `unit` | string | `g/dL`, `mmol/L`, `%`, etc. |
| `reference_low` | number or empty | lower bound of the normal range |
| `reference_high` | number or empty | upper bound of the normal range |
| `category` | string | one of the categories listed in references/test-names.md |
| `flag` | `H` / `L` / `N` / empty | filled in by the script when missing |
| `source_file` | string | basename of the originating file (pdf, xlsx, csv, json, txt, png, etc.) |

## Example extraction input (JSON)

This is what you pass on `--input` after reading a single source:

```json
[
  {
    "date": "2026-03-14",
    "test_name": "Hemoglobin",
    "value": 14.2,
    "unit": "g/dL",
    "reference_low": 13.5,
    "reference_high": 17.5,
    "category": "Complete Blood Count",
    "source_file": "smith_cbc_march.pdf"
  },
  {
    "date": "2026-03-14",
    "test_name": "LDL Cholesterol",
    "value": 142,
    "unit": "mg/dL",
    "reference_low": "",
    "reference_high": 100,
    "category": "Lipid Panel",
    "source_file": "smith_cbc_march.pdf"
  }
]
```

The script will fill in `flag = "N"` for the first row and `flag = "H"` for the second.

## Edge cases to watch for

- **Unit mismatches across sources.** Different labs / platforms report the same analyte in different units (glucose as mg/dL vs. mmol/L, vitamin D as ng/mL vs. nmol/L, cortisol as µg/dL vs. nmol/L). Before appending, check the existing CSV for prior entries of that test. If the unit differs, convert the new value and its reference range to match the existing one, and note the conversion to the user. Charting a single test in two units would fake a huge jump in the trend.
- **Non-numeric values.** Tests reported as `Negative`, `Positive`, `Trace`, `High`, `Moderate`, `не обнаружено`, or `<0.01` are not suited for a numeric time-series. Skip them and list them for the user at the end so they know nothing silently disappeared. (For `<0.01`-style values, you can also record the value as `0.01` and mention that it was below the detection limit — the user's call.)
- **Same test twice on the same day.** Usually a rerun. Keep the later reading and mention it. The dedup key is `(date, test_name)`, so you won't get two rows, but you'll want to call out that a rerun happened.
- **Unreadable sources.** If the `Read` tool returns almost no text from a PDF (a scan without OCR), from an image (too low-resolution), or from an obscure binary format, tell the user rather than guessing. It's much better to surface the problem than to invent numbers.
- **Missing dates.** If a source has no date, ask the user before falling back to today's date. The whole time-series is meaningless with wrong dates. For spreadsheets where each row has its own date column, use the per-row date.
- **Multi-page / multi-sheet sources with a single date.** Apply the one source date to every extracted row, even if pages / sheets were processed separately.
- **Reports in other languages.** AquaLab, EU labs, Japanese / Korean labs, etc. Translate the test name to the canonical English name in `test-names.md`. The report date is still ISO. If you encounter a new language variant of a test, add it to the aliases column.

## Dependencies

The skill's own scripts use only the Python 3 standard library. The frontend loads Chart.js and the chartjs-adapter-date-fns from public CDNs, so the dashboard needs an internet connection on first load. (Everything else is served locally.) No `pip install` is needed for the skill itself.

When extracting from spreadsheets, pandas / openpyxl are the easiest path. Prefer `uv run --with pandas --with openpyxl python3 -c "..."` (inline-deps, no global install) when available. If the user's environment has neither `uv` nor these packages and `pip install` is blocked, you can fall back to parsing the xlsx's XML directly with the stdlib `zipfile` + `xml.etree` modules — an xlsx is a ZIP of XML files.

Python 3.9+ is assumed.

## Files in this skill

- `SKILL.md` — this file
- `scripts/append_to_csv.py` — idempotent CSV writer with dedup, flag computation, and sorting
- `scripts/serve.py` — standard-library HTTP server that serves `assets/` and exposes `/api/data` from the CSV
- `assets/index.html`, `assets/app.js`, `assets/i18n.js`, `assets/styles.css` — the dashboard frontend (Arrow + Chart.js, loaded from CDN)
- `references/extraction-guide.md` — worked examples for extracting from common report layouts
- `references/test-names.md` — canonical test names and category list
