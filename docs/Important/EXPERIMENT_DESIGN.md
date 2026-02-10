# Study 1 Pilot — Experiment Design

> **Status:** Pre-pilot | **Last updated:** 2026-02-10
>
> This document describes the design of **Study 1 (pilot)**, which tests whether differential exposure to social group members shapes approach-avoidance generalizations toward novel individuals from those groups.

---

## Overview

### Research Question

Do people generalize learning about individual group members to novel members of the same group, and does the frequency of exposure to a group moderate this generalization?

### Core Hypothesis

Participants who are repeatedly exposed to members of one group (vs. balanced exposure to both groups) will develop group-level approach-avoidance tendencies that transfer to novel individuals from those groups — even when both groups have identical reward/punishment base rates.

### Study Design at a Glance

| Component | Description |
|---|---|
| **Phases** | Phase 1 (Learning) + Phase 2 (Generalization Test) + Phase 3 (Explicit Rating, tentative) |
| **Full design** | Phase 1 Exposure (3) x Phase 1 Type (2) x Phase 2 Exposure (3) = 18 conditions |
| **Pilot design** | Phase 1 Exposure (3) x Phase 1 Type (2) = **6 conditions** (Phase 2 exposure fixed to Equal) |
| **Platform** | Online (Prolific), built with jsPsych 8.2 |
| **Estimated duration** | 20–25 minutes |
| **Compensation** | $15/hour + performance-related compensation (points to reward rate: 100 points = 1 dollar) |

---

## Experimental Conditions

The full study uses a **3 x 2 x 3 fully crossed between-subjects design**. For the **pilot**, Phase 2 Exposure is fixed to Equal, yielding a **3 x 2 design** (6 active conditions). The full 18-condition codebook is retained in the codebase and can be re-enabled by setting `PILOT_MODE: false` in `config.js`.

### Factor 1 — Phase 1 Exposure (3 levels)

How frequently participants encounter members of each group during Phase 1.

| Level | Red exposure | Blue exposure |
|---|---|---|
| **Equal** | 50% of trials | 50% of trials |
| **Majority-Red** | 80% of trials | 20% of trials |
| **Majority-Blue** | 20% of trials | 80% of trials |

> **Counterbalancing:** Majority-Red and Majority-Blue are the same manipulation with color counterbalanced. They can be analyzed together as a single "Majority-Minority" condition with majority-group identity as a covariate. Face-to-group assignment is also randomized per participant.

### Factor 2 — Phase 1 Type (2 levels)

Whether participants learn through experience or receive explicit information.

| Level | Description |
|---|---|
| **Experimental** | Participants choose a face and receive probabilistic feedback (+1 or -5). Only the chosen face's outcome is revealed. They learn through selective experience. |
| **Control** | Participants choose a face, then ALL four faces' outcomes are revealed simultaneously. The participant still earns points based on their chosen face, but gains full information about every face on each trial. This removes learning-through-selective-experience as the mechanism. |

> **Implementation:** Both conditions use the same trial structure (4-face grid → click → feedback). The difference is in the feedback screen: experimental shows only the chosen face's outcome; control shows all 4 faces in a grid with their outcomes displayed.

### Factor 3 — Phase 2 Exposure (3 levels) — *Disabled during pilot*

The group composition of novel faces presented during the generalization test (Phase 2).

| Level | Novel face composition | Pilot status |
|---|---|---|
| **Equal** | 50% red novel faces, 50% blue novel faces | **Active** |
| **Majority-Red** | More red novel faces than blue | Disabled (`PILOT_MODE: true`) |
| **Majority-Blue** | More blue novel faces than red | Disabled (`PILOT_MODE: true`) |

> This factor tests whether the composition of the generalization context (Phase 2) interacts with prior learning (Phase 1). For example, does a participant who saw mostly red faces in Phase 1 behave differently when Phase 2 also presents mostly red vs. mostly blue novel faces?
>
> **Pilot note:** During the pilot, `PILOT_MODE: true` forces Phase 2 exposure to Equal regardless of the 3rd character in the condition code. This simplifies the pilot to 6 effective conditions while retaining the full 18-condition infrastructure for later use.

### Full Condition Matrix (18 conditions)

| # | Code | Phase 1 Exposure | Phase 1 Type | Phase 2 Exposure | Pilot status |
|---|---|---|---|---|---|
| 1 | `EXE` | Equal | Experimental | Equal | **Active** |
| 2 | `EXR` | Equal | Experimental | Majority-Red | Disabled (→ Equal) |
| 3 | `EXB` | Equal | Experimental | Majority-Blue | Disabled (→ Equal) |
| 4 | `ECE` | Equal | Control | Equal | **Active** |
| 5 | `ECR` | Equal | Control | Majority-Red | Disabled (→ Equal) |
| 6 | `ECB` | Equal | Control | Majority-Blue | Disabled (→ Equal) |
| 7 | `RXE` | Majority-Red | Experimental | Equal | **Active** |
| 8 | `RXR` | Majority-Red | Experimental | Majority-Red | Disabled (→ Equal) |
| 9 | `RXB` | Majority-Red | Experimental | Majority-Blue | Disabled (→ Equal) |
| 10 | `RCE` | Majority-Red | Control | Equal | **Active** |
| 11 | `RCR` | Majority-Red | Control | Majority-Red | Disabled (→ Equal) |
| 12 | `RCB` | Majority-Red | Control | Majority-Blue | Disabled (→ Equal) |
| 13 | `BXE` | Majority-Blue | Experimental | Equal | **Active** |
| 14 | `BXR` | Majority-Blue | Experimental | Majority-Red | Disabled (→ Equal) |
| 15 | `BXB` | Majority-Blue | Experimental | Majority-Blue | Disabled (→ Equal) |
| 16 | `BCE` | Majority-Blue | Control | Equal | **Active** |
| 17 | `BCR` | Majority-Blue | Control | Majority-Red | Disabled (→ Equal) |
| 18 | `BCB` | Majority-Blue | Control | Majority-Blue | Disabled (→ Equal) |

### Condition Code Scheme

Conditions are assigned via a single URL parameter `?c=<CODE>` (e.g., `?c=RXB`). The 3-character code encodes all three factors:

- **1st character** — Phase 1 Exposure: `E` (Equal), `R` (Red-majority), `B` (Blue-majority)
- **2nd character** — Phase 1 Type: `X` (Experimental), `C` (Control)
- **3rd character** — Phase 2 Exposure: `E` (Equal), `R` (Red-majority), `B` (Blue-majority)

These codes are opaque to participants (a participant seeing `?c=RXB` cannot infer the manipulation) but immediately decodable by the research team. The full codebook is defined in `src/utils/config.js` → `CONFIG.CONDITION_CODES`.

> **Pilot note:** During the pilot, the 3rd character is effectively ignored — all participants receive Equal Phase 2 exposure. Any of the 18 codes will work, but `EXE`, `ECE`, `RXE`, `RCE`, `BXE`, `BCE` are the 6 canonical pilot codes.

### Informedness (Removed)

Earlier designs considered manipulating whether participants are told that both groups have identical reward rates. This variable has been **removed** from the study design and codebase. All participants receive the same (uninformed) instructions.

---

## Phase 1 — Social Learning

### What the Participant Experiences

**Experimental condition:** On each trial, the participant sees 4 faces with colored backgrounds (red or blue, indicating group membership). They select one face to "interact with" by clicking it. After selecting, they receive feedback: **+1** (reward) or **-5** (punishment). Their goal is to maximize their total score.

**Control condition:** The same 4 faces are shown, but with reward probabilities displayed for each face. The participant still selects one face, but the learning-from-experience component is removed.

### Trial Structure (Experimental)

```
┌─────────────────────────────────────┐
│  [Face A]  [Face B]                 │  ← 4 faces in a 2×2 grid
│  [Face C]  [Face D]                 │     each with red or blue background
│                                     │
│  "Choose a person to interact with" │
└─────────────────────────────────────┘
         │ participant clicks
         ▼
┌─────────────────────────────────────┐
│           +1  or  -5                │  ← 1-second feedback
└─────────────────────────────────────┘
```

### Reward Mechanism

Each face is privately labeled as "good" or "bad" (never revealed to participants). The label determines reward probabilities:

| Face type | P(reward = +1) | P(punishment = -5) | Current setting |
|---|---|---|---|
| **Good person** | 90% | 10% | `GOOD_PERSON_PROBS: { reward: 0.9 }` |
| **Bad person** | 50% | 50% | `BAD_PERSON_PROBS: { reward: 0.5 }` |

> **Key design feature:** Both groups have the **same** proportion of good vs. bad members (currently 80% good, 20% bad). Any perceived group difference arises from exposure frequency, not actual differences in reward rates.

### Parameters

| Parameter | Current value | Subject to change? | Notes |
|---|---|---|---|
| Total faces | 100 (50 red, 50 blue) | No | Generated via FaceGen |
| Faces per trial | 4 | Unlikely | Set for consistency; shown in 2×2 grid |
| Exposures per face (blocks) | 3 | Unlikely | Each block presents all faces once |
| Total Phase 1 trials | 300 (3 blocks × 100 faces) | Unlikely | Derived from above |
| Good:bad ratio per group | 80:20 | **Yes** | Could vary between groups or conditions |
| Good person reward probability | 0.9 | **Yes** | "Diagnosticity" — could be lowered |
| Bad person reward probability | 0.5 | **Yes** | Could be raised or lowered |
| Reward value | +1 | Unlikely | |
| Punishment value | -5 | Unlikely | Asymmetric to create loss aversion |
| Feedback duration | 1000 ms | Unlikely | |
| Interaction framing | "Choose a person to interact with" | **Yes** | Approach/avoid vs. help/hurt wording under consideration |

### Exposure Ratio Implementation

In the **Equal** condition, each block contains 50 red and 50 blue faces. In the **Majority-Minority** condition, each block contains 80 majority-group faces and 20 minority-group faces. When the requested count exceeds the available pool (e.g., 80 needed from a pool of 50), faces are sampled with replacement (some faces repeat within a block).

---

## Phase 2 — Generalization Test (Approach-Avoidance Slider)

### What the Participant Experiences

On each trial, the participant sees a **single novel face** (never encountered in Phase 1) with either a red or blue background. They indicate how willing they are to approach or avoid this person using a **continuous slider** (`@jspsych/plugin-html-slider-response`). No feedback is provided during the trial.

Novel faces carry a hidden good/bad label (same 80:20 ratio as Phase 1). This label determines a hidden outcome (+1 or -5) for each trial using the same reward probabilities as Phase 1. **These outcomes are not shown to participants during Phase 2** — they are accumulated silently and only revealed as a combined Phase 2 score at the end of the experiment.

### Trial Structure

```
┌─────────────────────────────────────┐
│         [Novel Face]                │  ← single face, red or blue background
│                                     │
│   Avoid ◄━━━━━━━━●━━━━━━━► Approach │  ← continuous slider (0–100)
│                                     │
│              [Submit]               │
└─────────────────────────────────────┘
```

### Phase 2 Exposure Manipulation — *Equal only during pilot*

The group composition of novel faces in Phase 2 is a **between-subjects factor** (Factor 3). During the pilot, only the Equal condition is active (`PILOT_MODE: true`). The full manipulation can be re-enabled for the main study.

| Phase 2 Level | Novel face composition | Example research question | Pilot |
|---|---|---|---|
| **Equal** | 50/50 red and blue (30 each) | Does Phase 1 learning transfer when the test environment is balanced? | **Active** |
| **Majority-Red** | More red novel faces | Does congruence with Phase 1 majority amplify or attenuate generalization? | Disabled |
| **Majority-Blue** | More blue novel faces | Does incongruence with Phase 1 majority change generalization patterns? | Disabled |

### Design Rationale

By presenting a single novel face per trial (rather than a set of faces to choose among), the dependent variable is a clean, continuous approach-avoidance measure for each group. Crossing Phase 2 exposure with Phase 1 exposure tests whether group-level generalizations depend on the composition of the new social context, not just prior learning.

### Parameters

| Parameter | Current value | Subject to change? | Notes |
|---|---|---|---|
| Faces per trial | 1 (novel) | No | Core to the slider design |
| Response type | Continuous slider (0–100) | No | `@jspsych/plugin-html-slider-response`; labels: Avoid / Neutral / Approach; starts at 50; requires movement |
| Trial count | 60 | **Yes** | Configured via `PHASE2_TOTAL_TRIALS` in config.js |
| Novel face pool size | 120 (60 per color) | Unlikely | Generated via FaceGen; stored as `face_nXXX_red.png` / `face_nXXX_blue.png` |
| Phase 2 exposure ratios | Equal: 50/50, Majority: 80/20 | Unlikely | Mirrors Phase 1 ratios; configured in `PHASE2_EXPOSURE_RATIOS` |
| Hidden scoring | Same good/bad probabilities as Phase 1 | Unlikely | Outcome accumulated silently; shown at experiment end |
| Feedback | None during trials | Unlikely | Score revealed only at end of experiment |

### Trial Breakdown by Phase 2 Exposure Level

With 60 total trials (default):

| P2 Exposure Level | Red faces | Blue faces | Min per-color obs |
|---|---|---|---|
| Equal (pilot) | 30 | 30 | 30 |
| Majority-Red | 48 | 12 | 12 |
| Majority-Blue | 12 | 48 | 12 |

---

## Phase 3 — Explicit Rating (Tentatively included in pilot)

> **Status:** Phase 3 is currently implemented. It is tentatively included in the pilot but only rates faces shown in **Phase 1** (not Phase 2 novel faces).

### What the Participant Experiences

The participant is shown every face they encountered during **Phase 1 only**, one at a time, and answers two questions per face:

1. **Good/Bad judgment:** "Do you think this person is good or bad?" (binary choice)
2. **Confidence rating:** "How confident are you in that judgment?" (6-point scale: Very unconfident → Very confident)

### Parameters

| Parameter | Current value | Subject to change? | Notes |
|---|---|---|---|
| Faces rated | All unique faces from Phase 1 only | **Yes** | Phase 2 novel faces excluded for pilot |
| Trials per face | 2 (good/bad + confidence) | Unlikely | |
| Total Phase 3 trials | ~200 (depends on unique face count) | Dependent on Phase 1 design | |
| Confidence scale | 6-point Likert | Unlikely | |

---

## Stimuli

### Face Stimuli

**Phase 1 (base faces):**
- **Generator:** FaceGen
- **Pool:** 100 unique face identities, each rendered with red and blue backgrounds = 200 image files
- **Format:** PNG, named `face_XXX_red.png` / `face_XXX_blue.png` (XXX = 000–099)
- **Location:** `stimuli/faces/`
- **Assignment:** Each face identity is randomly assigned to exactly one group (red or blue) per participant. No face appears in both groups within the same session.

**Phase 2 (novel faces):**
- **Generator:** FaceGen
- **Pool:** 120 unique novel face identities, each rendered with red and blue backgrounds = 240 image files
- **Format:** PNG, named `face_nXXX_red.png` / `face_nXXX_blue.png` (XXX = 001–120)
- **Location:** `stimuli/faces/`
- **Assignment:** Randomly assigned to red or blue (60 per group) per participant, same as Phase 1. Each novel face also receives a hidden good/bad label (same 80:20 ratio).

### Group Membership Cues

Group membership is indicated by the face's **background color** (red or blue). This is a minimal, non-social cue, chosen to avoid confounds from real-world social categories.

---

## Measures and Data Collected

### Primary Dependent Variables

| Phase | Measure | Type |
|---|---|---|
| Phase 1 | Face chosen per trial | Categorical (which of 4 faces) |
| Phase 1 | Reaction time | Continuous (ms) |
| Phase 2 | Approach-avoidance slider rating per novel face | Continuous (0–100) |
| Phase 3 | Good/bad judgment per face | Binary |
| Phase 3 | Confidence in judgment | Ordinal (1–6) |

### Demographics (collected pre-experiment)

Age, gender, race/ethnicity, education, subjective SES (1–10 ladder), political orientation (1–7 conservative-liberal), employment status, primary language, English proficiency, geographic location, vision correction, color blindness, device type.

### Post-Experiment Surveys

- Technical check (image loading, technical difficulties)
- User feedback (clarity rating 0–5, length rating, open suggestions)
- Debriefing screen (study purpose revealed)

---

## Parameters Subject to Change — Summary

The following parameters are flagged for potential revision before or after the pilot:

| Parameter | Current value | Decision needed |
|---|---|---|
| Good:bad ratio per group | 80:20 (same for both) | Could differ between groups; could be a between-subjects factor |
| Diagnosticity (good person P(reward)) | 0.9 | Could be varied (high vs. low) as a factor |
| Bad person P(reward) | 0.5 | Tied to diagnosticity |
| Interaction framing | "Choose a person to interact with" | Approach/avoid vs. help/hurt wording |
| Control feedback duration | 1000ms (same as experimental) | May need longer for participants to process 4 outcomes |
| Phase 2 trial count | 60 | Configurable via `PHASE2_TOTAL_TRIALS` |
| Phase 2 exposure manipulation | Equal only (pilot) | Re-enable via `PILOT_MODE: false` for main study |
| Phase 3 inclusion | Tentatively included (Phase 1 faces only) | May be dropped if experiment time is too long |
| Points-to-money conversion | 100 points = $1 | `POINTS_TO_DOLLARS` in config.js; subject to change |
| Sample size | TBD | Power analysis needed (6 pilot cells; 18 full-study cells) |
| Analysis model | TBD | Mixed/conditional logit vs. logistic GLMM |

---

## Technical Implementation

| Detail | Value |
|---|---|
| Framework | jsPsych 8.2 |
| Hosting | GitHub Pages |
| Data storage | Firebase Realtime Database (anonymous auth) |
| Recruitment | Prolific |
| Condition assignment | Encoded URL parameter (`?c=<CODE>`) |
| Condition codebook | `src/utils/config.js` → `CONFIG.CONDITION_CODES` |
| Plugins | `plugin-image-multi-choice` (Phase 1), `@jspsych/plugin-html-slider-response` (Phase 2) |
| Export | Python and R scripts to CSV |

### URL Format

```
# Production (Prolific appends its own parameters)
https://example.com/?c=EXE&PROLIFIC_PID=...&STUDY_ID=...&SESSION_ID=...

# Debug
https://localhost:8080/?c=RXB&debug=true&autoclick=true
```

---

## Appendix: Relationship to Study 2

The codebase previously contained an earlier Phase 2 implementation (a "partner choice" task where participants choose one face from a grid of 4 faces presented in varying red:blue compositions — 4:0, 3:1, 2:2, 1:3, 0:4). This design is intended for **Study 2**, which will examine group-composition effects on partner selection in a multi-option context. Study 1 now uses the single-face slider design described above to isolate group-level approach-avoidance tendencies.
