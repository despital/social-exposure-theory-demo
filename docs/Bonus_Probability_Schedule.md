# Bonus Probability Schedule (Phase 1 Score — Smooth Ladder)

Probabilistic **$5** bonus keyed to the participant’s **Phase 1 point total** under Config A.

## Definitions

- Phase 1 score \(s\) accumulates trial outcomes: +1 reward or −5 punishment.
- Live bonus chance and the end-of-study draw use **score** via a smooth discrete ladder.
- Bad-face avoidance \(m\) is still logged for analysis but does **not** set \(P\).
- Reference link \(s \leftrightarrow m\): expected score if you avoid \(m\) of 48 bad-present trials.

\[
\mathrm{EV}(m) = 2.4m - 91.2
\]

Ladder steps are spaced by **+2.4 points** (≈ **+1** avoided bad-present trial under that EV).

## Schedule

\(P =\) highest ladder row with `minScore ≤ s` (else **0%**).

| Phase 1 score (\(s\)) | ≈ Avoided (\(m\)) | P(bonus) |
|----------------------:|------------------:|---------:|
| \(s < -19.2\) | ≤ 30 | 0% |
| ≥ −19.2 | 30 | 5% |
| ≥ −16.8 | 31 | 10% |
| ≥ −14.4 | 32 | 15% |
| ≥ −12.0 | 33 | 20% |
| ≥ −9.6 | 34 | 25% |
| ≥ −7.2 | 35 | 30% |
| ≥ −4.8 | 36 (≈ random) | 35% |
| ≥ −2.4 | 37 | 40% |
| ≥ 0.0 | 38 | 50% |
| ≥ 2.4 | 39 | 55% |
| ≥ 4.8 | 40 | 60% |
| ≥ 7.2 | 41 | 70% |
| ≥ 9.6 | 42 | 75% |
| ≥ 12.0 | 43 | 80% |
| ≥ 14.4 | 44 | 85% |
| ≥ 16.8 | 45 | 90% |
| ≥ 19.2 | 46 | 95% |
| ≥ 21.6 | 47 | 100% |

\(m\) is the **EV-equivalent** avoidance for that score landmark, not guaranteed actual avoidance (outcomes are noisy).

## Design notes

- Rises in ~5% steps (with a slightly steeper band above chance).
- Random-level EV (\(m \approx 36\), \(s = -4.8\)) → **35%**, not 0%.
- 100% only near the top of the achievable range (\(s \ge 21.6\), ≈ \(m = 47\)).

## Applying in the experiment

1. Update score after each Phase 1 outcome.
2. \(P =\) highest `BONUS_PROBABILITY_LADDER` row with `minScore ≤ s`.
3. At study end, draw once: win $5 with probability \(P\).

Phase 2 does not affect \(s\) or \(P\).
