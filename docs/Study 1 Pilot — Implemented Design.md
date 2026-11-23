# Study 1 Pilot — Implemented Experiment Design

This document describes **only what is currently implemented** in the experiment (as of the codebase). It does not include planned or design-only elements that are not yet in the app.

---

## Overview

- **Phases:** Phase 1 (Learning) → Break → Phase 2 (Generalization Slider) → Phase 3 (Explicit Rating).
- **Pilot:** 6 conditions (Phase 1 Exposure × Phase 1 Type; Phase 2 exposure fixed to Equal).
- **Duration:** ~20–25 minutes (stated in consent).
- **Compensation:** Performance-based; 100 points = $1 (1 point = $0.01).

---

## Flow (as implemented)

1. **Welcome** — “Welcome to the Social Exposure Theory Experiment”, press any key.
2. **Consent** — Intro screen, then external consent form (checkbox required).
3. **Demographics** — Multi-page survey (age, gender, race/ethnicity, education, SES ladder 1–10, political orientation 1–7, employment, primary language, English proficiency, location, vision correction, color blindness, device type).
4. **Phase 1 instructions** — Different text for Experimental vs Control (see below).
5. **Phase 1** — Repeated choice + feedback trials.
6. **Phase 1 complete** — “Phase 1 Complete!”, press any key.
7. **Break** — “Break Time!”; 60-second countdown or spacebar to skip.
8. **Phase 2 instructions** — New faces one at a time; slider approach/avoid; no feedback per trial.
9. **Phase 2** — One novel face per trial, slider, then next trial.
10. **Phase 2 summary** — “Phase 2 Complete!”.
11. **Phase 3 instructions** — Rate faces from Phase 1; good/bad + confidence.
12. **Phase 3** — Each Phase-1 face shown twice: (1) good/bad, (2) confidence.
13. **Phase 3 complete** — “Phase 3 Complete!”.
14. **End survey** — Congratulations, debriefing, technical check (images loaded? other difficulties?), user feedback (clarity 0–5, length, suggestions), final thank-you with Phase 1 score, Phase 2 score, total points, and bonus in dollars.
15. **Save data** (if enabled) then goodbye.

---

## Conditions

- **Assignment:** Single URL parameter `c` (e.g. `?c=EXE`). Valid 3-letter codes from the codebase; unknown/missing defaults to `EXE`.
- **Pilot:** Phase 2 exposure is forced to **Equal** regardless of the 3rd character (6 effective conditions).
- **Code scheme:**
  - 1st: Phase 1 Exposure — E (Equal), R (Red-majority), B (Blue-majority).
  - 2nd: Phase 1 Type — X (Experimental), C (Control).
  - 3rd: Phase 2 Exposure — E / R / B (E only used in pilot).

**Phase 1 Exposure (Factor 1):**

- **Equal:** 50 red, 50 blue faces.
- **Majority-Red:** 80 red, 20 blue.
- **Majority-Blue:** 20 red, 80 blue.

Face-to-color assignment is randomized per participant.

**Phase 1 Type (Factor 2):**

- **Experimental:** After the participant chooses one face, only that face’s outcome (+1 or -5) is shown.
- **Control:** After the participant chooses one face, all four faces’ outcomes (+1 or -5 each) are shown in a grid. The participant still earns points only from their chosen face.

**Phase 2 Exposure (Factor 3):**

- In pilot, always **Equal** (50% red, 50% blue novel faces). Other levels exist in code but are not used when pilot mode is on.

---

## Phase 1 — Implemented

- **Stimuli:** 100 face identities; each has red and blue version. Random subset assigned to red vs blue per condition (50/50 or 80/20). 4 faces per trial in a 2×2 grid; image size 200×200.
- **Trial:** Participant sees 4 faces (with colored borders/backgrounds). Prompt: “Choose a person to interact with by clicking on a face:”. One click selects a face.
- **Feedback:** Shown immediately after choice. **Experimental:** single value (+1 or -5), 1000 ms, then next trial. **Control:** grid of 4 cells, each showing that face’s outcome (+1 or -5); chosen cell highlighted; 1000 ms, then next trial.
- **Good/bad (hidden):** Each face is labeled good or bad (70% good, 30% bad within each color). Not shown to participant.
- **Outcome rule:** Good face: P(+1)=0.9, P(-5)=0.1. Bad face: P(+1)=0.5, P(-5)=0.5. Same for both groups.
- **Block structure:** Each face appears exactly 12 times in Phase 1 (12 “exposures per face”). Trials are generated in blocks: within each block every face appears once; order shuffled per block; trials are groups of 4 faces.
- **Total Phase 1 trials:** 100 × 12 / 4 = **300** (unless reduced in debug).
- **Reward values:** +1 (reward), -5 (punishment). Points accumulate and are shown at the end.

---

## Phase 2 — Implemented

- **Stimuli:** 120 novel face identities (not seen in Phase 1); 60 red, 60 blue per session; each has hidden good/bad (70% good, 30% bad per color).
- **Trial:** One novel face per trial (e.g. 300×300 px, border color = group). Slider 0–100, labels “Avoid”, “Neutral”, “Approach”; starts at 50; **require_movement: true**. Prompt: “How willing are you to approach or avoid this person?” Button: “Submit”.
- **No feedback** during Phase 2; no outcome shown per trial.
- **Scoring (hidden, for bonus):** Based on slider vs good/bad:
  - **Good face:** slider above 50 (approach) → +1; below 50 (avoid) → -5; exactly 50 → 0.
  - **Bad face:** slider below 50 (avoid) → +1; above 50 (approach) → -5; exactly 50 → 0.
- **Trial count:** 60 trials total (50/50 red–blue in pilot). In debug, this can be reduced (e.g. 6).
- **Phase 2 score** is summed and shown only at the end (together with Phase 1 and total bonus).

---

## Phase 3 — Implemented

- **Faces rated:** Only faces that appeared in **Phase 1** (unique set). Phase 2 novel faces are not rated.
- **Response type:** Buttons only (no slider). Each question is answered by clicking one button.
- **Order:** Random order of Phase 1 faces; for each face, two trials in sequence:
  1. **Good/bad:** Same face image, question “Do you think this person is good or bad?” Two buttons: **Bad**, **Good**.
  2. **Confidence:** Same face image, question “How confident are you that your choice is correct?” Six buttons: Very unconfident, Unconfident, Slightly unconfident, Slightly confident, Confident, Very confident.
- **Total Phase 3 trials:** 2 × (number of unique Phase 1 faces) — e.g. 200 when 100 unique faces (or fewer in debug, e.g. 5 faces → 10 trials).

---

## Demographics (implemented)

Collected before Phase 1:

- Age (number, 18–100).
- Gender: Woman, Man, Non-binary, Prefer not to disclose.
- Race/ethnicity: multi-select (American Indian or Alaska Native, Asian, Black or African American, Hispanic or Latino, Native Hawaiian or Pacific Islander, White, Other, Prefer not to disclose).
- Education: Less than high school through Professional degree, Prefer not to disclose.
- SES ladder 1–10 (with anchor descriptions).
- Political orientation 1–7 (Very Conservative – Very Liberal).
- Employment: Student, Employed, Self-employed, Unemployed, Retired, Other / prefer not to say.
- Primary language (dropdown).
- English proficiency: Native speaker through Basic, Prefer not to say.
- Location (country dropdown).
- Vision correction: Glasses, Contact lenses, None.
- Color blindness / difficulty with red and blue: Yes, No, Not sure.
- Device: Desktop/Laptop, Tablet, Smartphone, Other.

---

## End-of-experiment (implemented)

- **Debriefing:** Purpose of study, what was done in each phase, meaning of red/blue.
- **Technical check:** Did all images load? Any other technical difficulties? (If yes, open-ended.)
- **User feedback:** Clarity 0–5; length (Much too short … Much too long); open suggestions.
- **Final screen:** Phase 1 score, Phase 2 score, total points, bonus in dollars (total points × 0.01).

---

## Data recorded (implemented)

- **Phase 1:** For each trial: task, phase, block, trial_in_block, chosen face id/color/isGood, outcome, total_score, RT; control also stores all four faces’ outcomes.
- **Phase 2:** For each trial: task, phase, face_id, face_color, face_is_good, slider_rating, outcome, phase2_score, correct (or null if neutral).
- **Phase 3:** Good/bad trial: face_id, face_color, face_is_good, rating (good/bad). Confidence trial: same plus previous_goodbad_rating, confidence_level (1–6), confidence_label.
- **Metadata:** participant_id, study_id, session_id, condition_code, condition, majority_group, p1_type, p2_exposure, debug_mode (and pilot_mode in saved payload).
- **Surveys:** Demographics, technical check, user feedback (saved when end survey section runs).

---

## Parameters (as implemented)

| Parameter | Value |
|-----------|--------|
| Phase 1 total faces | 100 |
| Phase 1 faces per trial | 4 |
| Phase 1 exposures per face | 12 |
| Phase 1 total trials | 300 |
| Good:bad ratio (each color) | 70% good, 30% bad |
| Good face P(reward) | 0.9 |
| Bad face P(reward) | 0.5 |
| Reward / Punishment | +1 / -5 |
| Phase 1 feedback duration | 1000 ms |
| Phase 2 novel face pool | 120 (60 red, 60 blue) |
| Phase 2 trials (pilot) | 60 (50/50 red–blue) |
| Phase 2 slider | 0–100, start 50, Avoid – Neutral – Approach |
| Phase 3 | Phase 1 faces only; 2 questions per face (good/bad, confidence 1–6) |
| Break before Phase 2 | 60 s or spacebar |
| Points to dollars | 1 point = $0.01 |

---

## What the doc does not include

- Design-only or planned elements (e.g. full 18-condition matrix, Phase 2 exposure manipulation in main study).
- Technical implementation details (e.g. framework, hosting, database, plugins, file paths).
- Parameters marked “subject to change” that are not yet different in code.
- Analysis plans or sample size.

---

## Outcome Measures

These are the measures that can be derived from the **recorded data** (see “Data recorded” above):

1. **Approach frequency** — Count or proportion of trials on which a face from each group (red vs blue) was chosen (Phase 1; from chosen_face_color).
2. **Approach tendency** — Mean (or distribution) of slider ratings (0–100) toward novel faces of each group (Phase 2; from slider_rating and face_color).
3. **Good/bad ratings** — Proportion of Phase 1 faces from each group rated “good” vs “bad” (Phase 3; from rating and face_color).
4. **Confidence** — Confidence level (1–6) in those good/bad judgments, by face or by group (Phase 3; from confidence_level and face_color).
5. **Reaction time** — Response latency per trial; recorded in Phase 1 by the choice plugin (data.rt); Phase 2 and Phase 3 plugins also record response time.
6. **Stereotypes** — Derived measure: difference in evaluations (e.g., approach tendency, good/bad ratings) toward novel and/or Phase 1 faces between majority and minority groups (in conditions where composition is not 50:50).
7. **Accuracy** — Derived measure: extent to which truly “bad” faces within each group are rated as bad in Phase 3 (from recorded good/bad rating per face and ground-truth face_is_good).

## Hypotheses

The following refer to the **Phase 1 Type** factor: **experimental** = only the chosen face’s outcome is shown; **control** = all four faces’ outcomes are shown. “Majority” and “minority” refer to the larger vs smaller group when Phase 1 Exposure is Majority-Red or Majority-Blue (not Equal).

1. When group composition is not 50:50, participants in the **experimental** condition will show a positive correlation between stereotype/discrimination measures and their difference in accuracy at identifying individual characteristics of each group. Participants in the **control** condition will not show this correlation.
2. Confidence ratings (Phase 3) will be higher for faces from the majority group than for faces from the minority group.
3. When group composition is not 50:50, participants in the experimental condition will be more likely than those in the control condition to develop an increasingly discriminative approach tendency favoring the majority (e.g., higher Phase 1 approach frequency and higher Phase 2 slider ratings toward the majority group).