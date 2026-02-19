# Face Sampling Logic: Phase 1 Trial Generation

> This document describes how faces are scheduled and presented in Phase 1,
> and derives the resulting per-face interaction statistics.
> All math uses current config values (100 faces, 4 per trial, EXPOSURES_PER_FACE = 12).

---

## 1. Design Overview

Each Phase 1 trial displays **4 faces simultaneously**. The participant clicks one
to interact with. Every face appears on screen exactly **EXPOSURES_PER_FACE = 12**
times, regardless of color group.

The majority-minority manipulation controls **variety** (how many unique members of
each group the participant encounters), not repetition frequency.

### Step 1 — Color assignment (`generateFaces`)

All 100 face IDs are shuffled, then partitioned into red and blue groups according
to `CONFIG.FACE_COLOR_SPLIT`:

| Condition | Red faces | Blue faces | Total |
|---|---|---|---|
| Equal | 50 | 50 | 100 |
| Majority-red | 80 | 20 | 100 |
| Majority-blue | 20 | 80 | 100 |

Which specific face IDs become red vs. blue is randomized per participant. The same
100 face identities are always used — only the color assignment changes.

### Step 2 — Good/bad labeling (`assignGoodBad`)

Within each color group, faces are shuffled and the first 70% are marked good,
the rest bad (`GOOD_BAD_RATIO = 0.7/0.3`). The ratio is applied separately to each
group so both always have the same good/bad distribution regardless of group size.

### Step 3 — Trial schedule (`generateTrials`)

Trials are built in **EXPOSURES_PER_FACE = 12 blocks**. In each block:

1. The full 100-face array is independently shuffled
2. The shuffled array is chunked into groups of **FACES_PER_TRIAL = 4**
3. Each chunk becomes one trial

```
Block 1:  shuffle all 100 → [f73, f12, f91, f04 | f55, f38, f67, f02 | … ] → 25 trials
Block 2:  shuffle all 100 → [f02, f91, f38, f55 | f04, f67, f12, f73 | … ] → 25 trials
…
Block 12: shuffle all 100 → […] → 25 trials
─────────────────────────────────────────────────────────────────────────────
Total: 12 × 25 = 300 trials
```

Because every face appears exactly once per block, and there are 12 blocks, every
face appears on screen **exactly 12 times** — deterministically, not probabilistically.

---

## 2. Key Properties

| Property | Value | How guaranteed |
|---|---|---|
| On-screen appearances per face | exactly 12 | Once per block × 12 blocks |
| Faces per trial panel | exactly 4 | Chunk size |
| Within-trial duplicates | impossible | Each block is a single shuffle; a face can't occupy two chunks simultaneously |
| Total Phase 1 trials | exactly 300 | 100 × 12 / 4 = 300 (integer) |
| Block structure | clean 1–12 | Exactly EXPOSURES_PER_FACE iterations |

---

## 3. Per-Face Interaction Statistics (Equal Condition)

Each face appears 12 times, and the participant chooses 1 of 4 faces each trial:

- **E[interactions per face]** = 12 × (1/4) = **3.0**
- **P(never interacting with a given face)** = (3/4)^12 ≈ **3.2%**
- **P(interacting exactly once)** ≈ **12.7%**
- **P(interacting 2+ times)** ≈ **84.2%**

The formula E[interactions] = EXPOSURES_PER_FACE / FACES_PER_TRIAL = 3.0 is exact
and invariant to face pool size or condition — it is set entirely by the two config
values.

### Punishment exposure

- **P(ever punished by a specific bad face)** = 1 − (0.875)^12 ≈ **79.9%**

  Derivation: P(punish per interaction | bad) = 0.50. With k ~ Bin(12, 1/4):
  P(never punished) = E[(0.5)^k] = (1/4 × 0.5 + 3/4)^12 = (0.875)^12 ≈ 0.201

About 4 in 5 bad faces will punish a participant at least once.

---

## 4. Diagnostic Quality of Punishment

```
P(face was bad | punished)  = (0.50 × 0.30) / (0.50 × 0.30 + 0.10 × 0.70)
                             = 0.15 / 0.22  =  68.2%

P(face was good | punished) = 31.8%  (noise)
```

About 1 in 3 punishments come from good faces, creating substantial ambiguity.

---

## 5. Majority-Minority Condition Notes

In the majority-red condition, **80 of the 100 face identities are shown in red**
and 20 in blue. Each of these 100 faces still appears exactly 12 times. The
manipulation is purely about group **variety**, not repetition rate:

- A participant in the majority-red condition encounters 80 unique red individuals
  and 20 unique blue individuals, each seen 12 times.
- A participant in the equal condition encounters 50 unique red individuals and
  50 unique blue individuals, each seen 12 times.

The good/bad ratio (70/30) is applied proportionally within each group, so:

| Condition | Good red | Bad red | Good blue | Bad blue |
|---|---|---|---|---|
| Equal | 35 | 15 | 35 | 15 |
| Majority-red | 56 | 24 | 14 | 6 |
| Majority-blue | 14 | 6 | 56 | 24 |

The absolute number of bad faces differs between groups in the majority condition,
but the *rate* (30%) is identical. Any difference in participant behavior between
groups reflects exposure frequency, not outcome structure.

---

## 6. Parameter Reference

| Config key | Current value | Effect |
|---|---|---|
| `EXPOSURES_PER_FACE` | 12 | Exact on-screen appearances per face; also = number of blocks |
| `FACES_PER_TRIAL` | 4 | Faces shown simultaneously per trial |
| `TOTAL_FACES` | 100 | Total unique Phase 1 faces |
| `FACE_COLOR_SPLIT` | equal: 50/50; majority: 80/20 | Unique members per color group |
| `GOOD_BAD_RATIO` | 70/30 | Good/bad split within each color group |
| `GOOD_PERSON_PROBS` | reward 90% / punish 10% | Outcome probabilities for good faces |
| `BAD_PERSON_PROBS` | reward 50% / punish 50% | Outcome probabilities for bad faces |

### Valid range for `EXPOSURES_PER_FACE`

Constraint: `TOTAL_FACES` must be divisible by `FACES_PER_TRIAL`. Currently
100 / 4 = 25 (exact), so **any positive integer** is valid.

Total trials = `TOTAL_FACES × EXPOSURES_PER_FACE / FACES_PER_TRIAL`

| EXPOSURES_PER_FACE | Total trials | E[interactions/face] |
|---|---|---|
| 4 | 100 | 1.0 |
| 8 | 200 | 2.0 |
| **12** | **300** | **3.0** ← current |
| 16 | 400 | 4.0 |
| 20 | 500 | 5.0 |
