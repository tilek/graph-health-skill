// Biomarker reference content.
// Keyed by the canonical test_name used in health_data.csv.
// description: what the biomarker measures (1-3 sentences)
// high:        what elevated values commonly indicate
// low:         what depressed values commonly indicate
// suggestions: actionable, lifestyle-focused bullets. Not medical advice.
//
// Sources: well-established clinical references (Mayo Clinic, UpToDate,
// Harrison's, standard lab guides). Kept general — bring your actual
// results to a physician for interpretation.

window.BIOMARKERS = {
  // ─────────── Complete Blood Count ───────────
  "Hemoglobin": {
    description: "The oxygen-carrying protein inside red blood cells. Determines how much oxygen your blood can deliver to tissues.",
    high: "Dehydration, smoking, high altitude, or rarely polycythemia (bone-marrow overproduction).",
    low: "Anemia — commonly iron deficiency, B12 or folate deficiency, blood loss, or chronic disease.",
    suggestions: [
      "If low: eat iron-rich foods (red meat, liver, lentils, spinach) and pair with vitamin C to boost absorption.",
      "Check ferritin and B12 together — they tell you which deficiency pattern this is.",
      "Rule out hidden blood loss (heavy menses, GI sources) with your doctor.",
      "If high: hydrate consistently; if you smoke, stopping raises the red-cell count back toward normal.",
    ],
  },
  "Hematocrit": {
    description: "The percentage of your blood volume made up of red blood cells. Moves together with hemoglobin.",
    high: "Dehydration, smoking, chronic lung disease, high-altitude living.",
    low: "Same patterns as low hemoglobin — anemia, deficiency, blood loss.",
    suggestions: [
      "Interpret alongside hemoglobin — they track each other.",
      "Persistent hydration helps avoid spurious elevation on morning draws.",
    ],
  },
  "Red Blood Cells": {
    description: "The absolute count of red blood cells per liter. Together with MCV/MCH, it characterizes the shape and size of your red cells.",
    high: "Usually compensatory (altitude, smoking, lung disease) or polycythemia.",
    low: "Anemia (iron, B12, folate, chronic disease, bleeding).",
    suggestions: [
      "Look at MCV next: low MCV + low RBC suggests iron; high MCV + low RBC suggests B12/folate.",
    ],
  },
  "Mean Corpuscular Volume": {
    description: "The average size of your red blood cells. A classic triage tool for the cause of anemia.",
    high: "Macrocytic: often B12 or folate deficiency, thyroid issues, alcohol use, some medications.",
    low: "Microcytic: most often iron deficiency; rarely thalassemia trait.",
    suggestions: [
      "Low MCV + low ferritin → iron deficiency. Eat iron-rich food, consider supplementation with your doctor.",
      "High MCV → test B12 and folate.",
    ],
  },
  "Mean Corpuscular Hemoglobin": {
    description: "Average hemoglobin content per red blood cell. Moves with MCV.",
    high: "Usually macrocytic anemias.",
    low: "Iron deficiency or thalassemia.",
    suggestions: ["Interpret together with MCV and RBC."],
  },
  "Mean Corpuscular Hemoglobin Concentration": {
    description: "Average concentration of hemoglobin inside each red cell. Useful for identifying hypochromic (pale) red cells.",
    high: "Rare — hereditary spherocytosis, cold agglutinins (lab artifact).",
    low: "Iron deficiency, thalassemia.",
    suggestions: ["Generally follows the same story as MCH."],
  },
  "Red Cell Distribution Width (CV)": {
    description: "How variable your red cells are in size. Elevated RDW is an early warning for mixed anemias and is linked to cardiovascular outcomes even in the normal range.",
    high: "Mixed or early anemia, iron/B12 deficiency, recent bleeding, chronic disease.",
    low: "Not clinically meaningful.",
    suggestions: [
      "Persistently elevated RDW deserves a workup even if hemoglobin is normal.",
    ],
  },
  "Red Cell Distribution Width (SD)": {
    description: "Standard-deviation version of RDW — same concept (size variability), different math. Less commonly used than RDW-CV.",
    high: "Same as RDW-CV.",
    low: "Not clinically meaningful.",
    suggestions: ["Usually reported for completeness; follow RDW-CV for interpretation."],
  },
  "Nucleated RBC (count)": {
    description: "Immature red blood cells that escaped the bone marrow. In healthy adults this is essentially zero.",
    high: "Significant — indicates marrow stress (severe anemia, hypoxia, marrow infiltration, sepsis). Needs medical evaluation.",
    low: "Normal.",
    suggestions: ["A non-zero value warrants a conversation with your doctor."],
  },
  "Nucleated RBC (%)": {
    description: "Percentage version of the above. Same clinical meaning.",
    high: "Same — marrow stress; needs evaluation.",
    low: "Normal.",
    suggestions: ["Interpret with the absolute count and the rest of the CBC."],
  },
  "White Blood Cells": {
    description: "Your immune-cell count. Rises in response to infection, inflammation, stress, and some cancers; falls with marrow suppression, autoimmune disease, and certain medications.",
    high: "Infection, inflammation, steroids, physical stress.",
    low: "Viral infection, autoimmune disease, drugs (chemo, some antibiotics), bone-marrow issues.",
    suggestions: [
      "A single out-of-range reading is rarely alarming — look at the differential (neutrophils vs. lymphocytes).",
      "Persistently low WBC with fatigue or infections deserves evaluation.",
    ],
  },
  "Neutrophils (count)": {
    description: "The front-line immune cells that fight bacterial infections. Also known as ANC (Absolute Neutrophil Count).",
    high: "Bacterial infection, inflammation, steroids, physical stress, smoking.",
    low: "Viral infection, autoimmune conditions, chemo/immunosuppressants, some ethnicities have lower baselines (benign ethnic neutropenia).",
    suggestions: [
      "Very low ANC (<1.0 ×10⁹/L) increases infection risk — see your doctor.",
      "Mild transient lows after a viral illness are common.",
    ],
  },
  "Neutrophils (%)": {
    description: "Neutrophils as a percentage of total white cells. Inversely relates to lymphocyte %.",
    high: "Bacterial infection, stress, inflammation.",
    low: "Viral infection, autoimmune disease.",
    suggestions: ["Read alongside the absolute count — percentages can mislead when total WBC is abnormal."],
  },
  "Lymphocytes (count)": {
    description: "T cells and B cells — the immune system's memory and specificity. Respond to viral infection and immune regulation.",
    high: "Viral infections (EBV, CMV, hepatitis), some chronic infections, lymphoproliferative disorders.",
    low: "HIV, steroids, autoimmune disease, severe stress, recent chemo.",
    suggestions: [
      "A transient drop with acute illness is normal.",
      "Persistent lymphopenia deserves workup (HIV test, immunoglobulin levels).",
    ],
  },
  "Lymphocytes (%)": {
    description: "Lymphocytes as a fraction of total white cells. Elevated relative share often accompanies viral illness.",
    high: "Viral infection, chronic immune activation.",
    low: "Stress, steroids, immunosuppression.",
    suggestions: ["Always pair with the absolute count."],
  },
  "Monocytes (count)": {
    description: "Large immune cells that mature into tissue macrophages. Involved in chronic inflammation and tissue repair.",
    high: "Chronic infection, autoimmune disease, recovery from illness, some leukemias.",
    low: "Rarely clinically significant in isolation.",
    suggestions: ["Usually followed along with the rest of the differential."],
  },
  "Monocytes (%)": {
    description: "Monocytes as a percentage of white cells.",
    high: "Chronic inflammation or infection.",
    low: "Not usually significant.",
    suggestions: ["Interpret with the absolute count."],
  },
  "Eosinophils (count)": {
    description: "White cells involved in allergic reactions and parasitic infections. Also implicated in eosinophilic asthma and some GI disorders.",
    high: "Allergies, asthma, eczema, drug reactions, parasites, certain cancers, eosinophilic esophagitis.",
    low: "Usually not significant; seen with stress and steroid use.",
    suggestions: [
      "Mild elevations are common in people with seasonal allergies or asthma.",
      "Persistent marked elevation (>1.5 ×10⁹/L) warrants workup for parasites, drug reactions, or rarer causes.",
    ],
  },
  "Eosinophils (%)": {
    description: "Eosinophils as a percentage of total white cells.",
    high: "Allergic or parasitic conditions.",
    low: "Stress, steroids.",
    suggestions: ["Commonly 1–5% in people with mild allergies."],
  },
  "Basophils (count)": {
    description: "The rarest white cell. Release histamine and mediate inflammatory reactions.",
    high: "Allergic reactions, chronic inflammation, rarely chronic myeloid leukemia.",
    low: "Not clinically significant in isolation.",
    suggestions: ["Persistently elevated basophils deserve a hematology consult."],
  },
  "Basophils (%)": {
    description: "Percentage version of basophils.",
    high: "Similar causes as above.",
    low: "Rarely significant.",
    suggestions: ["Read with the absolute count."],
  },
  "Immature Granulocytes (count)": {
    description: "Young white cells released early from the marrow — sometimes called a 'left shift'. Near-zero is normal.",
    high: "Infection, inflammation, pregnancy, or significant physiological stress.",
    low: "Normal baseline.",
    suggestions: ["Mild elevations are common with any acute illness."],
  },
  "Immature Granulocytes (%)": {
    description: "Percentage version — same meaning.",
    high: "Infection or inflammation.",
    low: "Normal.",
    suggestions: ["Follow the absolute count."],
  },
  "Platelets": {
    description: "Small cells that form blood clots. Low levels raise bleeding risk; high levels raise clot risk and are also an inflammatory marker.",
    high: "Iron deficiency, inflammation, infection, post-splenectomy, essential thrombocythemia.",
    low: "Viral infections, drugs (heparin, alcohol), ITP, liver disease, marrow disorders.",
    suggestions: [
      "Single mildly-low readings can be pseudothrombocytopenia (lab artifact) — ask for repeat in citrate tube.",
      "Persistent low platelets need evaluation — especially if you bruise easily or have bleeding.",
    ],
  },
  "Mean Platelet Volume": {
    description: "Average size of your platelets. Large platelets are younger and more reactive.",
    high: "Increased platelet turnover (ITP, bleeding, inflammation).",
    low: "Aplastic anemia, some chemo drugs.",
    suggestions: ["Usually interpreted together with platelet count."],
  },
  "Platelet Distribution Width": {
    description: "How variable your platelets are in size. Rises when platelet production is stressed.",
    high: "Inflammation, bleeding, thrombocytopenia.",
    low: "Rarely significant.",
    suggestions: ["Secondary marker — usually not acted on alone."],
  },
  "Plateletcrit": {
    description: "Fraction of blood volume made up of platelets — analogous to hematocrit for red cells.",
    high: "High platelet count.",
    low: "Low platelet count.",
    suggestions: ["Tracks platelet count × MPV — rarely read in isolation."],
  },
  "Platelet Large Cell Ratio": {
    description: "Percentage of larger, younger platelets. Rises when turnover is high.",
    high: "Increased platelet turnover.",
    low: "Normal.",
    suggestions: ["Secondary platelet index."],
  },
  "ESR": {
    description: "Erythrocyte Sedimentation Rate — a crude but classic inflammation marker. Rises slowly over days.",
    high: "Chronic inflammation, infection, autoimmune disease, some cancers.",
    low: "Not clinically significant.",
    suggestions: [
      "Anti-inflammatory lifestyle basics help: sleep, stress reduction, omega-3s, resistance exercise, fewer ultra-processed foods.",
      "Persistent elevation should be worked up — pair with CRP.",
    ],
  },

  // ─────────── Metabolic Panel ───────────
  "Glucose": {
    description: "Blood sugar. A fasting reading reflects your body's overnight regulation; post-meal spikes reveal insulin responsiveness.",
    high: "Prediabetes or diabetes, cortisol spike, recent meal (if not truly fasting), certain medications.",
    low: "Uncommon in healthy adults — usually seen with prolonged fasting, alcohol, insulin/sulfonylureas.",
    suggestions: [
      "Reduce refined carbs and sugar-sweetened drinks; favor whole-grain carbs with protein and fiber.",
      "Walking after meals lowers the post-meal spike significantly.",
      "Resistance training improves fasting glucose over weeks.",
      "Check HbA1c for a 3-month average picture, not just fasting.",
    ],
  },
  "HOMA-IR": {
    description: "A fasting-glucose × fasting-insulin index that estimates insulin resistance. Values below ~2 suggest good insulin sensitivity.",
    high: "Insulin resistance — a precursor to type 2 diabetes, also linked to PCOS and metabolic syndrome.",
    low: "Good insulin sensitivity.",
    suggestions: [
      "Strength training 2–3× per week is the single most effective lifestyle lever for insulin sensitivity.",
      "Cut added sugar and ultra-processed carbs; favor protein and fiber at meals.",
      "Aim for 7–8 hours of sleep — short sleep sharply worsens insulin sensitivity.",
      "Weight loss of even 5–10% dramatically improves HOMA-IR if overweight.",
    ],
  },
  "HbA1c": {
    description: "Glycated hemoglobin — reflects your average blood glucose over the past ~3 months. The primary test for diagnosing and monitoring diabetes.",
    high: "≥5.7% prediabetes, ≥6.5% diabetes.",
    low: "Uncommon; sometimes seen with recent blood loss, transfusion, or hemolysis.",
    suggestions: [
      "The same levers that work for fasting glucose: fewer refined carbs, more fiber, regular exercise.",
      "Aim for post-meal walks — they flatten the daytime glucose curve.",
      "Sleep quality matters — poor sleep raises HbA1c over time.",
    ],
  },
  "Sodium": {
    description: "The main extracellular electrolyte. Tightly regulated — abnormal values usually reflect water balance more than salt intake.",
    high: "Dehydration, excessive sweating without replacement, diabetes insipidus.",
    low: "Over-hydration (hyponatremia), SIADH, diuretics, heart/kidney/liver disease.",
    suggestions: [
      "Mild dehydration at draw time can nudge sodium upward — drink normally, not excessively, before labs.",
      "Very low sodium in an athlete often means overhydration during endurance events.",
    ],
  },
  "Potassium": {
    description: "Critical for heart and muscle function. Both high and low can be dangerous.",
    high: "Kidney dysfunction, ACE inhibitors, potassium-sparing diuretics, heavy supplementation.",
    low: "Diuretics, GI losses (vomiting, diarrhea), low intake, hyperaldosteronism.",
    suggestions: [
      "Dietary potassium (bananas, potatoes, leafy greens, beans) is hard to overdose from food alone unless kidneys are impaired.",
      "Muscle cramps and fatigue can signal mild depletion.",
    ],
  },
  "Chloride": {
    description: "An electrolyte that tracks sodium closely. Helps maintain acid-base balance.",
    high: "Dehydration, metabolic acidosis.",
    low: "Vomiting, metabolic alkalosis, some diuretics.",
    suggestions: ["Rarely acted on alone — interpret with sodium and bicarbonate."],
  },
  "Bicarbonate": {
    description: "Also called CO2 or HCO3. Represents your body's buffering capacity and acid-base status.",
    high: "Metabolic alkalosis (prolonged vomiting, diuretics).",
    low: "Metabolic acidosis (kidney disease, uncontrolled diabetes, severe diarrhea).",
    suggestions: ["Interpret alongside sodium, chloride, and kidney markers."],
  },
  "Calcium": {
    description: "Serum calcium — tightly regulated by vitamin D and parathyroid hormone. Most calcium in the body is in bone; blood levels say little about bone density.",
    high: "Hyperparathyroidism, malignancy, vitamin D toxicity, dehydration.",
    low: "Vitamin D deficiency, kidney disease, hypoparathyroidism, low albumin (apparent).",
    suggestions: [
      "Check vitamin D and PTH to interpret abnormalities.",
      "Dairy, sardines, leafy greens, tofu, and fortified foods cover dietary needs.",
    ],
  },
  "Magnesium": {
    description: "Cofactor in hundreds of enzyme reactions including energy production and nerve signaling. Subclinical deficiency is common and under-diagnosed.",
    high: "Uncommon — kidney disease, antacid overuse.",
    low: "Poor diet, alcohol, GI losses, diuretics, PPIs.",
    suggestions: [
      "Serum Mg is insensitive — RBC magnesium is a better picture of intracellular stores.",
      "Dietary sources: nuts, seeds (especially pumpkin), dark chocolate, leafy greens, whole grains.",
      "If supplementing, magnesium glycinate or citrate are well-tolerated; magnesium oxide is poorly absorbed.",
    ],
  },
  "Creatinine": {
    description: "A muscle-derived waste product cleared by your kidneys. The primary marker of kidney function, interpreted via eGFR.",
    high: "Kidney dysfunction, dehydration, high muscle mass, creatine supplementation.",
    low: "Low muscle mass, advanced liver disease.",
    suggestions: [
      "Hydration matters — dehydrated draws elevate creatinine.",
      "Muscular people (including athletes) can have mildly high creatinine with normal kidney function.",
      "Creatine monohydrate supplementation raises creatinine by 10–30% without affecting true kidney function.",
    ],
  },
  "Blood Urea Nitrogen": {
    description: "Urea from protein breakdown, cleared by kidneys. Rises with dehydration, high protein intake, and GI bleeding.",
    high: "Dehydration, kidney dysfunction, high-protein diet, GI bleed.",
    low: "Low protein diet, liver disease, overhydration.",
    suggestions: [
      "Hydrate normally before labs for a more representative value.",
      "Interpret the BUN/creatinine ratio to distinguish dehydration from kidney disease.",
    ],
  },
  "eGFR": {
    description: "Estimated Glomerular Filtration Rate — how fast your kidneys filter blood. The main staging tool for kidney disease.",
    high: "Not clinically concerning; very high values in young muscular adults are normal.",
    low: "Chronic kidney disease: stage 2 (60–89), stage 3a (45–59), 3b (30–44), 4 (15–29), 5 (<15).",
    suggestions: [
      "Blood pressure and blood sugar control are the two biggest levers for preserving kidney function.",
      "Stay hydrated; avoid chronic NSAID use; limit alcohol.",
      "If mildly low and stable over years, often age-related and not concerning — but worth tracking.",
    ],
  },

  // ─────────── Lipid Panel ───────────
  "Total Cholesterol": {
    description: "Sum of HDL, LDL, and VLDL cholesterol. A blunt number — the breakdown matters far more than the total.",
    high: "Dietary saturated fat, genetics (familial hypercholesterolemia), hypothyroidism, kidney disease.",
    low: "Rare; may signal malnutrition or severe illness.",
    suggestions: [
      "Focus on LDL and HDL individually — total alone is not actionable.",
      "Mediterranean-style eating lowers cholesterol in most people within 3 months.",
    ],
  },
  "LDL Cholesterol": {
    description: "'Bad' cholesterol — the main driver of atherosclerotic cardiovascular disease.",
    high: "Genetics, saturated fat, trans fat, hypothyroidism. Risk is dose- and duration-dependent.",
    low: "Generally favorable.",
    suggestions: [
      "Cut saturated fat (butter, fatty red meat, coconut oil) — replace with olive oil, nuts, fatty fish.",
      "Soluble fiber (oats, beans, psyllium) lowers LDL 5–10%.",
      "Regular aerobic exercise lowers LDL modestly.",
      "Targets depend on cardiovascular risk — below 100 mg/dL (2.6 mmol/L) for most adults, lower if high-risk. Discuss with your doctor.",
    ],
  },
  "HDL Cholesterol": {
    description: "'Good' cholesterol — helps shuttle cholesterol back to the liver. Higher is generally better, but very high HDL is not necessarily protective.",
    high: "Exercise, moderate alcohol, some genetic variants.",
    low: "Sedentary lifestyle, smoking, insulin resistance, some medications.",
    suggestions: [
      "Aerobic exercise is the most reliable HDL-booster.",
      "Resistance training helps too.",
      "Stopping smoking raises HDL within months.",
      "Monounsaturated fats (olive oil, avocado, nuts) nudge HDL upward.",
    ],
  },
  "Triglycerides": {
    description: "Circulating fat. Reflects recent carbohydrate and alcohol intake as well as insulin sensitivity.",
    high: "Insulin resistance, high sugar / refined carb intake, alcohol, non-fasting sample, genetics.",
    low: "Generally favorable.",
    suggestions: [
      "Lower refined carbs and added sugar — the biggest lever.",
      "Moderate alcohol or abstain for a month if elevated.",
      "Omega-3s (EPA/DHA, 2–4g/day) lower triglycerides substantially — discuss with doctor.",
      "Exercise and weight loss both lower triglycerides.",
    ],
  },
  "Non-HDL Cholesterol": {
    description: "Total cholesterol minus HDL. Captures all atherogenic particles (LDL + VLDL) — a better predictor of cardiovascular events than LDL alone.",
    high: "Same drivers as LDL plus metabolic syndrome.",
    low: "Favorable.",
    suggestions: [
      "Same strategies as for LDL: saturated fat down, fiber up, exercise, weight normalization.",
    ],
  },
  "Apolipoprotein B": {
    description: "The protein on every atherogenic lipoprotein particle. Counts how many bad particles you actually have in circulation — arguably better than LDL-C for cardiovascular risk.",
    high: "High atherogenic particle burden — elevated cardiovascular risk even if LDL looks okay.",
    low: "Favorable.",
    suggestions: [
      "ApoB and LDL-C usually track together — but when they disagree, trust ApoB.",
      "Same levers: reduce saturated fat, increase fiber, exercise regularly, lose weight if applicable.",
    ],
  },
  "Lipoprotein(a)": {
    description: "A genetically-determined LDL-like particle. About 20% of people have elevated Lp(a), which independently raises heart attack and stroke risk.",
    high: "Genetic — diet and exercise barely budge it.",
    low: "Favorable.",
    suggestions: [
      "Not modifiable by lifestyle. But elevated Lp(a) means you should be aggressive on every other modifiable risk factor (blood pressure, LDL, smoking, weight).",
      "Measure once in a lifetime unless specific treatments are being discussed.",
    ],
  },
  "Cholesterol/HDL Ratio": {
    description: "Total cholesterol ÷ HDL. A composite cardiovascular risk indicator. Below 3.5 is generally considered low-risk.",
    high: "Either high total cholesterol or low HDL, both problematic.",
    low: "Favorable.",
    suggestions: ["Improve through the HDL and LDL levers listed above."],
  },
  "Triglycerides/HDL Ratio": {
    description: "A surrogate marker for insulin resistance and small-dense LDL. A ratio below 2 is generally favorable.",
    high: "Metabolic syndrome, insulin resistance.",
    low: "Good metabolic health.",
    suggestions: [
      "Cut refined carbs and sugar — drives both triglycerides down and HDL up.",
      "Resistance training improves this ratio faster than almost anything else.",
    ],
  },
  "Atherogenic Index": {
    description: "A composite risk index from this lab: (Total Cholesterol - HDL) / HDL. Below 4 is considered low risk.",
    high: "Unfavorable lipid profile.",
    low: "Favorable.",
    suggestions: ["The HDL and triglyceride levers apply here too."],
  },

  // ─────────── Liver Panel ───────────
  "ALT": {
    description: "Alanine aminotransferase — an enzyme that leaks out when liver cells are damaged. The most sensitive liver-injury marker.",
    high: "Fatty liver, alcohol, medications (statins, Tylenol), viral hepatitis, exercise, muscle injury.",
    low: "Not clinically significant.",
    suggestions: [
      "By far the most common cause of chronically elevated ALT is metabolic / fatty liver — reducing weight, sugar, and alcohol reverses it.",
      "Don't draw labs within 48 hours of heavy exercise — false elevations are common.",
      "If persistently high, screen for hepatitis B/C and check the ALT/AST ratio.",
    ],
  },
  "AST": {
    description: "Aspartate aminotransferase — similar to ALT but also released from muscle and heart. The ALT/AST ratio helps pinpoint the source.",
    high: "Liver injury (alcohol typically has AST > ALT), muscle breakdown, heart issues.",
    low: "Not clinically significant.",
    suggestions: [
      "AST > ALT can signal alcohol-related liver injury.",
      "Heavy exercise and muscle injury elevate AST more than ALT.",
    ],
  },
  "Alkaline Phosphatase": {
    description: "An enzyme from liver, bile ducts, and bone. Elevation points to bile-duct obstruction or bone turnover.",
    high: "Bile-duct issues, bone disease, pregnancy (physiologic), growing children.",
    low: "Rarely significant; sometimes seen with zinc deficiency or hypothyroidism.",
    suggestions: [
      "If ALP is up alongside bilirubin, think bile-duct pathology — see your doctor.",
      "Isolated ALP elevation can be bone origin — check with GGT (bone origin has normal GGT).",
    ],
  },
  "Total Bilirubin": {
    description: "Breakdown product of hemoglobin. Elevations cause jaundice (yellow skin/eyes).",
    high: "Gilbert's syndrome (benign, very common), hemolysis, liver disease, bile-duct obstruction.",
    low: "Not clinically significant.",
    suggestions: [
      "Mildly elevated total bilirubin with normal ALT/AST is often Gilbert's syndrome — a harmless genetic variant affecting ~5% of people.",
      "Persistently high with abnormal liver enzymes needs workup.",
    ],
  },
  "Direct Bilirubin": {
    description: "The conjugated form of bilirubin. A high direct/total ratio points to liver or bile-duct problems rather than red-cell breakdown.",
    high: "Bile-duct obstruction, hepatocellular disease.",
    low: "Not clinically significant.",
    suggestions: ["Interpret as a ratio of total bilirubin."],
  },
  "Albumin": {
    description: "The main protein in your blood — maintains osmotic pressure and carries many substances. Produced exclusively by the liver.",
    high: "Dehydration.",
    low: "Liver disease, malnutrition, inflammation, kidney disease (protein loss).",
    suggestions: [
      "Low albumin with normal kidneys often signals inflammation — check CRP.",
      "Adequate dietary protein (1.2–1.6 g/kg/day for active adults) supports levels.",
    ],
  },
  "Globulin": {
    description: "The non-albumin proteins in blood — immune globulins (antibodies) plus transport proteins.",
    high: "Chronic inflammation, infection, some cancers (multiple myeloma).",
    low: "Immune deficiency, liver disease.",
    suggestions: ["Interpret as part of total protein / albumin / A-G picture."],
  },
  "Albumin/Globulin Ratio": {
    description: "Albumin divided by globulin. A low ratio points to either low albumin (liver/malnutrition) or high globulin (inflammation, myeloma).",
    high: "Rarely significant.",
    low: "Chronic inflammation or low albumin.",
    suggestions: ["A persistently low ratio in an older adult warrants a check for monoclonal gammopathy."],
  },
  "Total Protein": {
    description: "Sum of albumin and globulin.",
    high: "Dehydration, chronic inflammation.",
    low: "Malnutrition, liver disease, kidney losses.",
    suggestions: ["Less informative than the components individually."],
  },

  // ─────────── Thyroid ───────────
  "TSH": {
    description: "Thyroid Stimulating Hormone — made by the pituitary. The most sensitive screen for thyroid function. High TSH means your thyroid is underactive; low TSH means overactive.",
    high: "Hypothyroidism (most often Hashimoto's). Also seen in recovery from severe illness.",
    low: "Hyperthyroidism (Graves', toxic nodule), too much thyroid hormone replacement.",
    suggestions: [
      "Most labs call <4.5 normal, but optimal symptom-free levels are often 0.5–2.5 — especially for women trying to conceive.",
      "Check Free T4 alongside TSH to confirm the diagnosis.",
      "Iodine and selenium matter; severe deficiencies are rare in developed countries but worth checking if you avoid dairy and seafood.",
    ],
  },
  "Free T4": {
    description: "The unbound, active form of the main thyroid hormone. Used together with TSH to confirm thyroid disorders.",
    high: "Hyperthyroidism.",
    low: "Hypothyroidism.",
    suggestions: ["Interpret with TSH. If TSH is high and Free T4 is low, primary hypothyroidism is likely."],
  },
  "Total T3": {
    description: "The most metabolically-active thyroid hormone (most of it is converted from T4 in tissues). Less used than Free T4 for screening.",
    high: "Hyperthyroidism, especially in early Graves'.",
    low: "Hypothyroidism, chronic illness (euthyroid sick syndrome).",
    suggestions: ["Clinically, Free T3 is often more useful than Total T3."],
  },

  // ─────────── Vitamins & Minerals ───────────
  "Vitamin D (25-OH)": {
    description: "Your main vitamin D storage form. Supports bone health, immune function, and many other systems. Widespread deficiency at higher latitudes and for indoor-heavy lifestyles.",
    high: "Usually supplement excess.",
    low: "Little sun exposure, darker skin, older age, obesity, malabsorption.",
    suggestions: [
      "Aim for 75–125 nmol/L (30–50 ng/mL) as a generally-accepted sufficiency range.",
      "Supplementation with D3 (cholecalciferol) 1000–2000 IU/day is safe for most adults; higher doses only under medical supervision.",
      "Taking D with a fat-containing meal improves absorption.",
      "Sun exposure matters — even 10–15 minutes of midday arms-and-legs exposure several times per week helps.",
    ],
  },
  "Vitamin B12": {
    description: "Essential for red-cell production, nerve function, and DNA synthesis. Deficiency is common in vegetarians/vegans, older adults, and people on PPIs or metformin.",
    high: "Supplementation; rarely liver disease or blood cancers.",
    low: "Strict plant-based diet, pernicious anemia (autoimmune), PPIs, metformin, older age.",
    suggestions: [
      "Vegans should supplement — methylcobalamin or cyanocobalamin are both fine.",
      "If absorption is impaired (pernicious anemia, post-bariatric surgery), injections or sublingual high-dose are used.",
      "'Normal' serum B12 can miss early deficiency — methylmalonic acid is a more sensitive test if clinically suspicious.",
    ],
  },
  "Folate": {
    description: "Folic acid / folate. Required for DNA synthesis and red-cell formation. Especially critical during pregnancy.",
    high: "Supplementation — not harmful in most contexts but can mask B12 deficiency.",
    low: "Poor diet, alcohol, certain medications (methotrexate).",
    suggestions: [
      "Leafy greens, legumes, and fortified grains cover most needs.",
      "Pregnancy and pre-conception: 400–800 µg/day is standard to reduce neural-tube defects.",
      "If low folate, test B12 at the same time — they often go together.",
    ],
  },
  "Ferritin": {
    description: "Your iron-storage protein. The most sensitive marker of iron status — falls before hemoglobin does. Also rises as an inflammatory marker.",
    high: "Inflammation, alcohol, fatty liver, genetic hemochromatosis.",
    low: "Iron deficiency (even before anemia develops).",
    suggestions: [
      "For energy / hair / nail symptoms, ferritin below ~50–70 ng/mL often matters even if 'in range'.",
      "Heme iron (red meat, liver) absorbs best; pair plant iron with vitamin C and away from tea/coffee.",
      "If high AND you feel fine: consider inflammation or fatty liver. If very high or family history of hemochromatosis: evaluate with transferrin saturation.",
    ],
  },
  "Iron": {
    description: "Serum iron — the iron in transit right now. Fluctuates through the day; a single reading is less reliable than ferritin.",
    high: "High iron intake or hemochromatosis.",
    low: "Iron deficiency — often with low ferritin and low transferrin saturation.",
    suggestions: ["Always interpret with ferritin and transferrin saturation."],
  },
  "Transferrin": {
    description: "The main transport protein for iron. Goes up when the body is iron-hungry, down in inflammation.",
    high: "Iron deficiency.",
    low: "Iron overload, inflammation, liver disease.",
    suggestions: ["Read as part of the iron panel."],
  },
  "Transferrin Saturation": {
    description: "The percentage of transferrin's iron-carrying slots that are occupied. A great screening tool for both iron deficiency and iron overload.",
    high: "Iron overload (hemochromatosis).",
    low: "Iron deficiency.",
    suggestions: [
      "Persistently >45% with elevated ferritin warrants genetic hemochromatosis screening.",
      "Below 20% with low ferritin strongly suggests iron deficiency.",
    ],
  },
  "TIBC": {
    description: "Total Iron-Binding Capacity — an older measure essentially equivalent to transferrin.",
    high: "Iron deficiency.",
    low: "Iron overload, inflammation.",
    suggestions: ["Rarely needed when ferritin + transferrin saturation are available."],
  },
  "RBC Magnesium": {
    description: "Magnesium content inside red cells — a more sensitive marker of whole-body magnesium status than serum magnesium.",
    high: "Rare.",
    low: "Subclinical magnesium deficiency (quite common in modern diets).",
    suggestions: [
      "Nuts, seeds (pumpkin especially), dark chocolate, leafy greens, legumes.",
      "Magnesium glycinate or citrate are well-absorbed supplement forms.",
    ],
  },

  // ─────────── Hormones ───────────
  "Cortisol": {
    description: "The body's main stress hormone. Has a strong morning peak and tapers through the day. Morning (8–10 AM) draws are the standard reference.",
    high: "Acute stress, Cushing's syndrome, some medications, shift work.",
    low: "Adrenal insufficiency — fatigue, low blood pressure, salt craving.",
    suggestions: [
      "Cortisol is highly sensitive to the draw time and the days preceding — poor sleep, caffeine, and emotional stress all lift it.",
      "If chronically elevated and symptomatic, address sleep, stress, and over-training first.",
      "Persistent abnormalities (especially both morning and evening out of range) warrant endocrine evaluation.",
    ],
  },
  "Testosterone (Total)": {
    description: "Total circulating testosterone — about 98% bound to proteins. The main androgen in men; also important in women at much lower levels.",
    high: "Supplementation, some genetic conditions, PCOS (women).",
    low: "Aging, obesity, poor sleep, overtraining, chronic illness, certain medications.",
    suggestions: [
      "Resistance training, adequate sleep, and normal body fat are the top three lifestyle levers.",
      "Zinc and vitamin D sufficiency matter; chronic alcohol suppresses testosterone.",
      "Interpret alongside SHBG and Free Testosterone — total can be misleading when SHBG is abnormal.",
    ],
  },
  "Testosterone (Free)": {
    description: "The unbound, bioavailable testosterone. Often more meaningful than total — especially when SHBG is unusual.",
    high: "Same drivers as total.",
    low: "Aging, obesity, metabolic syndrome.",
    suggestions: [
      "Optimize the same levers as total T: sleep, strength training, body composition.",
      "Free T falls faster with age than total T.",
    ],
  },
  "SHBG": {
    description: "Sex Hormone Binding Globulin — binds testosterone and estradiol. Its level changes how much is 'free' and active.",
    high: "Hyperthyroidism, estrogen excess, aging, low insulin.",
    low: "Insulin resistance, obesity, high androgen levels, hypothyroidism.",
    suggestions: [
      "Low SHBG is a strong marker of insulin resistance even when fasting glucose is normal.",
      "Weight loss and improving insulin sensitivity raise SHBG.",
    ],
  },
  "DHEA-S": {
    description: "An adrenal androgen precursor. Declines steadily with age. A crude marker of adrenal 'reserve'.",
    high: "PCOS, adrenal tumors (rare), supplementation.",
    low: "Aging, chronic stress, adrenal insufficiency.",
    suggestions: [
      "Modest age-related decline is normal.",
      "Supplementing DHEA can raise levels but the clinical benefit is modest — discuss with a physician.",
    ],
  },
  "Estradiol": {
    description: "The main estrogen — tightly cycled in premenopausal women, lower and more stable in men and postmenopausal women.",
    high: "Pregnancy, PCOS, some tumors; in men: obesity (aromatization), liver disease.",
    low: "Menopause, amenorrhea, low body fat.",
    suggestions: [
      "In men: if elevated alongside low testosterone, obesity and alcohol are the usual culprits.",
      "In women: interpretation depends entirely on cycle phase or menopausal status.",
    ],
  },
  "Cortisol (Morning)": {
    description: "Morning cortisol specifically — the standard reference for adrenal evaluation. See Cortisol.",
    high: "Acute stress, Cushing's syndrome.",
    low: "Adrenal insufficiency.",
    suggestions: ["Interpret together with ACTH for adrenal workup."],
  },
  "Insulin": {
    description: "The hormone that drives glucose into cells. Fasting insulin is an early marker of insulin resistance — rises years before fasting glucose does.",
    high: "Insulin resistance, metabolic syndrome, PCOS.",
    low: "Type 1 diabetes, pancreatic damage.",
    suggestions: [
      "Optimal fasting insulin is below ~7 µIU/mL — even 'in range' values above 10 hint at insulin resistance.",
      "Strength training, fiber, protein at meals, and 7+ hours of sleep all improve fasting insulin.",
    ],
  },
  "IGF-1": {
    description: "Insulin-like Growth Factor 1 — the main mediator of growth hormone. Reflects long-term GH activity; used to screen for both deficiency and excess.",
    high: "Acromegaly (rare), GH excess, PEDs.",
    low: "GH deficiency, aging, chronic illness, caloric restriction.",
    suggestions: [
      "Age-matched ranges matter — IGF-1 naturally declines with age.",
      "Adequate protein intake and deep sleep support IGF-1.",
    ],
  },

  // ─────────── Urinalysis ───────────
  "Urine Specific Gravity": {
    description: "How concentrated your urine is. Reflects recent hydration status.",
    high: "Dehydration.",
    low: "Over-hydration or (rarely) inability to concentrate urine (diabetes insipidus).",
    suggestions: ["Single reading depends on what you drank in the past hour — not a long-term signal."],
  },
  "Urine pH": {
    description: "Urine acidity. Varies through the day and with diet — plant-heavy meals push it alkaline, meat-heavy meals acidic.",
    high: "Vegetarian diet, UTI with urea-splitting organisms, some metabolic alkaloses.",
    low: "High-protein diet, metabolic acidosis.",
    suggestions: ["Persistent extreme values with recurrent stones warrant a kidney-stone workup."],
  },
  "Urine Red Blood Cells": {
    description: "Red cells in urine. A small number is often benign (vigorous exercise, menstrual contamination); persistent or high counts need workup.",
    high: "UTI, kidney stones, kidney or bladder disease, exercise (transient).",
    low: "Normal.",
    suggestions: ["Any persistent elevation (beyond a single reading post-exercise or during menses) should be evaluated."],
  },
  "Urine White Blood Cells": {
    description: "White cells in urine — suggests urinary-tract inflammation or infection.",
    high: "UTI, inflammation, contamination.",
    low: "Normal.",
    suggestions: ["A clean-catch collection matters to avoid false positives."],
  },

  // ─────────── Fatty Acids ───────────
  "EPA": {
    description: "Eicosapentaenoic acid — an omega-3 fatty acid, mostly from fatty fish. Anti-inflammatory and cardioprotective.",
    high: "High fish intake or fish-oil supplementation.",
    low: "Low omega-3 intake — typical Western diet.",
    suggestions: [
      "Two servings of fatty fish per week (salmon, sardines, mackerel, herring) is the classic recommendation.",
      "Algae-based EPA/DHA works for vegetarians.",
      "Aim for an Omega Index ≥ 8%.",
    ],
  },
  "DHA": {
    description: "Docosahexaenoic acid — the other major omega-3. Especially important for brain and retinal function.",
    high: "Fish or fish-oil intake.",
    low: "Low omega-3 diet.",
    suggestions: [
      "Same sources as EPA. Fish oil gives both; algae oil works for plant-based.",
    ],
  },
  "Arachidonic Acid": {
    description: "A long-chain omega-6 fatty acid. Pro-inflammatory in high amounts but essential at normal levels.",
    high: "High intake of animal fat and processed seed oils; low omega-3 intake.",
    low: "Rarely deficient.",
    suggestions: [
      "The ratio to EPA (EPA:AA) matters more than the absolute level.",
    ],
  },
  "Omega Index": {
    description: "EPA + DHA as a percentage of red-cell fatty acids. A direct measure of omega-3 status. 8%+ is associated with lower cardiovascular mortality; most Americans are 4–5%.",
    high: "Higher is better for cardiovascular and cognitive health.",
    low: "Low omega-3 intake.",
    suggestions: [
      "Aim for 8%+ through regular fatty-fish intake or EPA+DHA supplementation.",
      "It takes ~3–4 months of consistent intake to move the Omega Index meaningfully.",
    ],
  },
  "Omega-6:Omega-3 Ratio": {
    description: "Ratio of omega-6 to omega-3 fatty acids in your blood. Modern diets often hit 15:1 or higher; hunter-gatherer diets were near 1:1. Lower is generally better for inflammation.",
    high: "Heavy processed-food and seed-oil intake without fish.",
    low: "Omega-3 rich diet.",
    suggestions: [
      "The biggest lever is adding omega-3 (fatty fish, algae oil), not eliminating omega-6.",
      "Reducing ultra-processed foods naturally lowers omega-6.",
    ],
  },
  "EPA:AA Ratio": {
    description: "EPA divided by arachidonic acid — a direct inflammation-balance marker. Higher means more anti-inflammatory tone.",
    high: "Favorable for inflammatory balance.",
    low: "Pro-inflammatory balance.",
    suggestions: ["Same levers as for the Omega Index."],
  },
  "Omega Z-Score": {
    description: "A normalized score combining the omega-3 profile relative to a reference population.",
    high: "Better-than-average omega-3 status.",
    low: "Below-average omega-3 status.",
    suggestions: ["Read alongside Omega Index."],
  },

  // ─────────── Body Metrics ───────────
  "BMI": {
    description: "Body Mass Index = weight (kg) ÷ height² (m²). A rough body-composition screen. Misleading for athletes with high muscle mass and for very short or very tall people.",
    high: "Overweight (25–29.9) or obese (≥30) ranges — associated with metabolic and cardiovascular risk.",
    low: "Underweight (<18.5) — associated with nutritional deficiency.",
    suggestions: [
      "Waist circumference and body-fat % are more informative for health risk than BMI alone.",
      "A muscular athlete can have BMI >28 with low body fat and excellent health markers.",
    ],
  },
  "Weight": {
    description: "Body weight. Useful trended over time rather than read at a single point.",
    high: "Track trend, not the single value.",
    low: "Same.",
    suggestions: ["Weigh at the same time of day (morning, fasted) for consistency."],
  },

  // ─────────── Other ───────────
  "C-Reactive Protein": {
    description: "An acute-phase inflammatory marker. Rises within hours of any significant inflammation.",
    high: "Infection, acute injury, autoimmune flare, chronic inflammation.",
    low: "Good.",
    suggestions: [
      "Standard CRP is less sensitive than hs-CRP for low-grade chronic inflammation — ask for hs-CRP if tracking cardiovascular risk.",
    ],
  },
  "hs-CRP": {
    description: "High-sensitivity CRP. A chronic low-grade inflammation marker linked to cardiovascular risk. Below 1 mg/L is considered low risk; 1–3 moderate; >3 high.",
    high: "Chronic inflammation, obesity, infection (wait 2 weeks after any illness to retest), smoking.",
    low: "Good.",
    suggestions: [
      "Lifestyle basics move hs-CRP: stop smoking, improve sleep, exercise regularly, reduce refined carbs and alcohol.",
      "A Mediterranean-style diet lowers hs-CRP over months.",
      "Retest after addressing modifiable factors; persistent elevation warrants a conversation with your doctor.",
    ],
  },
};
