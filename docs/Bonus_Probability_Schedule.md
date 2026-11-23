# Bonus Probability Schedule (Bad-Face Trials Avoided)

Probabilistic **$5** bonus keyed to how often the participant **avoids hostile (bad) faces** in Phase 1 under Config A.

## Definitions

- A **bad-present trial** is a Phase 1 panel that includes exactly one bad face (Config A packing: ≤1 bad per trial).
- Total bad-present trials: \(4 \text{ bad faces} \times 12 \text{ exposures} = \mathbf{48}\).
- **Avoided** (\(m\)): on a bad-present trial, the participant chooses a **good** face (does not pick the hostile person).
- All-good trials (12 per session) do not enter \(m\).

## Expected points if you avoid \(m\) of 48

Good-face EV \(= +0.4\); bad-face EV \(= -2.0\); plus 12 all-good trials at \(+0.4\):

\[
\mathrm{EV}(m) = 2.4m - 91.2
\]

- \(m = 0\) → −91.2 (always pick bad when present)  
- \(m = 36\) → −4.8 (≈ **random**, since \(0.75 \times 48 = 36\))  
- \(m = 48\) → +24 (perfect avoidance)

## Schedule

**Live bonus chance uses \(m\) directly** (not Phase 1 point total — outcomes are noisy).

- \(m \le 36\) (≤ random) → **0%**
- Then +10% per additional avoid through \(m = 45\) → **90%**
- \(m \ge 46\) → **100%**

| Bad-face trials avoided (\(m\)) | EV (points) | P(bonus) |
|---------------------------------|-------------|----------|
| 0–36 (≤ random) | ≤ −4.8 | 0% |
| 37 | −2.4 | 10% |
| 38 | 0.0 | 20% |
| 39 | 2.4 | 30% |
| 40 | 4.8 | 40% |
| 41 | 7.2 | 50% |
| 42 | 9.6 | 60% |
| 43 | 12.0 | 70% |
| 44 | 14.4 | 80% |
| 45 | 16.8 | 90% |
| 46–48 | ≥ 19.2 | 100% |

## Applying in the experiment

1. Count \(m\) after each Phase 1 choice on bad-present trials.  
2. \(P = \) highest ladder row with `minAvoided ≤ m`.  
3. At study end, draw once: win $5 with probability \(P\).

Phase 2 does not affect \(m\) or \(P\).
