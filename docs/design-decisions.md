# Design Decisions Log
# Social Exposure Theory Experiment
# Last updated: 2026-06-12

Decisions are listed newest-first. Each entry states **what** was decided and **why**.

---

## 2026-06-12 — Firebase collection bin per data round

**Decision:** Firebase data is stored under a top-level key defined by `CONFIG.COLLECTION_ROUND` in `src/utils/config.js` (currently `'pilot'`). When a new data collection round begins, change this value (e.g. `'round1'`) before deploying.

**Why:** Separates pilot data from subsequent rounds at the database level without requiring any schema changes. Old records remain intact in their own bin. Tree structure: `<COLLECTION_ROUND>/<participant_id>/`.

---

## 2026-05-19 — Pilot condition selection

**Decision:** Three conditions for the pilot: Equal (`?c=EXE`), Majority-Red (`?c=RXE`), Majority-Blue (`?c=BXE`). All use the Experimental Phase 1 type. No Control arm in the pilot.

**Why:** The pilot focuses on the Phase 1 exposure manipulation (equal vs. majority-minority) as the primary variable of interest. The Control arm (which reveals all four face outcomes after each trial) is reserved for the full study. Phase 2 exposure is already locked to 'equal' via `PILOT_MODE: true` in config.js, reducing the 18-condition full design to 3 active pilot conditions.

**Prolific setup:** Create three separate condition arms, one URL per condition.

---

## 2026-05-19 — Phase 2 sampling: balanced novel + encountered design

**Decision:** Phase 2 presents 20 faces per participant — 5 novel red, 5 novel blue, 5 encountered red, 5 encountered blue — sampled without replacement.

**Why:** Including encountered faces (seen in Phase 1) alongside novel faces allows within-participant comparison of approach-avoidance generalization. The 5+5+5+5 balanced design ensures equal representation across source (novel vs. encountered) and group (red vs. blue), which is required for the key statistical contrasts. Previous design used novel-only; the update adds the encountered arm to enable direct generalization tests.

---

## 2026-05-19 — Deploy procedure: stimuli must be copied separately

**Decision:** Added explicit `cp -r dist/stimuli/faces/. stimuli/faces/` step to the gh-pages deploy procedure in CLAUDE.md.

**Why:** `CopyWebpackPlugin` copies `stimuli/` into `dist/stimuli/` at build time, but the deploy script (`cp dist/*.js dist/*.html .`) only copies JS bundles. The `stimuli/` directory in the `gh-pages` branch is tracked independently in git and does not update automatically. This gap caused the new alien face images to be absent from the live experiment after the stimuli were updated on master.

---

## 2026-05-12 — Stimuli replaced with alien faces

**Decision:** Replaced all FaceGen faces with alien/abstract faces for Phase 1 (face_000–face_039) and Phase 2 novel pool (face_n001–face_n120). Old FaceGen images moved to `stimuli/faces/archive/`.

**Why:** Alien faces eliminate real-world race/gender attributions that could confound the group-membership manipulation (red vs. blue border = group identity). Abstract stimuli ensure the colored border is the only social cue available, which is theoretically required for a clean test of exposure effects on group impressions.

---

## 2026-03-12 — Research design updated

**Decision:** Finalized 3-phase structure: Phase 1 (social learning with feedback), Phase 2 (approach-avoidance ratings of novel + encountered faces), Phase 3 (punishment probability estimation for Phase 1 faces only).

**Why:** Separating learning (Phase 1) from generalization measurement (Phase 2) and explicit belief elicitation (Phase 3) allows decomposition of the exposure effect into behavioral (Phase 2 slider) and cognitive (Phase 3 probability estimate) components.

---

## 2026-02-26 — Phase 2: three questions per face

**Decision:** Each Phase 2 face is rated on three sequential sliders: (1) approach-avoidance (avoid–neutral–approach), (2) punishment probability (0%–100%), (3) confidence in probability estimate (not at all – extremely confident).

**Why:** The approach-avoidance slider captures the behavioral tendency directly relevant to social exposure theory. The probability slider captures explicit belief about the face's reward/punishment rate. The confidence slider allows assessment of belief precision, which is relevant for Bayesian models of social learning. All three require slider movement before advancing (`require_movement: true`) to prevent default-value responses.

---

## 2026-02-26 — Phase 1 reduced to 40 faces

**Decision:** Total Phase 1 faces reduced from 100 to 40 (20 red + 20 blue in the equal condition; 32 + 8 in the majority-minority condition). Exposures per face set to 12, yielding 120 trials.

**Why:** 100 faces × 3 exposures = 75 trials is insufficient for reinforcement learning to converge. 40 faces × 12 exposures = 120 trials provides more reliable learning, and the smaller face pool means each face is seen often enough to support individual-level RL parameter estimation. The 32/8 majority-minority split (80%/20%) creates a strong exposure asymmetry while keeping the minority group above the minimum needed for stable estimates.

---

## 2026-02-24 — Phase 3 uses punishment probability slider (not good/bad buttons)

**Decision:** Replaced the binary good/bad rating + confidence Likert in Phase 3 with a single continuous punishment probability slider (0%–100%), matching the Phase 2 probability question.

**Why:** A continuous probability estimate is more sensitive than a binary judgment and directly mirrors the Phase 2 measure, enabling within-participant comparison of explicit beliefs across novel (Phase 2) and encountered (Phase 3) faces. The shared format also simplifies analysis.

---

## 2026-02-08 — Condition code scheme (?c=)

**Decision:** Replaced separate `?condition=` and `?majority_group=` URL parameters with a single 3-character code (`?c=RXB`). Characters encode: (1) Phase 1 Exposure (E/R/B), (2) Phase 1 Type (X=Experimental / C=Control), (3) Phase 2 Exposure (E/R/B).

**Why:** A single opaque parameter is easier to distribute via Prolific (one URL per condition arm) and prevents participants from manually decoding their condition assignment. The codebook in `config.js` maps codes to full parameter sets, keeping the URL short while retaining full expressivity for the 18-condition design.

---

## 2026-02-08 — Control condition added

**Decision:** Phase 1 has two types: Experimental (participant sees only the outcome of their chosen face) and Control (participant sees outcomes for all four faces after each trial).

**Why:** The control condition provides a counterfactual for outcome-based learning: if participants in the control condition show the same group-level bias as the experimental condition, that implicates mere exposure rather than differential outcome learning. Required to distinguish social learning mechanisms.

---

## 2026-02-05 — Good/bad ratio set to 70/30, equal across groups

**Decision:** 70% of faces in each color group are "good" (90% reward probability); 30% are "bad" (50% reward probability). Ratio is identical for red and blue.

**Why:** Equal good/bad ratios across groups ensure that any group-level bias in Phase 2 or Phase 3 cannot be attributed to actual outcome differences between groups — it must reflect the exposure frequency manipulation. The 70/30 split (rather than 50/50) creates a positive baseline that makes punishments salient without making the task discouraging.

---

## 2026-02-05 — Reward/punishment values: +1 / −5

**Decision:** Reward = +1 point, Punishment = −5 points.

**Why:** Asymmetric values (loss 5× the gain) reflect empirical loss-aversion ratios and make punishment-avoidance learning motivationally meaningful. The asymmetry also ensures that participants who learn the good/bad structure earn meaningfully more than those who do not, validating the bonus payment scheme.
