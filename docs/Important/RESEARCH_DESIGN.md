# Study 1 Pilot — Research Design & Data Analytic Plan

> **Status:** Pre-pilot | **Last updated:** 2026-02-26
>
> Covers study rationale, experimental conditions, stimulus parameters, full data structure, hypotheses, and analysis plan. For implementation and deployment, see [PROJECT_SETUP.md](PROJECT_SETUP.md).

---

## 1. Overview

### Research Question

Do people generalize learning about individual group members to novel members of the same group, and does exposure frequency moderate this generalization?

### Core Hypothesis

Participants repeatedly exposed to members of one group (vs. balanced exposure to both groups) will develop group-level approach-avoidance tendencies that transfer to novel individuals from those groups — even when both groups have **identical** reward/punishment base rates. Any group-level bias arises from exposure frequency, not actual outcome differences.

### Study Design at a Glance

| Component | Description |
|---|---|
| **Phases** | Phase 1 (Learning) → Phase 2 (Generalization Test) → Phase 3 (Explicit Rating) |
| **Full design** | Phase 1 Exposure (3) × Phase 1 Type (2) × Phase 2 Exposure (3) = 18 between-subjects conditions |
| **Pilot design** | Phase 1 Exposure (3) × Phase 1 Type (2) = **6 active conditions** (P2 Exposure fixed to Equal via `PILOT_MODE: true`) |
| **Platform** | Online (Prolific), jsPsych 8.x |
| **Est. duration** | ~35 min (Phase 1 ≈10 min, Phase 2 ≈12 min, Phase 3 ≈7 min, surveys ≈5 min) |
| **Compensation** | $15/hr + performance bonus (100 points = $1.00; `POINTS_TO_DOLLARS: 0.01`) |

---

## 2. Experimental Conditions

### Factor 1 — Phase 1 Exposure (3 levels)

Controls the **number of unique group members** encountered during Phase 1. Every face still appears exactly 12 times regardless of condition.

| Level | Red faces (unique) | Blue faces (unique) |
|---|---|---|
| Equal | 20 | 20 |
| Majority-Red | 32 | 8 |
| Majority-Blue | 8 | 32 |

> Majority-Red and Majority-Blue are the same manipulation with color counterbalanced. They can be collapsed into a single "Majority" factor with majority-group color as a covariate.

### Factor 2 — Phase 1 Type (2 levels)

| Level | Description |
|---|---|
| **Experimental** | Participant selects one of 4 faces; only the chosen face's outcome (+1 or −5) is revealed. Bias must arise through selective experience. |
| **Control** | Same trial structure, but all four faces' outcomes are revealed simultaneously after each choice. Selective-experience learning is eliminated; full information is available every trial. |

### Factor 3 — Phase 2 Exposure (3 levels) — *Disabled during pilot*

Novel face composition during the generalization test (Phase 2).

| Level | Red novel faces | Blue novel faces | Pilot status |
|---|---|---|---|
| Equal | 10 | 10 | **Active** |
| Majority-Red | 16 | 4 | Disabled (`PILOT_MODE: true`) |
| Majority-Blue | 4 | 16 | Disabled |

This factor tests whether the composition of the generalization context interacts with prior Phase 1 learning.

### Condition Codebook

Conditions are assigned via a single URL parameter `?c=<CODE>`. The 3-character code encodes all three factors:

- **1st char** — P1 Exposure: `E` (Equal), `R` (Red-majority), `B` (Blue-majority)
- **2nd char** — P1 Type: `X` (Experimental), `C` (Control)
- **3rd char** — P2 Exposure: `E` (Equal), `R` (Red-majority), `B` (Blue-majority)

| Code | P1 Exposure | P1 Type | P2 Exposure | Pilot |
|---|---|---|---|---|
| `EXE` | Equal | Experimental | Equal | **Active** |
| `ECE` | Equal | Control | Equal | **Active** |
| `RXE` | Majority-Red | Experimental | Equal | **Active** |
| `RCE` | Majority-Red | Control | Equal | **Active** |
| `BXE` | Majority-Blue | Experimental | Equal | **Active** |
| `BCE` | Majority-Blue | Control | Equal | **Active** |
| `EXR`, `EXB`, `ECR`, `ECB` | Equal | Exp / Control | Red / Blue | Disabled |
| `RXR`, `RXB`, `RCR`, `RCB` | Majority-Red | Exp / Control | Red / Blue | Disabled |
| `BXR`, `BXB`, `BCR`, `BCB` | Majority-Blue | Exp / Control | Red / Blue | Disabled |

Full codebook defined in `src/utils/config.js → CONFIG.CONDITION_CODES`. Codes are opaque to participants (cannot infer condition from the URL).

---

## 3. Phase 1 — Social Learning

### Participant Experience

**Experimental:** Four faces appear in a 2×2 grid with colored (red or blue) backgrounds. Participant clicks one face to "interact with." Feedback screen shows the outcome: **+1** (reward) or **−5** (punishment). Goal is to maximize total score.

**Control:** Identical trial structure, but the feedback screen reveals all four faces' outcomes simultaneously (not just the chosen face). The participant still earns points from their chosen face only.

### Reward Mechanism

Each face is secretly labeled **good** or **bad** (never revealed to participants). The label determines outcome probabilities:

| Face type | P(reward = +1) | P(punishment = −5) | Config key |
|---|---|---|---|
| Good person | 90% | 10% | `GOOD_PERSON_PROBS` |
| Bad person | 50% | 50% | `BAD_PERSON_PROBS` |

Both groups have **identical** good:bad ratios (70:30, `GOOD_BAD_RATIO: [0.7, 0.3]`). Any group-level difference in behavior reflects exposure frequency, not outcome structure.

### Trial Generation & Sampling

Phase 1 uses a **block design**: `EXPOSURES_PER_FACE = 12` blocks, each independently shuffling all 40 faces and chunking them into groups of 4. This guarantees exactly **12 on-screen appearances per face** — deterministic, not probabilistic.

| Property | Value |
|---|---|
| Total faces | 40 |
| Blocks (= exposures per face) | 12 |
| Trials per block | 40 / 4 = **10** |
| Total Phase 1 trials | **120** |
| E[interactions per face] | 12 / 4 = **3.0** |
| P(≥1 interaction with any face) | 1 − (¾)¹² ≈ **96.8%** |

Sampling strategy: in the majority condition, the majority group needs 32 faces from a pool of 32, and the minority group needs 8 from a pool of 8 — exact, no oversampling needed at N=40. Within-trial duplicates are impossible (each block is a single shuffle of all 40 faces).

### Good/Bad Counts by Condition

`GOOD_BAD_RATIO = 0.70` applied independently within each color group.

| Condition | Red (N) | Good red | Bad red | Blue (N) | Good blue | Bad blue |
|---|---|---|---|---|---|---|
| Equal | 20 | 14 | 6 | 20 | 14 | 6 |
| Majority-Red | 32 | 22 | 10 | 8 | **6 (75%)** | 2 |
| Majority-Blue | 8 | **6 (75%)** | 2 | 32 | 22 | 10 |

> **Rounding note:** At N=40, the minority group has 8 faces. 70% × 8 = 5.6, which rounds to 6 → **75% good-face rate** (vs. target 70%, +5 pp deviation). Should be noted in preregistration.

### Diagnostic Quality

```
P(face was bad | punished)  = (0.50 × 0.30) / (0.50 × 0.30 + 0.10 × 0.70) ≈ 68%
P(face was good | punished) ≈ 32%  (noise)
```

~1 in 3 punishments come from good faces, creating deliberate ambiguity that requires sustained learning to overcome.

---

## 4. Phase 2 — Generalization Test

### Participant Experience

On each trial, the participant sees one **novel face** (never encountered in Phase 1) with a red or blue background, and answers **three questions** in sequence, each on a separate slider screen:

1. **Approach-avoidance:** "How willing are you to approach or avoid this person?" (0 = Strongly Avoid → 100 = Strongly Approach)
2. **Punishment probability:** "What is the probability that this person will give you a punishment?" (0% → 100%)
3. **Confidence:** "How confident are you in your estimate?" (0 = Not at all confident → 100 = Extremely confident)

No feedback is shown during Phase 2. Hidden outcomes are calculated using the same good/bad probabilities as Phase 1 and accumulated silently; the Phase 2 score is revealed at the end of the experiment.

### Trial Parameters

| Parameter | Value | Config key |
|---|---|---|
| Novel face pool | 120 identities (60 per color) | `TOTAL_NOVEL_FACES` |
| Faces shown per session | **20** | `PHASE2_TOTAL_TRIALS` |
| Questions per face | 3 (one slider screen each) | — |
| Total Phase 2 slider responses | 60 | — |
| Est. duration | ~12 min | — |
| Sampling | Without replacement (pool ≫ session count) | `generatePhase2Trials()` |
| Hidden scoring | Good/bad ratio same as Phase 1 (70:30) | `GOOD_BAD_RATIO` |

### Face Composition by P2 Exposure Level

| P2 Exposure | Red novel faces | Blue novel faces |
|---|---|---|
| Equal (pilot) | 10 | 10 |
| Majority-Red | 16 | 4 |
| Majority-Blue | 4 | 16 |

Ratios: equal = 50/50, majority = 80/20, configured in `PHASE2_EXPOSURE_RATIOS`.

---

## 5. Phase 3 — Explicit Rating

All 40 Phase 1 faces are shown one at a time in randomized order. For each face, participants answer **one question**:

- **Punishment probability:** "What is the probability that this person will give you a punishment?" (0%–100% slider)

No feedback is provided. Phase 3 allows direct comparison of explicit probability judgments (Phase 3) with behavioral tendency (Phase 2 approach-avoidance) and implicit probability estimates (Phase 2 probability question).

| Parameter | Value |
|---|---|
| Faces rated | All 40 Phase 1 faces |
| Questions per face | 1 |
| Total trials | 40 |
| Est. duration | ~7 min |

---

## 6. Stimuli

| Set | Identities | Images | Naming convention | Location |
|---|---|---|---|---|
| Phase 1 base faces | 40 | 80 (40 red + 40 blue) | `face_000_red/blue.png` – `face_039_red/blue.png` | `stimuli/faces/` |
| Phase 2 novel faces | 120 | 240 (120 red + 120 blue) | `face_n001_red/blue.png` – `face_n120_red/blue.png` | `stimuli/faces/` |
| **Total** | **160** | **320** | | |

All faces generated with FaceGen. Colored backgrounds added via `scripts/generate_colored_faces.py`. Original source images stored in `stimuli/fg_faces/`.

**Group membership cue:** Background color (red or blue) indicates group. Chosen as a minimal, non-social cue to avoid real-world category confounds. Face-to-group assignment is randomized per participant; group-to-color assignment is fixed within each condition code.

---

## 7. Data Structure

### Metadata (per participant)

Stored at `participants/{participant_id}/metadata`:

| Field | Type / Values | Description |
|---|---|---|
| `internal_id` | `internal_XXXXX` | Always-generated backup ID |
| `prolific_pid` | string | Prolific participant ID (primary key) |
| `study_id`, `session_id` | string | Prolific IDs |
| `condition_code` | e.g., `RXE` | 3-character condition code |
| `condition` | `equal` / `majority-minority` | P1 Exposure level |
| `majority_group` | `red` / `blue` / `null` | Majority color (null for equal) |
| `p1_type` | `experimental` / `control` | P1 Type |
| `p2_exposure` | `equal` / `majority-red` / `majority-blue` | P2 Exposure (always `equal` in pilot) |
| `pilot_mode` | bool | `true` during pilot |
| `timestamp` | ISO 8601 | Session start time |
| `debug_mode` | bool | `true` if `?debug=true` in URL |

### Phase 1 Trials (`task: 'choice'`)

| Field | Type | Description |
|---|---|---|
| `block` | int 1–12 | Block number |
| `trial_in_block` | int 1–10 | Trial index within block |
| `trial_number` | int | Global 1-indexed trial counter (across all 120 trials) |
| `faces_in_trial` | `[{id, color, is_good}]` | All 4 faces shown in the panel |
| `chosen_face_id` | int | ID of chosen face |
| `chosen_face_color` | `red` / `blue` | Group of chosen face |
| `chosen_face_is_good` | bool | Hidden good/bad label of chosen face |
| `outcome` | `1` / `-5` | Points earned this trial |
| `total_score` | int | Cumulative Phase 1 score |
| `rt` | ms | Response time |

### Phase 2 Trials

Three trial types per novel face, presented in fixed sequence. All three share the same face-level fields.

**Approach-avoidance (`task: 'phase2_slider'`)**

| Field | Type | Description |
|---|---|---|
| `face_id` | string (`nXXX`) | Novel face ID |
| `face_color` | `red` / `blue` | Group assignment for this session |
| `face_is_good` | bool | Hidden good/bad label |
| `face_trial_index` | int 1–20 | Presentation order within Phase 2 |
| `image_path` | string | Path to image file |
| `slider_rating` | 0–100 | 0 = strongly avoid, 100 = strongly approach |
| `outcome` | `1` / `-5` | Hidden outcome (not shown to participant) |
| `phase2_score` | int | Running Phase 2 cumulative score |
| `rt` | ms | Response time |

**Punishment probability (`task: 'phase2_probability'`)**

| Field | Type | Description |
|---|---|---|
| `face_id` | string | Same face as slider trial |
| `face_color` | `red` / `blue` | Same face |
| `face_is_good` | bool | Same face |
| `face_trial_index` | int | Same face |
| `image_path` | string | Same face |
| `probability_punishment` | 0–100 | Estimated punishment probability (%) |
| `rt` | ms | Response time |

**Confidence (`task: 'phase2_confidence'`)**

| Field | Type | Description |
|---|---|---|
| `face_id` | string | Same face |
| `face_color` | `red` / `blue` | Same face |
| `face_is_good` | bool | Same face |
| `face_trial_index` | int | Same face |
| `image_path` | string | Same face |
| `confidence_rating` | 0–100 | Confidence in punishment probability estimate |
| `rt` | ms | Response time |

### Phase 3 Trials (`task: 'phase3_probability'`)

| Field | Type | Description |
|---|---|---|
| `face_id` | int | Phase 1 face ID |
| `face_color` | `red` / `blue` | Group assignment |
| `face_is_good` | bool | Hidden good/bad label |
| `probability_punishment` | 0–100 | Estimated punishment probability (%) |
| `rt` | ms | Response time |

### Demographics

Collected pre-experiment (4-page SurveyJS survey):

`age`, `gender`, `race_ethnicity`, `education`, `ses_ladder` (1–10 MacArthur ladder), `political_orientation` (1–7 conservative→liberal), `employment_status`, `primary_language`, `english_proficiency`, `geographic_location`, `vision_correction`, `color_blind`, `device_type`

### Surveys (post-experiment)

**Technical check:** `images_loaded`, `technical_difficulties`, `technical_difficulties_details`

**User feedback:**
- `clarity_rating` (0–5)
- `confusion_phase` (multi-select: `phase1`, `phase2`, `phase3`, `none`; shown if clarity ≤ 3)
- `confusion_phase1_details` (multi-select with free-text Other: `too_many_faces`, `group_distinction`, `goodbad_distinction`, `instructions`; shown if phase1 selected)
- `confusion_other_phases` (free text; shown if phase2 or phase3 selected)
- `length_rating` (`Too short` / `Just right` / `Too long`)
- `suggestions` (free text)

### Derived Variables

| Variable | Computation | Used in |
|---|---|---|
| `choice_accuracy` | `chosen_face_is_good` as 0/1 | H5, pilot eval B1–B3 |
| `approach_by_group` | Mean `slider_rating` by `face_color` | H1 |
| `prob_by_group` | Mean `probability_punishment` by `face_color` (Phase 2) | H2, H6 |
| `confidence_by_group` | Mean `confidence_rating` by `face_color` | H4 |
| `learning_slope` | Regression of `choice_accuracy` on `trial_number` | H5, B1 |
| `p3_calibration_error` | `probability_punishment` − actual base rate (10% good / 50% bad) | H6, B6 |
| `approach_prob_discordance` | `slider_rating` vs. `(100 − probability_punishment)` within-face | H3 |
| `win_stay` | P(same color re-selected after outcome = +1) | B5 |
| `lose_shift` | P(color switched after outcome = −5) | B5 |

---

## 8. Hypotheses & Analytic Plan

### Primary Hypotheses

**H1 — Behavioral Generalization**
Majority-condition participants will show higher approach ratings toward novel majority-group faces and lower ratings toward minority-group faces, relative to equal-condition participants.
- DV: `phase2_slider.slider_rating` by `face_color` × `condition`
- Analysis: LMM; random intercept + slope for `face_color` by participant

**H2 — Belief Distortion**
Majority-condition participants will assign higher punishment probability to novel minority-group faces vs. majority-group faces.
- DV: `phase2_probability.probability_punishment` by `face_color` × `condition`
- Analysis: LMM

**H3 — Approach–Belief Dissociation**
H1 (behavioral approach bias) and H2 (explicit probability bias) may dissociate by P1 Type: the experimental condition produces experience-based behavioral bias (H1 prominent), the control condition produces information-based belief bias (H2 prominent).
- Analysis: P1 Type × `face_color` interaction separately on `slider_rating` and `probability_punishment`

**H4 — Epistemic Uncertainty**
Participants will report lower confidence in probability estimates for minority-group faces (less learning experience → greater uncertainty).
- DV: `phase2_confidence.confidence_rating` by `face_color` × `condition`
- Analysis: LMM

**H5 — Phase 1 Learning Check**
Experimental-condition participants will improve choice accuracy across Phase 1 blocks (positive learning slope).
- DV: `chosen_face_is_good` by `trial_number` or `block`
- Analysis: Logistic GLMM, random participant intercept; pilot adequacy check (§8.2)

**H6 — Phase 3 Calibration**
Phase 3 punishment probability estimates will be higher for bad faces than good faces, and accuracy will be greater for majority-group faces (more accumulated learning opportunities).
- DV: `phase3_probability.probability_punishment` vs. `face_is_good` × `face_color`
- Analysis: LMM with actual punishment rates (10% vs. 50%) as reference

**H7 — Individual Differences**
Individual-level regressors (`ses_ladder`, `political_orientation`, `clarity_rating`) moderate H1/H2 effect sizes.
- Analysis: Add demographic covariates to primary LMMs as continuous moderators

### Pilot-Specific Goal: Parameter Adequacy Evaluation

The pilot's **primary goal** is to verify that the parameter combination (`N=40`, `E=12`, `GOOD_BAD_RATIO=70:30`, diagnosticity = 90%/50%) produces learnable Phase 1 outcomes. Main-study parameters are contingent on this.

**Behavioral indicators** (computed from Phase 1 trials):

| ID | Indicator | Computation | Pass criterion |
|---|---|---|---|
| B1 | Learning slope | Logistic regression of `choice_accuracy` on `trial_number` | β > 0, p < .05 in ≥ 60% of participants |
| B2 | Final-block accuracy | Mean `choice_accuracy` in block 12 | > 60% |
| B3 | Score trajectory | Regression of `total_score` on `block` | Positive slope |
| B4 | RT trend | Mean `rt` by block | Declining (habituation) |
| B5 | Win-stay / Lose-shift | Rate of repeating chosen face color after +1 vs. switching after −5 | Win-stay > Lose-shift |
| B6 | Phase 3 calibration | `probability_punishment` accuracy on Phase 1 faces | > 60% directionally correct |

**Subjective indicators** (from `user_feedback` survey):

| ID | Indicator | Field | Pass criterion |
|---|---|---|---|
| S1 | Clarity | `clarity_rating` (0–5) | Mean ≥ 3.5 |
| S2 | Phase 1 confusion | `confusion_phase` | Phase 1 selected by < 40% of participants |

**Parameter adjustment decision tree:**

```
Learning slope insufficient (B1 fail)?
  ├─ AND Phase 3 calibration also poor (B6 fail)?
  │     → Increase diagnosticity (raise good P(reward) → 0.95, lower bad P(reward) → 0.40)
  ├─ AND Phase 3 OK but score flat (B3 fail)?
  │     → Increase EXPOSURES_PER_FACE (12 → 16)
  └─ AND S2: Phase 1 confusion high?
        → Revise instructions / increase feedback duration

Win-stay/Lose-shift absent (B5 fail)?
  → Bad-person P(reward) = 0.5 may be too ambiguous; consider lowering to 0.35

All behavioral indicators pass but S1 clarity low?
  → Revise instructions only (no parameter change needed)
```

---

## 9. Parameters Subject to Change

| Parameter | Current value | Config key | Notes |
|---|---|---|---|
| Total Phase 1 faces | 40 | `TOTAL_FACES` | Pilot value; main study may increase |
| Exposures per face | 12 | `EXPOSURES_PER_FACE` | Increase to 16 if B1/B3 fail |
| Good:bad ratio | 70:30 | `GOOD_BAD_RATIO` | Both groups identical; minority rounds to 75% at N=40 |
| Good-person P(reward) | 0.9 | `GOOD_PERSON_PROBS.reward` | May raise to 0.95 if B6 fails |
| Bad-person P(reward) | 0.5 | `BAD_PERSON_PROBS.reward` | May lower to 0.35 if B5 fails |
| Phase 2 faces per session | 20 | `PHASE2_TOTAL_TRIALS` | With 3 questions/face, balances depth vs. time |
| Phase 2 exposure (Factor 3) | Equal only (pilot) | `PILOT_MODE` | Re-enable via `PILOT_MODE: false` for main study |
| Phase 3 inclusion | Included | — | May drop if experiment time > 45 min |
| Points-to-money | 100 pts = $1 | `POINTS_TO_DOLLARS` | Subject to Prolific budget |
| Sample size | TBD | — | Power analysis needed post-pilot |

---

## Appendix: Relationship to Study 2

An earlier Phase 2 design used a **partner-choice task**: participants selected one face from a 4-face grid shown in varying red:blue compositions (4:0, 3:1, 2:2, 1:3, 0:4). This design is intended for **Study 2**, which will examine group-composition effects on partner selection in a multi-option context. Study 1 uses the single-face slider design described above to isolate group-level approach-avoidance tendencies cleanly.
