// Personalized recommendations generated from this specific dataset.
// Keyed by test_name. Regenerate whenever new data lands — these reference
// the user's actual numbers and trends.
//
// severity:
//   "attention" — currently flagged or clinically worth acting on now
//   "watch"     — in range but trending toward a limit / part of a pattern
//   "info"      — noted for completeness; likely benign
//
// detail: 1–3 sentences referencing the user's own values.
// actions: concrete, lifestyle-first steps. Not medical advice.

window.RECOMMENDATIONS = {
  // ─── metabolic / hormonal cluster — the most important finding ───
  "Insulin": {
    severity: "attention",
    headline: "Fasting insulin has risen 5× — early insulin-resistance signal",
    detail: "11.3 µIU/mL is still within range (2.6–24.9), but in 2016 you were at 2.0. Your HOMA-IR moved from 0.4 to 2.1 over the same period, and SHBG fell from 90 to 25.5 nmol/L. These three readings tell the same story: insulin sensitivity has slipped, even though HbA1c and fasting glucose still read normal. This is the earliest, most actionable metabolic signal in your panel.",
    actions: [
      "Add resistance training 3× per week. It raises muscle GLUT4 and drops fasting insulin faster than anything else.",
      "Cut refined carbs, sugar-sweetened drinks, and ultra-processed snacks. Lead meals with protein and fiber.",
      "Sleep 7+ hours consistently — one short night measurably reduces next-day insulin sensitivity.",
      "Walk 10–15 minutes after your two biggest meals — it flattens the glucose/insulin spike.",
    ],
  },
  "HOMA-IR": {
    severity: "attention",
    headline: "Insulin-resistance score climbed from 0.4 to 2.1",
    detail: "You're still under the 2.7 concern threshold, but this is a 5× move from baseline and fits with the rest of your metabolic picture. See the Insulin entry — same levers, same story.",
    actions: [
      "Strength training is the fastest lever for HOMA-IR.",
      "Protein + fiber + fat before carbs at each meal slows the glucose curve.",
      "If overweight, losing even 5% body weight moves HOMA-IR substantially.",
    ],
  },
  "SHBG": {
    severity: "attention",
    headline: "Dropped from 90 to 25.5 nmol/L — a metabolic red flag",
    detail: "Low SHBG is one of the earliest objective markers of insulin resistance — often moves before glucose or HbA1c do. Your fall from 90 to 25.5 aligns with your rising insulin and partly explains the testosterone decline.",
    actions: [
      "SHBG isn't treated directly — it rises as insulin sensitivity improves. Work the Insulin and HOMA-IR actions above.",
      "Reducing liver fat (Mediterranean-style eating, less alcohol, weight loss if applicable) is particularly effective for raising SHBG.",
    ],
  },
  "Testosterone (Total)": {
    severity: "watch",
    headline: "Down 52% over a decade — still in range, but the trend matters",
    detail: "30.2 → 14.5 nmol/L from 2016 to 2026. Still well above the 8.64 lower bound. But your SHBG also collapsed over the same period, so the free/bioavailable picture may not be as dramatic — if you have symptoms (low energy, libido, mood, poorer gains), a Free T check tells more.",
    actions: [
      "Lifestyle levers overlap heavily with insulin sensitivity: strength training, 7+ hours sleep, normal body fat, adequate protein (1.6 g/kg/day if active).",
      "Zinc and vitamin D sufficiency matter — your vitamin D is currently low, see that entry.",
      "Chronic alcohol suppresses testosterone; even moderate daily intake has an effect.",
      "If symptomatic despite these basics, a proper endocrine workup is worth having.",
    ],
  },

  // ─── lipid story ───
  "LDL Cholesterol": {
    severity: "watch",
    headline: "Climbed 3× since 2016 — worth addressing before it crosses the line",
    detail: "1.24 → 3.92 mmol/L across your records. Still inside the 4.29 ceiling, but the direction is unambiguous. Apolipoprotein B has risen (46 → 72 mg/dL) alongside, confirming that the particle count is actually increasing. Combined with the currently-flagged Atherogenic Index, this is your most important long-term lipid trend.",
    actions: [
      "Saturated fat down: less butter, less fatty red meat, less coconut oil. Replace with olive oil, nuts, fatty fish.",
      "Soluble fiber up: oats, lentils, beans, psyllium. 10–15g/day lowers LDL 5–10% on its own.",
      "Fatty fish 2× per week or 2–3g EPA+DHA supplementation. Your Omega Index was 2.4% — well below the 8% target.",
      "If LDL continues to rise despite these changes, discuss an ApoB recheck and statin eligibility with your doctor (uses your 10-year cardiovascular risk, not LDL alone).",
    ],
  },
  "Atherogenic Index": {
    severity: "attention",
    headline: "Crossed the 4.0 threshold — reflects your lipid trend",
    detail: "4.22 vs. the <4.0 target. The index is total-cholesterol-minus-HDL divided by HDL — it moves when LDL rises (your LDL tripled) or HDL drops (yours has hovered near 1.0 mmol/L). This is the downstream readout of your lipid story.",
    actions: [
      "See the LDL Cholesterol entry for the main levers.",
      "HDL responds best to aerobic exercise and monounsaturated fats (olive oil, avocado, nuts).",
      "Stopping smoking (if applicable) raises HDL within months.",
    ],
  },

  // ─── standalone current flag with a clear fix ───
  "Vitamin D (25-OH)": {
    severity: "attention",
    headline: "Just below sufficiency — and you've lost a quarter of your reserve",
    detail: "73.9 nmol/L sits just under the 75 threshold for adequacy. More telling: your 5-year average was 98 nmol/L — you've shed roughly 24% of your stored vitamin D. Common reasons: winter months, less outdoor time, or a supplement dose that tapered or stopped.",
    actions: [
      "Restart or raise vitamin D3: 2000 IU/day for 3 months, then retest. Go to 4000 IU/day only if the retest is still below 75.",
      "Take it with a fat-containing meal — absorption is 2–3× better than on an empty stomach.",
      "If you're at higher latitudes, aim for midday arms-and-legs sun exposure a few times per week when weather allows — 10–15 minutes covers a lot of ground.",
      "Magnesium and vitamin K2 are cofactors; if you supplement D3 long-term, include K2 (MK-7 100–200 µg) and ensure adequate magnesium.",
    ],
  },

  // ─── CBC-related cluster ───
  "Red Blood Cells": {
    severity: "attention",
    headline: "Mild erythrocytosis developing — all three cell indices at the top",
    detail: "RBC 5.81 ×10¹²/L (ceiling 5.7), hemoglobin 164 g/L, hematocrit 47.6% — all three are at or above the top of their ranges, and all three have risen from 2016 baselines (5.15 / 144 / 44.5). This pattern most commonly reflects chronic dehydration at the time of draw, living at altitude, smoking/vaping, or sleep apnea; less commonly a primary polycythemia (JAK2 mutation).",
    actions: [
      "Drink 400–500 mL water an hour before your next lab draw — dehydrated morning draws push all three of these up together.",
      "If you smoke or vape, stopping is by far the biggest lever — red-cell counts normalize over a few months.",
      "If you snore loudly or feel unrefreshed in the morning, ask about a sleep-apnea screen; chronic nocturnal hypoxia drives this exact pattern.",
      "If the pattern persists in well-hydrated, non-smoking, non-apneic draws, your doctor can rule out polycythemia vera with a JAK2 mutation test and EPO level.",
    ],
  },
  "Hemoglobin": {
    severity: "watch",
    headline: "Rising alongside RBC and hematocrit",
    detail: "164 g/L, up from 144 in 2016. Still within range, but part of the same pattern as the flagged Red Blood Cells — see that entry.",
    actions: [
      "Addressed under Red Blood Cells — same causes, same levers.",
    ],
  },
  "Hematocrit": {
    severity: "watch",
    headline: "At the ceiling of range (47.6 / 49)",
    detail: "Matches your rising hemoglobin and RBC. See Red Blood Cells for the interpretation and next steps.",
    actions: [
      "Addressed under Red Blood Cells.",
    ],
  },
  "Neutrophils (%)": {
    severity: "watch",
    headline: "Low percentage, absolute count right at the floor",
    detail: "43.9% is below range, and more importantly the absolute neutrophil count (1.80 ×10⁹/L) is sitting right at the bottom of its range (1.80). The percentage is a bit misleading since total WBC is low-normal (4.10) — focus on the absolute number. Some ethnicities (African, Middle Eastern, Yemenite descent) have benign lower baselines; if your counts have been stable here for years, that's likely you.",
    actions: [
      "If this is a steady baseline across years, it's most likely benign.",
      "If it's new, or if you've had recurrent infections, mention it to your doctor.",
      "Avoid drawing labs when fighting an acute viral illness — transient drops during / after are common and don't reflect your steady state.",
    ],
  },
  "Lymphocytes (%)": {
    severity: "watch",
    headline: "High percentage mirrors the neutrophil picture",
    detail: "41% lymphocytes with 43.9% neutrophils — they always move reciprocally by percentage. Your absolute lymphocyte count (1.68 ×10⁹/L) is mid-range and fine. This is a percentage artifact of the low-ish neutrophil count, not a real lymphocytosis.",
    actions: [
      "Interpret together with the neutrophil number.",
      "If you had a recent viral infection, this percentage flip is expected.",
    ],
  },
  "Eosinophils (%)": {
    severity: "watch",
    headline: "Persistently mild elevation — likely your baseline",
    detail: "6.1% just above the 5% cap, and your 7-reading average is 5.66% — this has been your pattern for years. The absolute count (0.25 ×10⁹/L) is comfortably mid-range.",
    actions: [
      "In the context of seasonal allergies, asthma, or eczema, this level is common and typically not acted on.",
      "If you have ongoing respiratory or skin symptoms, it's worth mentioning to your doctor.",
      "A rise past ~1.0 ×10⁹/L absolute would warrant a workup (parasites, drug reactions, rarer causes).",
    ],
  },

  // ─── trending / context-only ───
  "HbA1c": {
    severity: "watch",
    headline: "Still normal, but creeping up",
    detail: "5.42% — below the 5.7% prediabetes threshold, and up only modestly from 5.3% in 2016. Taken in isolation, no issue. But paired with your rising insulin and HOMA-IR, it's consistent with the same insulin-sensitivity story.",
    actions: [
      "Same levers as Insulin / HOMA-IR — strength train, cut refined carbs, sleep enough.",
      "Post-meal walks are the cheapest effective daily lever.",
    ],
  },
  "Apolipoprotein B": {
    severity: "watch",
    headline: "Tracking your LDL trend — particle count is rising",
    detail: "46 → 72 mg/dL since 2016. Still under the typical 90 mg/dL target for average-risk adults, but the direction matches your LDL climb and confirms it's a real rise in atherogenic particles, not a measurement quirk.",
    actions: [
      "Same levers as LDL Cholesterol — saturated fat down, fiber up, fatty fish up.",
      "ApoB is arguably a better recheck target than LDL — ask your doctor to include it next time.",
    ],
  },
  "Omega Index": {
    severity: "watch",
    headline: "Well below the cardiovascular target",
    detail: "2.4% in your last reading. The mortality-benefit target is ≥8%, and hunter-gatherer populations typically sit at 10–12%. Low Omega Index is associated with higher cardiovascular and all-cause mortality even in otherwise healthy adults.",
    actions: [
      "Two servings of fatty fish per week (salmon, sardines, mackerel, herring) — each serving moves the index about 1%.",
      "Or 2–3g EPA+DHA supplementation daily from fish or algae oil. It takes 3–4 months to move the index meaningfully.",
      "Reducing industrial seed oils helps the omega-6:omega-3 ratio side of this.",
    ],
  },

  // ─── benign / lab-artifact notes ───
  "Albumin": {
    severity: "info",
    headline: "Mildly elevated — almost always benign",
    detail: "5.4 g/dL vs. a 3.6–5.1 reference. Typically reflects hydration at draw time or inter-lab variation, not a real change in liver protein synthesis.",
    actions: [
      "Hydrate normally before your next lab draw.",
      "As long as total protein and A/G ratio stay normal (yours do), this is nothing to chase.",
    ],
  },
  "Arachidonic Acid": {
    severity: "info",
    headline: "Likely a lab-reference mismatch, not a real deficiency",
    detail: "2.6% flagged against a 5.2–12.9% range. For red-cell AA, most published reference intervals sit well below this — so the flag is probably a reference-interval artifact rather than a real low. Your EPA:AA ratio (0.1) is within the recommended range, which is what actually matters for inflammation balance.",
    actions: [
      "Focus on the Omega Index and EPA:AA Ratio — they capture the clinically relevant signal.",
      "Low red-cell AA is essentially never a deficiency state to correct.",
    ],
  },
};
