# Data Analytic Plan — Social Exposure Theory Pilot

**Date:** 2026-02-26
**Experiment version:** pilot (N=40 Phase 1 faces, E=12, PILOT_MODE=true)
**Status:** Pre-registered analytic template; to be finalized before data collection

---

## 1. Theoretical Background and Testable Claims

The problem statement advances two competing mechanistic accounts of exposure-driven outgroup bias:

| Account | Core claim | Diagnostic signature |
|---|---|---|
| **Calibrated uncertainty** | Sparse exposure → imprecise group-level estimates → rational caution without belief distortion | Avoidance ↑, punishment probability estimate unchanged, confidence ↓ |
| **Uncertainty-modulated negativity bias** | Sparse exposure → amplified influence of negative events → inflated punishment probability estimates | Avoidance ↑, punishment probability estimate ↑, confidence ↓ |

These signatures are distinguishable because the experiment now collects all three DVs in Phase 2: approach-avoidance, punishment probability, and confidence.

---

## 2. Hypotheses

### H1 — Behavioral Generalization (Primary)
Participants in the majority-minority condition will show greater avoidance of novel faces belonging to the minority-color group than to the majority-color group.

> **DV:** `phase2_slider` → `slider_rating`
> **Contrast:** minority-colored novel faces vs. majority-colored novel faces, majority-minority condition only
> **Prediction:** `slider_rating` lower for minority-colored faces (more avoidance)

### H2 — Belief Distortion
Participants will assign higher punishment probability to novel minority-colored faces than to novel majority-colored faces.

> **DV:** `phase2_probability` → `probability_punishment`
> **Contrast:** same as H1
> **Prediction:** `probability_punishment` higher for minority-colored faces
> **Interpretation:** If supported alongside H1, suggests distorted belief formation rather than calibrated caution

### H3 — Calibrated vs. Distorted (H1 vs. H2 Dissociation)
The accounts make qualitatively different predictions about the relative magnitude of avoidance vs. belief effects:

- *Calibrated uncertainty:* H1 supported, H2 null (or small)
- *Negativity bias:* Both H1 and H2 supported, with H2 mediating H1

> **Test:** Compare standardised effect sizes of H1 and H2; run mediation H1 ← H2 → `slider_rating`
> **Key coefficient:** `probability_punishment` as mediator between minority_status → `slider_rating`

### H4 — Epistemic Uncertainty
Participants will report lower confidence in punishment probability estimates for minority-colored novel faces.

> **DV:** `phase2_confidence` → `confidence_rating`
> **Contrast:** minority vs. majority novel faces
> **Prediction:** `confidence_rating` lower for minority-colored faces
> **Note:** This test is valid under *both* accounts (uncertainty is the shared antecedent); it confirms the manipulation worked

### H5 — Phase 1 Learning (Manipulation Check)
Learning occurred as intended in the experimental condition: participants increasingly chose good-labeled faces over blocks.

> **DV:** `choice` → `chosen_face_is_good` (proportion correct per block)
> **IV:** `block` (0–11), `p1_type` ('experimental' vs. 'control')
> **Prediction:** Monotonically increasing correct-choice rate in experimental condition; flat in control

### H6 — Phase 3 Belief Calibration (Sanity Check)
Phase 3 punishment probability ratings for Phase 1 faces should approximately reflect the actual good/bad assignment (good face: ~10% punishment, bad face: ~50% punishment).

> **DV:** `phase3_probability` → `probability_punishment`
> **Grouping:** `face_is_good`
> **Prediction:** Good faces rated ~10–30%, bad faces ~50–70%; validates that participants learned face-level values

### H7 — Individual Differences as Behavioral Regressors
Within the majority-minority condition, individual variation in Phase 1 learning quality (slope of correct-choice rate over blocks) should predict the magnitude of Phase 2 minority-group bias.

> **Regressor:** individual learning slope (from H5 model, per participant)
> **DV:** individual minority − majority difference in `slider_rating` and `probability_punishment` (Phase 2)
> **Prediction:** Steeper learning slope → larger Phase 2 bias
> **Status:** Exploratory; underpowered in pilot but sets up main study pre-registration

---

## 3. Current Data Structure

### 3.1 Global Properties (every row)

All trial rows carry these fields via `jsPsych.data.addProperties`:

| Field | Values | Notes |
|---|---|---|
| `participant_id` | Prolific PID or null | null in lab runs |
| `study_id` | Prolific study ID or null | |
| `session_id` | Prolific session ID or null | |
| `condition_code` | e.g., `'RXE'` | 3-char code |
| `condition` | `'equal'`, `'majority-minority'` | Phase 1 exposure type |
| `majority_group` | `'red'`, `'blue'`, or null | null in equal condition |
| `p1_type` | `'experimental'`, `'control'` | |
| `p2_exposure` | `'equal'`, `'majority-red'`, `'majority-blue'` | always `'equal'` in pilot (PILOT_MODE=true) |
| `debug_mode` | boolean | exclude `true` rows from analysis |

### 3.2 Phase 1 — Choice Trials (`task='choice'`, `phase=1`)

| Field | Type | Notes |
|---|---|---|
| `block` | int 0–11 | Exposure block index |
| `trial_in_block` | int | Position within block |
| `chosen_face_id` | int 0–39 | ID of selected face |
| `chosen_face_color` | `'red'`/`'blue'` | Color of chosen face |
| `chosen_face_is_good` | boolean | True = good (90/10 payoff) |
| `outcome` | +1 or −5 | Received payoff |
| `total_score` | int | Cumulative Phase 1 score |
| `rt` | float (ms) | Auto-recorded by plugin |
| `response` | 0–3 | Panel index of chosen face |
| `all_outcomes` | array | Control condition only: outcomes for all 4 faces |

### 3.3 Phase 1 — Feedback Trials (`task='feedback'`, `phase=1`)

Timing-only; no analytic data beyond phase/task markers.

### 3.4 Phase 2 — Approach-Avoidance (`task='phase2_slider'`, `phase=2`)

| Field | Type | Notes |
|---|---|---|
| `face_id` | string `'n001'`–`'n120'` | Novel face identity |
| `face_color` | `'red'`/`'blue'` | |
| `face_is_good` | boolean | Underlying latent label |
| `image_path` | string | Full stimulus path |
| `slider_rating` | 0–100 | 50=neutral, <50=avoid, >50=approach |
| `correct` | boolean or null | null if slider_rating == 50 |
| `outcome` | +1 or −5 | Scoring outcome |
| `phase2_score` | int | Cumulative Phase 2 score |

### 3.5 Phase 2 — Punishment Probability (`task='phase2_probability'`, `phase=2`)

| Field | Type | Notes |
|---|---|---|
| `face_id` | string | Same face as preceding slider trial |
| `face_color` | `'red'`/`'blue'` | |
| `face_is_good` | boolean | |
| `image_path` | string | |
| `probability_punishment` | 0–100 | Estimated punishment probability |

### 3.6 Phase 2 — Confidence (`task='phase2_confidence'`, `phase=2`)

| Field | Type | Notes |
|---|---|---|
| `face_id` | string | Same face as preceding trials |
| `face_color` | `'red'`/`'blue'` | |
| `face_is_good` | boolean | |
| `image_path` | string | |
| `confidence_rating` | 0–100 | 0=not at all confident, 100=extremely confident |

### 3.7 Phase 3 — Punishment Probability (`task='phase3_probability'`, `phase=3`)

| Field | Type | Notes |
|---|---|---|
| `face_id` | int 0–39 | Phase 1 face identity |
| `face_color` | `'red'`/`'blue'` | |
| `face_is_good` | boolean | |
| `probability_punishment` | 0–100 | |

---

## 4. Derived Variables (computed at analysis time)

| Derived variable | Source | Formula / method |
|---|---|---|
| `minority_status` | `condition`, `majority_group`, `face_color` | True if face_color ≠ majority_group (in majority-minority condition); undefined in equal condition |
| `trial_number` | `block`, `trial_in_block` | `block * n_trials_per_block + trial_in_block` (n_trials_per_block = TOTAL_FACES / FACES_PER_TRIAL = 10) |
| `choice_rate_minority` | Phase 1 choices | Proportion of trials on which participant chose a minority-colored face |
| `learning_slope` | Phase 1 `chosen_face_is_good` × `block` | Linear trend coefficient from logistic regression: correct ~ block, per participant |
| `p2_bias_approach` | Phase 2 `slider_rating` | Mean(minority) − Mean(majority), per participant |
| `p2_bias_probability` | Phase 2 `probability_punishment` | Mean(minority) − Mean(majority), per participant |
| `p2_bias_confidence` | Phase 2 `confidence_rating` | Mean(minority) − Mean(majority), per participant (negative = less confident about minority) |
| `p3_calibration_error` | Phase 3 `probability_punishment`, `face_is_good` | |mean(good faces) − 10| + |mean(bad faces) − 50| (lower = better calibrated) |

---

## 5. Analysis Plan

### 5.1 Data Quality and Exclusions

1. Remove rows where `debug_mode = true`
2. Remove participants who fail attention checks (to be added — see Section 7)
3. Remove participants with Phase 1 accuracy ≤ 55% in experimental condition (near-chance; suggests non-engagement)
4. Flag participants who never move Phase 2/3 sliders (all responses = 50)
5. For pilot: inspect distributions manually before applying cutoffs

### 5.2 Phase 1 Analysis (H5 — Learning Check)

**Unit of analysis:** trial (nested in participant)

```
Model: chosen_face_is_good ~ block * p1_type + (block | participant_id)
```

- Expect significant `block` coefficient and `block × p1_type` interaction (experimental condition learns faster / at all)
- Plot: mean proportion correct per block, separately for experimental vs. control

**Derived output used downstream:** Per-participant `learning_slope` = random slope on `block` from above model

### 5.3 Phase 2 Primary Analyses (H1–H4)

**Data preparation:** Left-join Phase 2 slider, probability, and confidence rows on `face_id` per participant (they share the same `face_id` for each novel face). Add derived `minority_status`.

Restrict to majority-minority condition participants for the core contrasts (equal condition serves as a baseline/comparison group for effect sizes).

**H1 — Approach-Avoidance:**
```
Model: slider_rating ~ minority_status * condition + face_is_good +
       (minority_status | participant_id) + (1 | face_id)
```
Primary coefficient of interest: `minority_status:condition` (or minority_status within majority-minority condition only)

**H2 — Punishment Probability:**
```
Model: probability_punishment ~ minority_status * condition + face_is_good +
       (minority_status | participant_id) + (1 | face_id)
```

**H3 — Dissociation Test:**
- Compare standardized β for H1 vs. H2 using bootstrap CI on the difference
- If H2 mediates H1: `slider_rating ~ minority_status + probability_punishment + (1|participant_id)` — does minority_status coefficient shrink?

**H4 — Confidence:**
```
Model: confidence_rating ~ minority_status * condition + face_is_good +
       (minority_status | participant_id) + (1 | face_id)
```

### 5.4 Phase 3 Analysis (H6 — Calibration)

```
Model: probability_punishment ~ face_is_good * face_color +
       (face_is_good | participant_id)
```

Expected: Strong `face_is_good` effect (good faces rated ~lower punishment). Check whether minority-colored Phase 1 faces are rated differently from majority-colored Phase 1 faces of the same good/bad label (would indicate belief distortion even for learned faces).

### 5.5 Behavioral Regressors (H7, Exploratory)

```
Step 1: Compute per-participant learning_slope from Phase 1 (Section 5.2)
Step 2: Regress p2_bias_approach on learning_slope (between-subjects)
Step 3: Regress p2_bias_probability on learning_slope
```

Additionally, within majority-minority condition:
- `choice_rate_minority`: proportion of choices directed to minority faces in Phase 1
- Regress `p2_bias_approach` on `choice_rate_minority`
- **Interpretation:** Higher approach rate to minority in learning → weaker avoidance in generalization? (tests whether individual interaction patterns modulate bias)

### 5.6 Control vs. Experimental Comparison

In the control condition, all outcomes are random and visible for all 4 faces simultaneously. Participants receive equivalent outcome information but without choice-contingent feedback.

- Compare Phase 2 `p2_bias_approach` between `p1_type = 'experimental'` and `'control'`, within majority-minority condition
- If bias emerges in both: consistent with mere exposure effects
- If bias is larger in experimental: suggests outcome-contingent learning (RL mechanism) amplifies exposure effects

---

## 6. Data Label Gaps and Recommended Additions

The following data is not currently saved but would substantially expand analytic power. Listed by priority:

### Priority 1 — Add before data collection

**6.1 Phase 1 trial panel composition**

*What's missing:* The identities of all 4 faces shown in each trial panel
*Why needed:* To compute per-face interaction frequency (number of trials a face was available to be chosen) and per-group panel composition statistics
*Current workaround:* The design guarantees each face appears exactly `EXPOSURES_PER_FACE = 12` times (i.e., appears in 12 trial panels), so total exposure per face is fixed and known. However, we cannot compute trial-level statistics like "how many minority faces appeared in this panel" without the panel composition.

*Recommended addition to Phase 1 `data` function in `experiment.js`:*
```javascript
data: function() {
    const trialFaces = jsPsych.evaluateTimelineVariable('faces');
    return {
        task: 'choice',
        phase: 1,
        block: jsPsych.evaluateTimelineVariable('block'),
        trial_in_block: jsPsych.evaluateTimelineVariable('trialInBlock'),
        faces_in_trial: trialFaces.map(f => ({ id: f.id, color: f.color, is_good: f.isGood }))
    };
}
```

This enables:
- Within-trial minority proportion as a trial-level moderator
- P(choose minority | minority available) as an individual-differences measure
- Full RL model fitting (reward prediction error requires knowing which options were available)

**6.2 Global trial counter**

*What's missing:* A monotonically increasing trial index across the full Phase 1
*Why needed:* `block` and `trial_in_block` require two-step reconstruction; some analyses (learning curves, RT trends) are cleaner with a single counter
*Recommended addition:* Add `trial_number: trialCount` (using the existing `trialCount` variable, incremented in `on_finish`) to the Phase 1 `data` function, or derive offline as `block * 10 + trial_in_block`

### Priority 2 — Consider for main study

**6.3 Phase 2 trial order**

*What's missing:* The presentation order of novel faces in Phase 2
*Why needed:* Order effects (primacy/recency) may influence ratings; face identity counterbalancing analysis
*Recommended addition:* Save `trial_number` in Phase 2 data (analogous to Phase 1 counter)

**6.4 Phase 3 image path**

*What's missing:* `image_path` field in Phase 3 (present in Phase 2 but absent in Phase 3 `phase3_probability` data)
*Recommended addition:* Add `image_path: face.imagePath` to Phase 3 data function for consistency

**6.5 Attention checks**

*What's missing:* No within-task attention checks
*Recommended addition:* 1–2 "catch" trials in Phase 2 with clearly good/bad faces (e.g., extreme reward/punishment signals visible from prior context) to validate engagement; filter participants who fail

**6.6 Linking Phase 2 trial triplets explicitly**

*Current structure:* The three Phase 2 trials per face (`phase2_slider`, `phase2_probability`, `phase2_confidence`) share `face_id` but have no explicit `triplet_index` counter
*Why needed:* Ensures unambiguous row-level joining even if data is exported in long format
*Recommended addition:* Save `face_trial_index` (integer 0–N_faces-1) to all three Phase 2 trial types

---

## 7. Summary Table: Hypotheses × Data

| Hypothesis | Primary field(s) | Statistical test | Current data sufficient? |
|---|---|---|---|
| H1 Behavioral generalization | `phase2_slider.slider_rating` | LMM: slider_rating ~ minority_status | ✓ Yes |
| H2 Belief distortion | `phase2_probability.probability_punishment` | LMM: prob_punishment ~ minority_status | ✓ Yes |
| H3 Calibrated vs. distorted | Both of above | Effect size comparison + mediation | ✓ Yes |
| H4 Epistemic uncertainty | `phase2_confidence.confidence_rating` | LMM: confidence ~ minority_status | ✓ Yes |
| H5 Phase 1 learning | `choice.chosen_face_is_good` × `block` | LMM: correct ~ block * p1_type | ✓ Yes |
| H6 Phase 3 calibration | `phase3_probability.probability_punishment` | LMM: prob_punishment ~ face_is_good | ✓ Yes |
| H7 Individual regressors | `learning_slope` → Phase 2 bias | Between-subjects OLS | Partial (panel composition missing) |
| Full RL model fitting | Panel composition | Computational model | ✗ Requires 6.1 |

---

## 8. Pilot-Specific Notes

- **Sample size:** Pilot target is small (n ≈ 6–12 per condition). Analyses will be descriptive / pattern-confirming rather than inferential. Effect sizes and CI widths will inform power analysis for the main study.
- **PILOT_MODE:** `p2_exposure` is locked to `'equal'` for all participants; Phase 2 exposure manipulation is not active.
- **Active conditions for pilot:** The 3 (P1 Exposure: Equal, Majority-Red, Majority-Blue) × 2 (P1 Type: Experimental, Control) = 6-condition design. Condition assignment via `?c=` URL parameter.
- **Minority good-rate:** At N=40, the minority group achieves 75% good faces (6/8) rather than the target 70% due to integer rounding. H6 should reflect this (expected Phase 3 minority good-face rating ~25% punishment probability, not ~30%).
