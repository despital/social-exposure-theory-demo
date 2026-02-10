# Pilot Feedback: Parameter Tuning Notes

> This document captures observations and analysis from pilot testing.
> Parameters below are candidates for adjustment in future iterations.
> All math assumes random choice as a baseline (before learning effects).

---

## 1. Signal-to-Noise Ratio in Phase 1 Learning

### Current Parameters (as of 2026-02-10 pilot)

| Parameter | Value | Config key |
|---|---|---|
| Total faces | 100 (50 red, 50 blue) | `TOTAL_FACES` |
| Good/Bad ratio | 70/30 per color | `GOOD_BAD_RATIO` |
| Good person reward prob | 90% (+1) | `GOOD_PERSON_PROBS.reward` |
| Good person punishment prob | 10% (-5) | `GOOD_PERSON_PROBS.punishment` |
| Bad person reward prob | 50% (+1) | `BAD_PERSON_PROBS.reward` |
| Bad person punishment prob | 50% (-5) | `BAD_PERSON_PROBS.punishment` |
| Faces per trial | 4 | `FACES_PER_TRIAL` |
| Exposures per face | 3 | `EXPOSURES_PER_FACE` |

### Per-Face Interaction Depth

**Important:** Each face appears not only as a *target* (scheduled exposure) but
also as a *companion* (randomly drawn to fill the 4-face panel). This dramatically
increases total per-face exposure.

With 100 faces, 3 reps, 4 faces per trial (300 total trials):

- **Target appearances** per face: 3
- **Companion appearances** per face: (300 − 3) × 3/99 ≈ **9.0**
- **Total appearances** per face: ≈ **12**

This yields (assuming random choice, before learning effects):

- **E[interactions per face]** = 12 appearances × (1/4) = **3.0**
- **P(never interacting with a given face)** = (3/4)^12 ≈ **3.2%**
- **P(interacting exactly once)** ≈ **12.7%**
- **P(interacting 2+ times)** ≈ **84.2%**

> **Key insight:** E[interactions per face] ≈ EXPOSURES_PER_FACE regardless of pool
> size, because companion appearances scale proportionally with the number of trials.
> Reducing the face pool does *not* change per-face learning depth.

Per-face interaction depth is adequate under random choice. The remaining concerns
for learning quality are:

1. **Signal-to-noise ratio:** Only 68.2% of punishments come from bad faces (see below)
2. **Learning-avoidance tension:** As participants learn to avoid bad faces, they
   interact less with them, reducing the very feedback needed to consolidate learning
3. **P(ever punished by a specific bad face)** = 1 − (0.875)^12 ≈ **79.9%**

   Derivation: E[(1 − p_punish)^k] where k ~ Bin(12, 1/4) and p_punish = 0.50
   = (1/4 × 1/2 + 3/4)^12 = (0.875)^12 ≈ 0.201; so P = 1 − 0.201 = **0.799**

   About 4 in 5 bad faces will produce at least one punishment per participant.

### Diagnostic Quality of Punishment

When a participant does receive a punishment, how diagnostic is it?

```
P(face was bad | punished)  = P(punish|bad) x P(bad) / P(punish)
                             = (0.50 x 0.30) / (0.50 x 0.30 + 0.10 x 0.70)
                             = 0.15 / 0.22
                             = 68.2%

P(face was good | punished) = 31.8%  (noise)
```

About 1 in 3 punishments come from good people, creating substantial noise.

---

## 2. Candidate Parameter Changes

### Option A: Reduce Face Pool (e.g., 60 faces)

Keeping 3 reps: 60 faces x 3 blocks = **180 trials** (vs 300 currently)

| Metric | 100 faces | 60 faces |
|---|---|---|
| Total Phase 1 trials | 300 | 180 |
| Bad faces per color | 15 | 9 |
| E[interactions per face] | 3.0 | 3.0 |
| P(never interacting with a face) | 3.2% | 3.2% |
| Experiment duration (Phase 1) | ~25 min | ~15 min |

**Pros:**
- Shorter experiment, less fatigue
- Faster to reach Phase 2 (the transfer task)
- Participant attention may be better sustained

**Cons:**
- Per-face learning depth unchanged (still ~3.0 interactions)
- Fewer unique bad faces (9 vs 15 per color) = less statistical power
- Phase 3 has fewer faces to rate = fewer data points for analysis
- Less variety may feel repetitive

**Verdict:** Reduces experiment length but does not improve learning depth.

### Option B: Increase Exposures (e.g., 5 reps per face)

Keeping 100 faces: 100 faces x 5 blocks = **500 trials**

| Metric | 3 reps | 5 reps |
|---|---|---|
| Total Phase 1 trials | 300 | 500 |
| E[interactions per face] | 3.0 | 5.0 |
| P(never interacting with a face) | 3.2% | 0.3% |
| P(interacting 2+ times) | 84.2% | 97.6% |
| P(ever punished by a specific bad face) | 79.9% | 93.1% |

**Pros:**
- Deeper learning per face (5.0 vs 3.0 interactions)
- Nearly every face interacted with 2+ times (97.6%)
- 93% chance of experiencing punishment from any given bad face

**Cons:**
- 500 trials is very long (~40+ min for Phase 1 alone)
- Participant fatigue likely degrades data quality in later blocks
- Diminishing returns: 3.0 interactions is already a reasonable baseline

**Verdict:** Better learning but likely too long. Fatigue is a real concern.
The marginal gain from 3.0 to 5.0 interactions may not justify doubling trial count.

### Option C: Reduce Pool + Increase Reps (e.g., 60 faces x 5 reps)

60 faces x 5 blocks = **300 trials** (same total as current design)

| Metric | 100 x 3 (current) | 60 x 5 |
|---|---|---|
| Total Phase 1 trials | 300 | 300 |
| E[interactions per face] | 3.0 | 5.0 |
| P(never interacting with a face) | 3.2% | 0.3% |
| P(interacting 2+ times) | 84.2% | 97.6% |
| P(ever punished by a specific bad face) | 79.9% | 93.1% |
| Bad faces per color | 15 | 9 |
| Phase 3 faces to rate | ~100 | ~60 |

**Pros:**
- Same experiment length, deeper per-face learning (5.0 vs 3.0)
- Nearly every face interacted with 2+ times
- Phase 3 is shorter (fewer faces to rate) but each rating is more informed

**Cons:**
- Fewer unique faces = less statistical power for between-face analyses
- More repetition of same faces may feel monotonous
- 9 bad faces per color is a smaller sample for group-level inference
- Marginal gain over current design (3.0 is already adequate)

**Verdict:** Moderate candidate. Same duration, modestly better learning. The
current design already achieves ~3.0 interactions per face, so the main benefit
is reducing near-zero-interaction faces (3.2% → 0.3%). Trade-off remains
fewer unique stimuli for between-face analyses.

### Option D: Adjust Outcome Probabilities (no structural change)

Example: Bad person = 70% punishment, Good person = 5% punishment

| Metric | Current (90/10, 50/50) | Adjusted (95/5, 30/70) |
|---|---|---|
| P(punishment per trial) | 22.0% | 23.5% |
| P(face bad \| punished) | 68.2% | 89.4% |
| Effective bad signal per trial | 15.0% | 21.0% |
| E[trials to first bad-punishment] | 6.67 | 4.76 |

**Pros:**
- No structural changes needed (just config values)
- Punishment becomes much more diagnostic (89% vs 68%)
- Faster learning without changing trial count or face pool

**Cons:**
- Good people almost never punish = less realistic
- Bad people become very obviously bad = ceiling effect risk
- May make the task too easy, reducing variance in outcomes

**Verdict:** Easiest to implement. Risk of making learning too deterministic,
which could reduce individual differences (the signal we want to measure).

---

## 3. Recommended Pilot Testing Strategy

The following parameter sets are recommended for systematic pilot comparison.
Each can be tested with a small N (5-10 participants) to observe learning curves.

### Pilot Set 1: Current Design (baseline)
```
TOTAL_FACES: 100, EXPOSURES_PER_FACE: 3
GOOD_BAD_RATIO: 70/30
GOOD_PERSON_PROBS: { reward: 0.90, punishment: 0.10 }
BAD_PERSON_PROBS:  { reward: 0.50, punishment: 0.50 }
```

### Pilot Set 2: Reduced Pool + More Reps (Option C)
```
TOTAL_FACES: 60, EXPOSURES_PER_FACE: 5
GOOD_BAD_RATIO: 70/30
(same outcome probs)
```

### Pilot Set 3: Stronger Diagnostic Signal (Option D)
```
TOTAL_FACES: 100, EXPOSURES_PER_FACE: 3
GOOD_BAD_RATIO: 70/30
GOOD_PERSON_PROBS: { reward: 0.95, punishment: 0.05 }
BAD_PERSON_PROBS:  { reward: 0.30, punishment: 0.70 }
```

### Pilot Set 4: Combined (Option C + D)
```
TOTAL_FACES: 60, EXPOSURES_PER_FACE: 5
GOOD_BAD_RATIO: 70/30
GOOD_PERSON_PROBS: { reward: 0.95, punishment: 0.05 }
BAD_PERSON_PROBS:  { reward: 0.30, punishment: 0.70 }
```

### Key Metrics to Compare Across Pilot Sets
1. **Learning curve slope** (Phase 1): Do participants increasingly avoid bad faces over blocks?
2. **Phase 3 accuracy**: Can participants correctly classify faces as good/bad?
3. **Phase 3 confidence**: Are participants confident in their classifications?
4. **Score trajectory**: Does total score increase across blocks (indicating learning)?
5. **Completion time**: Is the experiment feasible within the target window (20-25 min)?
6. **Participant feedback**: Clarity, length, engagement ratings from end-survey

---

## 4. Additional Notes

- All analysis above assumes the **equal exposure condition**. Majority-minority
  conditions have the same per-trial bad-face probability (since good/bad ratio is
  symmetric across colors) but differ in color composition.

- The good/bad ratio (`GOOD_BAD_RATIO`) and outcome probabilities
  (`GOOD_PERSON_PROBS`, `BAD_PERSON_PROBS`) affect both Phase 1 and Phase 2
  (novel faces). Changes should be evaluated for both phases.

- `TOTAL_FACES` and `RED_FACES`/`BLUE_FACES` must be updated together if the
  pool is reduced. The stimuli folder must also contain the appropriate number of
  face images.

- Phase 2 scoring (slider-based, deterministic) is not affected by outcome
  probability changes. Phase 2 uses the good/bad ratio only for hidden scoring
  (approach good = correct, avoid bad = correct).
