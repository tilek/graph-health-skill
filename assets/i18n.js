// UI string translations, canonical test-name and category labels.
// Fallback: if a key is missing in the chosen language, English is used by call sites.

export const strings = {
  en: {
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

    lang_en:           "EN",
    lang_ru:           "RU",
  },

  ru: {
    title_main:        "Журнал",
    title_accent:      "здоровья",
    folio_no:          "№ 001",
    folio_kind:        "Личная запись",
    tagline_part1:     "Личный свод лабораторных показателей, сохранённый",
    tagline_part2:     "в порядке поступления",
    tagline_end:       ".",

    tab_summary:       "Обзор",
    tab_charts:        "Динамика",
    tab_record:        "Архив",

    meta_readings:     "измерений",
    meta_tests:        "тестов",

    sources_label:     "Источники",
    sources_intro:     "Каждое значение взято напрямую из одного из этих файлов. Кликните по строке, чтобы отфильтровать архив по этому источнику.",
    sources_readings:  "измерений",

    priorities_title:  "На что стоит обратить внимание",
    priorities_sub:    "Показатели, которые отмечены флагом, приближаются к границе нормы или складываются в закономерность с другими. Кликните, чтобы увидеть полную заметку.",
    priorities_discl_strong: "Это не медицинский совет.",
    priorities_discl:  " Это заметки о закономерностях, построенные по вашим реальным данным и стандартным клиническим источникам. Интерпретацию оставьте врачу.",
    severity_attention:"Требует внимания",
    severity_watch:    "Стоит наблюдать",
    severity_info:     "Контекст",

    summary_title:     "Последние значения",
    summary_sub:       "Самое свежее измерение каждого показателя и изменение по сравнению с предыдущим.",
    prov_from:         "из",
    prov_latest:       "последнее из",
    prov_across:       "в",
    prov_sources:      "источниках",

    charts_title:      "Динамика во времени",
    charts_sub:        "Каждая линия — один показатель. Зеленоватая полоса отмечает референсный диапазон.",
    category_all:      "Все",

    record_title:      "Архив",
    record_sub_pre:    "Все записи в том виде, в каком они лежат в",
    record_sub_post:   ". Нажмите на заголовок столбца, чтобы отсортировать.",
    record_search:     "Поиск по архиву…",

    col_date:          "Дата",
    col_test:          "Показатель",
    col_value:         "Значение",
    col_unit:          "Ед. изм.",
    col_low:           "Мин.",
    col_high:          "Макс.",
    col_flag:          "Флаг",
    col_category:      "Категория",
    col_source:        "Источник",

    detail_about:      "Что это такое",
    detail_interpret:  "Что на это влияет",
    detail_if_high:    "Если повышен",
    detail_if_low:     "Если понижен",
    detail_suggest:    "Что можно сделать",
    detail_readings:   "Ваши измерения",
    detail_reading_n:  (n) => `${n} ${russianPlural(n, "измерение", "измерения", "измерений")}`,
    detail_view_rec:   "Смотреть в архиве →",
    detail_no_info:    (name) => `Для показателя «${name}» заметок пока нет. Численная история ниже взята прямо из ваших исходных файлов.`,
    detail_no_info_h:  "Об этом показателе",
    detail_discl_strong: "Это не медицинский совет.",
    detail_discl:      " Это общие образовательные заметки из стандартных клинических источников. Ваши личные результаты должен интерпретировать врач, учитывая историю, принимаемые лекарства и остальные показатели.",
    detail_no_range:   "референсный диапазон не указан",
    detail_range:      "диапазон",

    empty_title:       "Журнал пока пуст.",
    empty_body_pre:    "Запишите первое измерение командой",
    empty_body_post:   "и обновите страницу.",
    empty_no_match:    "В этой категории пока нет показателей.",

    colophon:          "Хранится локально, виден только вам.",
    fonts_by:          "Набрано в",

    lang_en:           "EN",
    lang_ru:           "RU",
  },
}

// Russian plural helper (1, 2-4, 5-0-10-20)
function russianPlural(n, one, few, many) {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return few;
  return many;
}

// ───────── Canonical test names → Russian display labels ─────────

export const testNamesRu = {
  // Complete Blood Count
  "Hemoglobin":                                   "Гемоглобин",
  "Hematocrit":                                   "Гематокрит",
  "Red Blood Cells":                              "Эритроциты",
  "Mean Corpuscular Volume":                      "Средний объём эритроцита (MCV)",
  "Mean Corpuscular Hemoglobin":                  "Среднее содержание Hb в эритроците (MCH)",
  "Mean Corpuscular Hemoglobin Concentration":    "Средняя концентрация Hb (MCHC)",
  "Red Cell Distribution Width (CV)":             "Анизоцитоз эритроцитов (RDW-CV)",
  "Red Cell Distribution Width (SD)":             "Анизоцитоз эритроцитов (RDW-SD)",
  "Nucleated RBC (count)":                        "Ядросодержащие эритроциты (кол-во)",
  "Nucleated RBC (%)":                            "Ядросодержащие эритроциты (%)",
  "White Blood Cells":                            "Лейкоциты",
  "Neutrophils (count)":                          "Нейтрофилы (кол-во)",
  "Neutrophils (%)":                              "Нейтрофилы (%)",
  "Lymphocytes (count)":                          "Лимфоциты (кол-во)",
  "Lymphocytes (%)":                              "Лимфоциты (%)",
  "Monocytes (count)":                            "Моноциты (кол-во)",
  "Monocytes (%)":                                "Моноциты (%)",
  "Eosinophils (count)":                          "Эозинофилы (кол-во)",
  "Eosinophils (%)":                              "Эозинофилы (%)",
  "Basophils (count)":                            "Базофилы (кол-во)",
  "Basophils (%)":                                "Базофилы (%)",
  "Immature Granulocytes (count)":                "Незрелые гранулоциты (кол-во)",
  "Immature Granulocytes (%)":                    "Незрелые гранулоциты (%)",
  "Platelets":                                    "Тромбоциты",
  "Mean Platelet Volume":                         "Средний объём тромбоцита (MPV)",
  "Platelet Distribution Width":                  "Анизоцитоз тромбоцитов (PDW)",
  "Plateletcrit":                                 "Тромбокрит",
  "Platelet Large Cell Ratio":                    "Доля крупных тромбоцитов (P-LCR)",
  "ESR":                                          "СОЭ",

  // Metabolic
  "Glucose":                                      "Глюкоза",
  "HOMA-IR":                                      "HOMA-IR",
  "HbA1c":                                        "Гликированный гемоглобин (HbA1c)",
  "Sodium":                                       "Натрий",
  "Potassium":                                    "Калий",
  "Chloride":                                     "Хлориды",
  "Bicarbonate":                                  "Бикарбонат (CO₂)",
  "Calcium":                                      "Кальций",
  "Magnesium":                                    "Магний",
  "Creatinine":                                   "Креатинин",
  "Blood Urea Nitrogen":                          "Мочевина (BUN)",
  "eGFR":                                         "Скорость клубочковой фильтрации (СКФ)",

  // Lipid
  "Total Cholesterol":                            "Общий холестерин",
  "LDL Cholesterol":                              "Холестерин ЛПНП (LDL)",
  "HDL Cholesterol":                              "Холестерин ЛПВП (HDL)",
  "Triglycerides":                                "Триглицериды",
  "Non-HDL Cholesterol":                          "Не-ЛПВП холестерин",
  "Apolipoprotein B":                             "Аполипопротеин В (ApoB)",
  "Lipoprotein(a)":                               "Липопротеин(а)",
  "Cholesterol/HDL Ratio":                        "Индекс атерогенности (ХС/ЛПВП)",
  "Triglycerides/HDL Ratio":                      "ТГ/ЛПВП",
  "Atherogenic Index":                            "Индекс атерогенности",

  // Liver
  "ALT":                                          "АЛТ",
  "AST":                                          "АСТ",
  "Alkaline Phosphatase":                         "Щелочная фосфатаза (ЩФ)",
  "Total Bilirubin":                              "Общий билирубин",
  "Direct Bilirubin":                             "Прямой билирубин",
  "Albumin":                                      "Альбумин",
  "Globulin":                                     "Глобулин",
  "Albumin/Globulin Ratio":                       "Соотношение альбумин/глобулин",
  "Total Protein":                                "Общий белок",

  // Thyroid
  "TSH":                                          "ТТГ",
  "Free T4":                                      "Свободный T4",
  "Total T3":                                     "Общий T3",

  // Vitamins & Minerals
  "Vitamin D (25-OH)":                            "Витамин D (25-OH)",
  "Vitamin B12":                                  "Витамин B12",
  "Folate":                                       "Фолиевая кислота",
  "Ferritin":                                     "Ферритин",
  "Iron":                                         "Железо сыворотки",
  "Transferrin":                                  "Трансферрин",
  "Transferrin Saturation":                       "Насыщение трансферрина железом",
  "TIBC":                                         "Общая железосвязывающая способность (ОЖСС)",
  "RBC Magnesium":                                "Магний эритроцитов",

  // Hormones
  "Testosterone (Total)":                         "Тестостерон общий",
  "Testosterone (Free)":                          "Тестостерон свободный",
  "SHBG":                                         "ГСПГ (SHBG)",
  "DHEA-S":                                       "ДГЭА-сульфат",
  "Estradiol":                                    "Эстрадиол",
  "Cortisol":                                     "Кортизол",
  "Cortisol (Morning)":                           "Кортизол (утро)",
  "Insulin":                                      "Инсулин",
  "IGF-1":                                        "ИФР-1",

  // Urinalysis
  "Urine Specific Gravity":                       "Удельный вес мочи",
  "Urine pH":                                     "pH мочи",
  "Urine Red Blood Cells":                        "Эритроциты в моче",
  "Urine White Blood Cells":                      "Лейкоциты в моче",

  // Fatty Acids
  "EPA":                                          "ЭПК (EPA)",
  "DHA":                                          "ДГК (DHA)",
  "Arachidonic Acid":                             "Арахидоновая кислота",
  "Omega Index":                                  "Омега-3 индекс",
  "Omega-6:Omega-3 Ratio":                        "Соотношение омега-6 / омега-3",
  "EPA:AA Ratio":                                 "Соотношение EPA / AA",
  "Omega Z-Score":                                "Омега Z-показатель",

  // Body Metrics
  "BMI":                                          "Индекс массы тела",
  "Weight":                                       "Вес",

  // Other
  "C-Reactive Protein":                           "С-реактивный белок",
  "hs-CRP":                                       "hs-CRP (высокочувствительный CРБ)",
}

// ───────── Category translations ─────────

export const categoriesRu = {
  "Complete Blood Count":  "Общий анализ крови",
  "Metabolic Panel":       "Биохимия",
  "Lipid Panel":           "Липидный профиль",
  "Liver Panel":           "Печень",
  "Thyroid Panel":         "Щитовидная железа",
  "Vitamins & Minerals":   "Витамины и минералы",
  "Hormones":              "Гормоны",
  "Urinalysis":            "Анализ мочи",
  "Fatty Acids":           "Жирные кислоты",
  "Body Metrics":          "Антропометрия",
  "Other":                 "Прочее",
}
