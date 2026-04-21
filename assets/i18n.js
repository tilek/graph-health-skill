// UI chrome strings. Agent-written content (biomarker notes, recommendations)
// lives in the user's health_context.json and renders in whatever language the
// agent chose — the chrome itself stays English.

export const strings = {
  title_main:        "The Health",
  title_accent:      "Ledger",
  folio_no:          "№ 001",
  folio_kind:        "Private record",
  tagline_part1:     "A personal register of laboratory findings, kept",
  tagline_part2:     "in the order in which they arrived",
  tagline_end:       ".",

  tab_summary:       "At a glance",
  tab_charts:        "Over time",
  tab_record:        "The record",

  meta_readings:     "readings",
  meta_tests:        "tests",

  sources_label:     "Sources",
  sources_intro:     "Every reading is pulled directly from one of these files. Click a row to filter the record view to readings from that file.",
  sources_readings:  "readings",

  priorities_title:  "What deserves your attention",
  priorities_sub:    "Tests that are flagged, drifting toward a threshold, or part of a pattern with other readings. Click any item to read the full note.",
  priorities_discl_strong: "Not medical advice.",
  priorities_discl:  " These are pattern-spotting notes drawn from your actual readings and standard clinical references. Bring them to your doctor for interpretation.",
  severity_attention:"Needs attention",
  severity_watch:    "Worth watching",
  severity_info:     "Context",

  summary_title:     "Latest readings",
  summary_sub:       "Most recent value per test, with the change from the reading before.",
  prov_from:         "from",
  prov_latest:       "latest from",
  prov_across:       "across",
  prov_sources:      "sources",

  charts_title:      "Over time",
  charts_sub:        "Each line charts one test. The sage wash marks the reference range.",
  category_all:      "All",

  record_title:      "The record",
  record_sub_pre:    "Every entry as it lives in",
  record_sub_post:   ". Click a column to sort.",
  record_search:     "Search the record…",

  col_date:          "Date",
  col_test:          "Test",
  col_value:         "Value",
  col_unit:          "Unit",
  col_low:           "Low",
  col_high:          "High",
  col_flag:          "Flag",
  col_category:      "Category",
  col_source:        "Source",

  detail_about:      "What it is",
  detail_interpret:  "What changes it",
  detail_if_high:    "If high",
  detail_if_low:     "If low",
  detail_suggest:    "Ways to move the needle",
  detail_readings:   "Your readings",
  detail_reading_n:  (n) => `${n} reading${n === 1 ? "" : "s"}`,
  detail_view_rec:   "View in the record →",
  detail_no_info:    (name) => `No reference notes yet for “${name}”. The numerical history below is pulled directly from your source files.`,
  detail_no_info_h:  "About this test",
  detail_discl_strong: "Not medical advice.",
  detail_discl:      " These are general educational notes drawn from standard clinical references. Your personal results should be interpreted by your doctor alongside your history, medications, and other readings.",
  detail_no_range:   "no reference range reported",
  detail_range:      "range",

  empty_title:       "The ledger is empty.",
  empty_body_pre:    "Record your first reading with",
  empty_body_post:   "and refresh.",
  empty_no_match:    "No tests match this category.",

  colophon:          "Kept locally, read only by you.",
  fonts_by:          "Set in",
}
