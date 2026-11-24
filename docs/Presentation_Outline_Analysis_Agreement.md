# Presentation Outline — Aim, Methods, and Analysis Agreement

> **Purpose:** Slide map for the analysis-agreement meeting. Spoken through-line: [Presentation_Narrative_Analysis_Agreement.md](Presentation_Narrative_Analysis_Agreement.md).  
> **Audience:** Lab / collaborators  
> **Suggested length:** ~15–20 min presentation + discussion  
> **Related:** [RESEARCH_DESIGN.md](Important/RESEARCH_DESIGN.md), [Study_Hypotheses_and_Models.md](Study_Hypotheses_and_Models.md), `scripts/analyze_accuracy_generalization.py`  
> **Last updated:** 2026-11-23

---

## How to use these two docs

| Doc | Role |
|---|---|
| **Narrative** | What you *say* — continuous story |
| **Outline (this file)** | What you *show* — slide titles, bullets, models, figures, decisions |

Slide rhythm for every evidence beat: **question → if true, what we see → how we test / figure → ambiguity → next question.**

---

## Visual presentation notes

This meeting is about **what would count as evidence**, not about interpreting final results. Visuals should serve that goal.

### Predicted vs. preliminary data (policy)

| Situation | What to show | How |
|---|---|---|
| **Default for E0–E3** | **Predicted-pattern plots** (schematic) | Expected slope / distribution shape; axis labels matching planned indices; reference lines (chance, Acc = 0, Acc = 0.40); mark clearly as *Predicted* |
| **Preliminary data available** | Prediction **first**; real plot **optional, separate** | Do **not** put real dots on the same slide as the hypothesis prediction. If shown, label *Preliminary / illustrative / underpowered — not for inference* |
| **No usable data yet** | Predicted patterns alone | Sufficient for locking the analysis plan |
| **Best early use of real data** | E0 learning gate only, or backup if asked | Soft reality check that the task works — not a results tour |

**Rule:** Predictions decide the analysis; preliminary plots are a soft check, not the centerpiece.

### How to draw predicted plots

- Keep them schematic: smooth expected curve or OLS-style line + light cloud of hypothetical points (or no points — line + band only).
- Match the eventual real figure layout (same axes, panels, reference lines) so the locked design transfers to the pipeline outputs.
- Prefer **one predicted panel per claim**; belief vs. approach as two panels only when both are co-primary (E1/E2).
- Avoid dense tables, heatmaps, or formula walls on prediction slides — those belong in backup.

### Where visuals appear (summary)

| Slide | Visual | Type |
|---|---|---|
| 0 Framing | None / simple path diagram | Structure |
| 1 Claim | Optional: encountered → novel sketch | Concept |
| 2 Accounts | Two-column signature icons (approach / belief / confidence) | Concept |
| 3 Task | Trial mockup or phase flowchart | Methods |
| 4 Learning priority | Predicted rising vs. flat learning curve | Predicted |
| 5 Chain map | Vertical question flowchart only | Structure |
| 6 E0 | Predicted learning curve + Acc distribution | Predicted (+ optional real, separate) |
| 7 E1 | Predicted Acc vs. novel bias (belief \| approach) | Predicted |
| 8 E2 | Predicted partial-residual plot (M2); optional cartoon total vs. adjusted | Predicted |
| 9 E3 | Predicted confidence associations | Predicted |
| 10 Decisions | Minimal; refer back to hero predicted figures | Text |
| Backup | Real pipeline figures if asked; construct card; full figure map | Optional |

---

## Meeting goal

Agree on **what counts as evidence** for the claim — and therefore constructs, models, figures, and inclusion rules. Not final result interpretation.

**Decision ask:** Lock the E0→E3 evidence package for the next pilot write-up / analysis memo.

---

## Slide 0 — Framing

**Title:** What we need to agree on today

- Not: “what did the data show?”
- Yes: “what would count as evidence — and how do we analyze/plot that?”
- Path: aim → task → evidence chain (models & figures nested) → lock decisions

**Say:** We’re here to lock the evidence package, not interpret final results.

**Visual:** Optional one-line path diagram (Aim → Task → Evidence E0–E3 → Decisions). No data plots.

---

## Slides 1–2 — Aim

### Slide 1 — Core claim

**Title:** The claim

Uncertainty in social interactions shapes how much people **generalize** from encountered experience to novel group members — **even after controlling for attitudes already formed toward encountered targets.**

**Emphasize the last clause:**

- Without it, “generalization” ≈ they already dislike that group and keep disliking new members.
- With it: generalization **beyond** already-formed attitudes toward known targets.

**Visual:** Optional simple sketch — a few “encountered” faces and one “novel” face under the same group cue — to make the last clause concrete. Text-first is fine.

### Slide 2 — Why uncertainty could work two ways

| Account | Signature |
|---|---|
| **Calibrated caution** | Avoidance ↑; beliefs relatively intact; confidence ↓ |
| **Uncertainty-modulated negativity** | Avoidance ↑; beliefs inflated; confidence ↓ |

**Bridge → methods:** These pull apart only if we measure **approach**, **belief**, and **confidence** separately — and can split **encountered** vs. **novel** faces.

**Visual:** Two-column comparison; small icons for approach / belief / confidence. No empirical plots yet.

---

## Slides 3–5 — Methods

### Slide 3 — Task in one view

| Phase | What happens |
|---|---|
| **1 Learning** | Choose among faces; probabilistic +1 / −5 |
| **2 Test** | Rate **encountered + novel** faces: approach, *p̂*(punish), confidence |
| **3** | Ratings / debrief |

**Design levers that serve the claim:**

- Exposure equal vs. majority–minority (uncertainty / sparsity)
- Matched good/bad base rates across colors → group contrasts are **non-veridical**
- Encountered vs. novel in Phase 2 → separates formed attitudes from generalization

**Visual:** Phase flowchart and/or a single Phase 1 trial mockup (2×2 faces → outcome). Highlight “encountered vs. novel” on the Phase 2 branch. Still no result plots.

### Slide 4 — Immediate priority: a working learning task

**Title:** First: can people learn these faces?

Before theory claims are interpretable:

- People must distinguish good vs. bad individuals **across time to a satisfying level**
- If learning is near floor, Acc → generalization tests do not land

**Preview of gate (full test = E0):** rising Phase 1 accuracy; Phase 2 Acc on encountered faces > 0 (toward veridical ~0.40).

**Transition → evidence:** That gate is also where the evidence chain starts.

**Visual:** Side-by-side *predicted* sketches — rising learning curve vs. flatlined failure. Label both *Predicted*. Real pilot learning curve only if you later show E0 data on a separate slide.

### Slide 5 — Evidence chain overview (map only)

```
E0  Can people learn these faces at all?
      ↓  learning works, but Acc varies
E1  Do better learners show more bias about new faces?
      ↓  yes — but maybe just stronger attitudes toward known faces?
E2  Does Acc still predict novel bias after controlling for encountered attitudes?  ← aim-critical
      ↓  yes — but Acc ≠ felt uncertainty
E3  Does confidence track Acc / generalization as the account predicts?
```

**One line on pipeline (do not tour it):** same script builds indices → models → figures for E0–E3 (`analyze_accuracy_generalization.py`).

**Visual:** The flowchart alone (large type). Do not preview all figures here.

---

## Slides 6–9 — Evidence (models & plots live here)

### Slide 6 — E0: Learning gate

**Question:** Can people learn who is good vs. bad?

**If true:** Phase 1 accuracy rises above chance; Acc distribution not piled at 0 (pulled toward ~0.40).

**Test / figures:** Learning curves (Fig 7); Acc distribution (Fig 1); optional person profiles (Fig 5a).

**Agree:** What counts as “satisfying” (soft calibration vs. hard exclusion)?

**→ Next question:** People learn — but Acc varies. Does that variation predict bias about *new* faces?

**Visual:**
- Primary: *Predicted* learning curve (above chance) + *Predicted* Acc distribution with lines at 0 and ~0.40.
- Layout match eventual Figs 7 & 1.
- If preliminary data exist: show on a **follow-up** slide only, labeled preliminary; do not overwrite the prediction slide.

---

### Slide 7 — E1: Total Acc → novel bias

**Question:** Do better learners show more bias about novel faces?

**If true:** Acc positively relates to novel belief and/or approach stereotype.

**Constructs (introduce here, not earlier):**

| Index | Definition |
|---|---|
| Acc | Phase 2 encountered: `[mean(p̂\|bad) − mean(p̂\|good)] / 100` |
| Novel belief bias | `[mean(p̂\|minority) − mean(p̂\|majority)] / 100` |
| Novel approach bias | `[mean(slider\|majority) − mean(slider\|minority)] / 100` |

**Model M1:** `novel_stereotype ~ Acc` (belief & approach).  
**Figure:** Fig 2.

**→ Next question (ambiguity):** Better learners show more novel bias — but they may also hold stronger attitudes toward people they *already met*, and those attitudes simply reappear for new faces. So is this “stereotype more in general,” or generalization beyond encountered attitudes?  
**Ask:** Does Acc still predict novel bias after controlling for encountered attitudes?

**Visual:**
- Primary: *Predicted* two-panel scatter (belief | approach): Acc on x, novel bias on y, positive slope, optional Acc = 0.40 reference. Caption: *Predicted pattern under E1 / M1*.
- Keep construct definitions as a compact side card or footnote, not a competing visual.
- Real Fig 2 only as optional separate preliminary slide.

---

### Slide 8 — E2: Aim-critical control

**Question:** Is the Acc → novel link more than already-formed attitudes toward known faces?

**If true:** Acc remains associated with novel stereotype after including encountered stereotype; partial-residual slope stays positive.

**Model M2:** `novel_stereotype ~ Acc + encountered_stereotype`  
→ **direct operationalization of the project aim.**

**Figures:** Fig 3 (FWL partial residuals; default); Fig S1 (Y-only sensitivity).

**Agree:** Default visualization = Fig 3 or Fig S1?

**→ Next question (gap):** If E2 holds, we have the generalization claim — but Acc is individuation, not felt uncertainty.  
**Ask:** Does confidence move with Acc and/or generalization strength as the account predicts?

**Visual:**
- Helpful opener: small cartoon of “total association (M1)” vs. “after adjusting for encountered attitudes (M2).”
- Primary: *Predicted* partial-residual plot matching Fig 3 (positive slope remains). Optionally show *Predicted* Fig S1 beside it when asking which should be the default hero figure.
- Do not debate real residual clouds here unless on a clearly marked preliminary backup slide.

---

### Slide 9 — E3: Uncertainty signature

**Question:** Does confidence track Acc and generalization as predicted?

**If true (account-dependent):** Confidence co-varies with Acc and/or |novel bias|; with belief vs. approach, helps separate calibrated caution from belief distortion.

**Test / figure:** Confidence × Acc / |novel bias| (Fig 4).  
**Support (backup):** Fig 5 profiles; Fig 6 correlation heatmap.

**Closing line:**  
E0 learn → E1 Acc relates to novel bias → E2 not just encountered attitudes → E3 confidence as uncertainty signature.  
**That is the package to lock.**

**Visual:**
- Primary: *Predicted* panels for confidence vs. Acc and confidence vs. |novel bias| (Fig 4 layout).
- State the expected direction in a one-line caption under each panel.
- Fig 5 / Fig 6 stay in backup — too dense for the main arc.

---

## Slide 10 — Decisions to lock

Walk item-by-item (tie each to an evidence step):

| # | Decision | Ties to |
|---|---|---|
| 1 | “Satisfying learning” rule (soft note vs. hard exclude) | E0 |
| 2 | Acc primary source: Phase 2 encountered (Phase 3 sensitivity?) | E0–E2 |
| 3 | Belief + approach co-primary; confidence as E3 support | E1–E3 |
| 4 | M2 as aim-critical primary model | E2 |
| 5 | Default M2 plot: Fig 3 (FWL) vs. Fig S1 | E2 |
| 6 | Equal-exposure: exclude vs. exploratory | E1–E2 |
| 7 | Collapse Majority-R/B + color covariate? | design / E1–E2 |
| 8 | Experimental-only vs. include Control | sample |
| 9 | LMM minority × imbalance path: co-primary / secondary / deferred | vs. this chain |
| 10 | Wording & units (bias language; probability 0–1; Acc = 0.40 line) | all figures |

**Next step:** Freeze → re-run pipeline → results memo in E0→E3 order. Record decisions in `docs/design-decisions.md`.

**Visual:** Text checklist. If useful, thumbnail the two competing *predicted* M2 figures when discussing item 5 — still predicted, not real results.

---

## Backup slides (only if asked)

- Construct cheat-sheet (Acc; encountered vs. novel belief/approach; confidence 0–1; non-veridical group contrasts)
- Full figure map:

| Evidence | Figure | Role |
|---|---|---|
| E0 | Fig 7, Fig 1 (5a) | Learning gate |
| E1 | Fig 2 | M1 total association |
| E2 | Fig 3 (S1) | M2 aim-critical |
| E3 | Fig 4 | Confidence signature |
| Support | Fig 5, Fig 6 | Profiles / correlations |

- Style: APA/APS; captions outside image; colorblind-safe; 95% CI; PNG + PDF
- **Optional preliminary-results appendix:** real pipeline outputs, each slide titled *Preliminary (illustrative)*; present only after the predicted E0–E3 sequence, or on request

---

## Suggested timing

| Block | Slides | ~Min |
|---|---|---|
| Framing + aim | 0–2 | 3 |
| Methods + chain map | 3–5 | 4 |
| E0–E3 | 6–9 | 8 |
| Lock decisions | 10 | 5+ discussion |

---

## Reminder

Full spoken text: [Presentation_Narrative_Analysis_Agreement.md](Presentation_Narrative_Analysis_Agreement.md).  
Do not present a standalone pipeline or figure tour — each model/figure appears only when its evidence question does.  
Lead with **predicted** visuals for hypotheses; keep real preliminary plots secondary and clearly labeled.
