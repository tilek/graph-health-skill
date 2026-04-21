# Canonical test names and categories

Use the canonical names on the left when writing rows to the CSV so the same metric charts as one series across reports, even when labs use different abbreviations. This is a starting list — add entries whenever you encounter a new test, keeping the style consistent (full clinical name, Title Case).

## Complete Blood Count (CBC)

| Canonical name | Common aliases |
|---|---|
| `Hemoglobin` | HGB, Hb, Haemoglobin |
| `Hematocrit` | HCT, PCV, Packed Cell Volume |
| `Red Blood Cells` | RBC, Erythrocytes |
| `White Blood Cells` | WBC, Leukocytes |
| `Platelets` | PLT, Thrombocytes |
| `Mean Corpuscular Volume` | MCV |
| `Mean Corpuscular Hemoglobin` | MCH |
| `Mean Corpuscular Hemoglobin Concentration` | MCHC |
| `Red Cell Distribution Width` | RDW, RDW-CV |
| `Neutrophils` | Neut, Neutrophil %, ANC when reported as absolute |
| `Lymphocytes` | Lymph, Lymphocyte % |
| `Monocytes` | Mono |
| `Eosinophils` | Eos |
| `Basophils` | Baso |

## Metabolic Panel

| Canonical name | Common aliases |
|---|---|
| `Glucose` | Fasting Glucose, Blood Sugar, GLU |
| `Sodium` | Na, Na+ |
| `Potassium` | K, K+ |
| `Chloride` | Cl, Cl- |
| `Bicarbonate` | CO2, HCO3 |
| `Blood Urea Nitrogen` | BUN, Urea |
| `Creatinine` | Creat, Cr |
| `eGFR` | Estimated Glomerular Filtration Rate, GFR |
| `Calcium` | Ca |
| `Magnesium` | Mg |
| `Phosphorus` | Phos, Phosphate |
| `Uric Acid` | UA |
| `HbA1c` | A1C, Hemoglobin A1c, Glycated Hemoglobin |

## Lipid Panel

| Canonical name | Common aliases |
|---|---|
| `Total Cholesterol` | Chol, TC |
| `HDL Cholesterol` | HDL, HDL-C |
| `LDL Cholesterol` | LDL, LDL-C |
| `Triglycerides` | TG, Trig |
| `Non-HDL Cholesterol` | Non-HDL |
| `VLDL Cholesterol` | VLDL |
| `Apolipoprotein B` | Apo B, ApoB |
| `Lipoprotein(a)` | Lp(a) |
| `Cholesterol/HDL Ratio` | Total to HDL Ratio, TC/HDL |
| `Triglycerides/HDL Ratio` | TG/HDL |

## Liver Panel

| Canonical name | Common aliases |
|---|---|
| `ALT` | SGPT, Alanine Aminotransferase |
| `AST` | SGOT, Aspartate Aminotransferase |
| `Alkaline Phosphatase` | ALP, Alk Phos |
| `GGT` | Gamma-Glutamyl Transferase |
| `Total Bilirubin` | T. Bili |
| `Direct Bilirubin` | D. Bili, Conjugated Bilirubin |
| `Albumin` | Alb |
| `Globulin` | Glob |
| `Albumin/Globulin Ratio` | A/G Ratio |
| `Total Protein` | TP |

## Thyroid Panel

| Canonical name | Common aliases |
|---|---|
| `TSH` | Thyroid Stimulating Hormone, Thyrotropin |
| `Free T4` | FT4, Free Thyroxine |
| `Free T3` | FT3, Free Triiodothyronine |
| `Total T4` | T4, Thyroxine |
| `Total T3` | T3, Triiodothyronine |
| `TPO Antibodies` | Anti-TPO, Thyroid Peroxidase Antibodies |

## Vitamins & Minerals

| Canonical name | Common aliases |
|---|---|
| `Vitamin D (25-OH)` | 25-Hydroxy Vitamin D, Vit D, 25-OH-D |
| `Vitamin B12` | B12, Cobalamin |
| `Folate` | Folic Acid, B9 |
| `Ferritin` | Ferr |
| `Iron` | Fe, Serum Iron |
| `TIBC` | Total Iron-Binding Capacity |
| `Transferrin Saturation` | Tsat, Iron Saturation |
| `Zinc` | Zn |
| `RBC Magnesium` | Red-cell Magnesium |

## Hormones

| Canonical name | Common aliases |
|---|---|
| `Testosterone (Total)` | Total T, Testo |
| `Testosterone (Free)` | Free T |
| `Estradiol` | E2 |
| `Progesterone` | P4 |
| `Cortisol` | |
| `DHEA-S` | DHEA Sulfate |
| `Insulin` | |
| `Prolactin` | PRL |

## Fatty Acids

Omega-3 / omega-6 profile tests. Some labs (WellnessFX, OmegaQuant) report these as individual fatty acids plus derived indices.

| Canonical name | Common aliases |
|---|---|
| `EPA` | Eicosapentaenoic acid, Eicosapentaenoic acid (EPA) |
| `DHA` | Docosahexaenoic acid, Docosahexaenoic acid (DHA) |
| `Arachidonic Acid` | AA, Arachidonic acid |
| `Omega Index` | Omega-3 Index |
| `Omega-6:Omega-3 Ratio` | n-6:n-3 Ratio |
| `EPA:AA Ratio` | |
| `Omega Z-Score` | Z score (in an omega-3 panel context) |

## Body Metrics

From wearables, at-home scales, clinic intake vitals.

| Canonical name | Typical units | Common aliases |
|---|---|---|
| `Weight` | kg, lb | Body Weight |
| `BMI` | kg/m² | Body Mass Index |
| `Body Fat %` | % | Body Fat Percentage |
| `Resting Heart Rate` | bpm | RHR |
| `Blood Pressure (Systolic)` | mmHg | SBP |
| `Blood Pressure (Diastolic)` | mmHg | DBP |
| `VO2 Max` | mL/kg/min | |

## Other

Anything that doesn't fit the above categories. Examples: `C-Reactive Protein`, `hs-CRP`, `ESR`, `Homocysteine`, `PSA`, `Apolipoprotein B`.

Note on CRP variants: `C-Reactive Protein` and `hs-CRP` measure the same analyte but with different sensitivities, reference ranges, and clinical interpretation. Keep them as separate canonical names — don't collapse.

## Categories used in the CSV `category` column

Use exactly these strings:

- `Complete Blood Count`
- `Metabolic Panel`
- `Lipid Panel`
- `Liver Panel`
- `Thyroid Panel`
- `Vitamins & Minerals`
- `Hormones`
- `Urinalysis`
- `Fatty Acids`
- `Body Metrics`
- `Other`

The frontend uses the category only for grouping — misspellings will create a spurious extra group, so paste the exact string. When you encounter a test that doesn't fit, either add a new category here (and use it consistently) or drop it into `Other`.
