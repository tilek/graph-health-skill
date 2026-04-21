# Extraction guide

Health data arrives in many shapes — PDFs from labs, xlsx exports from platforms like WellnessFX or Function Health, CSVs people pasted together by hand, JSON dumps from EHR APIs, screenshots of a patient-portal page. This guide covers the patterns for each, and then drills into common report-layout details.

The overall principle: **read whatever format you're given, convert it into rows that match the CSV schema**. The extractor (you) is the flexible part; the append script, the server, and the frontend all run off that one CSV shape.

## The target row

Every row you produce needs to populate the CSV columns:

```json
{
  "date": "2026-03-14",
  "test_name": "Hemoglobin",
  "value": 14.2,
  "unit": "g/dL",
  "reference_low": 13.5,
  "reference_high": 17.5,
  "category": "Complete Blood Count",
  "source_file": "smith_march.pdf"
}
```

`flag` is optional — the script computes it. `value`, `reference_low`, and `reference_high` must be numeric (not strings). If a reference range is absent, use empty strings for `reference_low` and `reference_high`.

## Reading the source

Pick the right tool for the format. The key move with any format is the same: **inspect the structure before mapping fields** — schemas vary wildly between platforms.

### PDF lab reports

Use the `Read` tool on the PDF. The agent gets both the rendered text and the layout. Works great for most commercial-lab printouts (Quest, LabCorp, AquaLab, clinic reports). Jump to the layout-specific sections below (Tabular, Two-column, etc.) for the actual extraction patterns.

### xlsx / xls spreadsheets

Read with pandas. The ergonomic command in this skill's environment:

```bash
uv run --with pandas --with openpyxl python3 -c '
import pandas as pd
for name, df in pd.read_excel("path/to/file.xlsx", sheet_name=None).items():
    print(f"--- {name} ({len(df)} rows) ---")
    print("Columns:", list(df.columns))
    print(df.head(10).to_string())
'
```

`uv run --with ...` installs pandas + openpyxl into a throwaway venv — no global pollution, no `pip install`.

Then map each row to a CSV row. Most platform exports already have the shape you want — look for columns like:

| Platform column | CSV field |
|---|---|
| `draw_date`, `collection_date`, `date`, `test_date` | `date` |
| `marker_name`, `test`, `analyte`, `biomarker`, `name` | `test_name` (normalize!) |
| `marker_value`, `result`, `value`, `reading` | `value` |
| `units`, `unit` | `unit` |
| `reference_min` + `reference_max`, or a single `reference_range` string | `reference_low` / `reference_high` |

If you only get a `reference_range` string like `"3.3-6.2"` or `"<2.7"`, parse it (see "Finding the reference range" below).

If the file has multiple sheets, inspect them all first — some exports put a legend or patient info on the first sheet and the actual results on the second.

**Deduplicate by `(date, test_name)`** before emitting — the append script dedupes on the same key, but picking the right duplicate is your call (usually the last / most complete one).

### CSV / TSV

Two paths depending on size:

- Small (<100 rows): use `Read` to see the whole file.
- Large: pandas (`pd.read_csv`).

Same column-mapping logic as xlsx. Watch the delimiter (`,` vs `;` vs `\t`) — European locales sometimes use `;`.

### JSON exports

`Read` the file. The shape varies per source — typical patterns:

1. A flat list of result objects:  
   `[{ "date": "...", "name": "...", "value": ... }, ...]`
2. A nested shape grouped by date or panel:  
   `{"reports": [{"date": "...", "results": [{...}, {...}]}]}`
3. FHIR `Observation` resources (if you're reading from a healthcare API): each `Observation` has `effectiveDateTime`, `code.coding[0].display`, `valueQuantity.value`, `valueQuantity.unit`, and `referenceRange`.

Map the fields by hand. If the JSON is huge and the schema is unfamiliar, sample a few entries first to understand the shape.

### Plain text

Sometimes the user pastes a block of text from a patient portal or a legacy printout. Treat it like a PDF — look for dates and test/value/unit/range patterns. The "Two-column / key: value layout" section below is the closest parsing guide.

### Images / screenshots / scanned PDFs

The agent can read images directly via `Read`. Works well for clean screenshots of a portal page. Fails on low-resolution photos, lots of glare, or pages where the text is tilted. If you see `Read` returning garbled output or you're uncertain about any value, tell the user — don't guess.

Scanned PDFs (PDF containing only an image, no text layer) behave like images. Same caveat.

### Wearables and consumer health apps

Apple Health, Oura, Whoop, and similar export health metrics (weight, BMI, resting HR, VO₂ max, HRV, sleep stats). These go in the `Body Metrics` category in this skill. Formats are usually xml (Apple Health) or csv.

Apple Health exports an `export.xml` that's verbose — filter by `type` (e.g., `HKQuantityTypeIdentifierBodyMass`) and pull `startDate` + `value` + `unit`. You'll typically get hundreds or thousands of entries; consider downsampling to one reading per day (e.g., the daily mean or the morning reading) before appending, or the dashboard will be dominated by a single metric's noise.

### Anything else

Unknown source format? Spend a minute understanding it before writing mapping code. The CSV schema is narrow and explicit — as long as you can produce rows that match it, the downstream pipeline doesn't care where they came from.

## Finding the date

Priority order:

1. A "Collection Date" or "Specimen Collected" line — this is the correct date. Use it.
2. A "Report Date" or "Result Date" — acceptable fallback.
3. Page header with a date range — if a single date is printed, use it; otherwise ask the user.
4. Last resort: ask the user.

**Never use today's date.** The whole time-series is meaningless with wrong dates.

Normalize to `YYYY-MM-DD`. Examples:

- `March 14, 2026` → `2026-03-14`
- `14/03/2026` → watch for ambiguity (US vs. EU format). If the lab is US, use MM/DD/YYYY; if EU, DD/MM/YYYY. When in doubt, look for unambiguous cases elsewhere on the report (e.g., `14/17/2026` can't be MM/DD, confirming DD/MM/YYYY).
- `2026年3月14日` → `2026-03-14`

## Finding the reference range

Reference ranges appear in a few common formats:

| Printed format | `reference_low` | `reference_high` |
|---|---|---|
| `13.5 - 17.5` | 13.5 | 17.5 |
| `13.5 – 17.5` (en-dash) | 13.5 | 17.5 |
| `< 100` | "" | 100 |
| `> 40` | 40 | "" |
| `≤ 5.7` | "" | 5.7 |
| `≥ 0.8` | 0.8 | "" |
| `Negative` (non-numeric) | skip the test |
| Range marked by sex (`Male: 13.5-17.5 / Female: 12.0-15.5`) | use the range for the patient's sex. If you don't know, ask. |

Some reports print a population-level range and the patient's actual value in adjacent columns. Others print one big table of "Results" and a separate "Reference Intervals" page — read both and match by test name.

## Common PDF / text layouts

These patterns apply when you're reading a rendered report — PDF, screenshot, or pasted text. Spreadsheet / JSON / API sources already have structure and don't need this section.

### Tabular (most US/EU commercial labs)

Rows in a table with columns like `Test | Result | Flag | Units | Reference Interval`. Straightforward — iterate the rows.

Watch for:

- Sub-headings within the table (`--- Complete Blood Count ---`) that aren't actual rows. Use them to set the `category` for the rows that follow until the next heading.
- A final "Notes" column spanning multiple lines — it can push actual values down; cross-check column alignment.
- Calculations reported with the result value (`Sodium 140 (142 avg)`): extract 140 only.

### Two-column / "key: value" layout (smaller clinics)

```
Hemoglobin ........ 14.2 g/dL  (13.5 - 17.5)
Hematocrit ........ 42 %       (41 - 50)
```

Parse the name on the left, the number + unit in the middle, the range in parentheses. The category usually appears as a section heading above the block.

### Multi-column compact layout

Some reports pack two or three tests per row to save paper. Go carefully and read rows left-to-right, not top-to-bottom. When in doubt, extract fewer rows correctly rather than more rows with mismatched values.

### OCR'd scans

If `Read` returns mostly gibberish (`| ||| 1.2 g/dL`) or mentions OCR confidence, stop. Tell the user the PDF is scanned and OCR is out of scope. Don't invent numbers.

## Worked example

Given this chunk of extracted text:

```
Patient: John Smith    DOB: 1985-02-10    Sex: M
Collected: March 14, 2026    Report: March 15, 2026

--- Complete Blood Count ---
Hemoglobin          14.2    g/dL     13.5 - 17.5
Hematocrit          42      %        41 - 50
WBC                 11.3    K/uL     4.0 - 10.5      H
Platelets           250     K/uL     150 - 400

--- Lipid Panel ---
Total Cholesterol   210     mg/dL    < 200           H
HDL                 55      mg/dL    > 40
LDL                 142     mg/dL    < 100           H
Triglycerides       85      mg/dL    < 150
```

You would produce:

```json
[
  {"date":"2026-03-14","test_name":"Hemoglobin","value":14.2,"unit":"g/dL","reference_low":13.5,"reference_high":17.5,"category":"Complete Blood Count","source_file":"smith_march.pdf"},
  {"date":"2026-03-14","test_name":"Hematocrit","value":42,"unit":"%","reference_low":41,"reference_high":50,"category":"Complete Blood Count","source_file":"smith_march.pdf"},
  {"date":"2026-03-14","test_name":"White Blood Cells","value":11.3,"unit":"K/uL","reference_low":4.0,"reference_high":10.5,"category":"Complete Blood Count","source_file":"smith_march.pdf"},
  {"date":"2026-03-14","test_name":"Platelets","value":250,"unit":"K/uL","reference_low":150,"reference_high":400,"category":"Complete Blood Count","source_file":"smith_march.pdf"},
  {"date":"2026-03-14","test_name":"Total Cholesterol","value":210,"unit":"mg/dL","reference_low":"","reference_high":200,"category":"Lipid Panel","source_file":"smith_march.pdf"},
  {"date":"2026-03-14","test_name":"HDL Cholesterol","value":55,"unit":"mg/dL","reference_low":40,"reference_high":"","category":"Lipid Panel","source_file":"smith_march.pdf"},
  {"date":"2026-03-14","test_name":"LDL Cholesterol","value":142,"unit":"mg/dL","reference_low":"","reference_high":100,"category":"Lipid Panel","source_file":"smith_march.pdf"},
  {"date":"2026-03-14","test_name":"Triglycerides","value":85,"unit":"mg/dL","reference_low":"","reference_high":150,"category":"Lipid Panel","source_file":"smith_march.pdf"}
]
```

Note the canonical names: `WBC` → `White Blood Cells`, `HDL` → `HDL Cholesterol`, `LDL` → `LDL Cholesterol`. See `test-names.md` for the full mapping.

## Unit conversions to watch for

When the same test appears in the CSV with a different unit than the new source uses, convert before appending. The most common US-lab (mg/dL, ng/dL, µg/dL, g/dL, ng/mL) → SI (mmol/L, nmol/L, µmol/L, g/L) conversions:

| Test | Conversion |
|---|---|
| Glucose | mg/dL ÷ 18.02 → mmol/L |
| Total / HDL / LDL / Non-HDL Cholesterol | mg/dL ÷ 38.67 → mmol/L |
| Triglycerides | mg/dL ÷ 88.57 → mmol/L |
| Creatinine | mg/dL × 88.42 → µmol/L |
| Calcium | mg/dL × 0.2495 → mmol/L |
| Magnesium | mg/dL × 0.4114 → mmol/L |
| BUN / Urea | mg/dL × 0.357 → mmol/L (urea) |
| Total Bilirubin | mg/dL × 17.1 → µmol/L |
| Iron (serum) | µg/dL × 0.1791 → µmol/L |
| TIBC | µg/dL × 0.1791 → µmol/L |
| Cortisol | µg/dL × 27.59 → nmol/L |
| DHEA-S | µg/dL × 0.02714 → µmol/L |
| Testosterone (Total) | ng/dL × 0.03467 → nmol/L |
| Estradiol | pg/mL × 3.671 → pmol/L |
| Vitamin D (25-OH) | ng/mL × 2.496 → nmol/L |
| Hemoglobin | g/dL × 10 → g/L |
| MCHC | g/dL × 10 → g/L |
| Total Protein / Albumin / Globulin | g/dL × 10 → g/L |

Numerically-equivalent unit pairs (value stays the same, just normalize the unit string):

- Ferritin `ng/mL` ≡ `µg/L`
- Insulin `µIU/mL` ≡ `mIU/L`
- Platelets / WBC / absolute counts: `x10³/µL` ≡ `10⁹/L` ≡ `K/µL`
- RBC: `x10⁶/µL` ≡ `10¹²/L` ≡ `M/µL`

When you do a conversion, tell the user what you converted and what the original value was. Silent conversion is a recipe for confusion later. Also convert the reference range, not just the value — otherwise the flag logic breaks.

## Normalizing test names across sources

The same analyte shows up under wildly different labels depending on the source. A few patterns I've seen in practice:

| Source-label style | Canonical |
|---|---|
| `HGB`, `Hb`, `Haemoglobin`, `Гемоглобин (HGB)` | `Hemoglobin` |
| `WBC`, `White Blood Cell Count`, `Лейкоциты (WBC)` | `White Blood Cells` |
| `% Neutrophil`, `Neutrophil %`, `Neut (%)`, `Нейтрофилы (Neu%)` | `Neutrophils (%)` |
| `Neutrophil Count (ANC)`, `Neut#`, `Нейтрофилы (Neu#)` | `Neutrophils (count)` |
| `HDL`, `HDL Cholesterol`, `HDL-C`, `HDL-холестерин` | `HDL Cholesterol` |
| `25-Hydroxy Vitamin D`, `Vit D (25-OH)`, `Витамин D, 25-гидрокси` | `Vitamin D (25-OH)` |
| `ALT / SGPT`, `ALT`, `Трансаминаза-АЛТ` | `ALT` |
| `Total to HDL Ratio`, `Chol/HDL` | `Cholesterol/HDL Ratio` |
| `Bilirubin (total)`, `Общий билирубин`, `T. Bili` | `Total Bilirubin` |

See [test-names.md](test-names.md) for the full canonical list. When you encounter a new alias, add it so the next extraction finds it right away.
