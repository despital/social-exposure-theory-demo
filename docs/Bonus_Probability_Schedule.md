# Bonus Probability Schedule (Phase 1 Points)

Probabilistic bonus keyed to Phase 1 expected points under Config A, using the **blocks-avoided** ladder as the interpretive scale.

## Assumptions (EV calculation)

- Good-face outcome EV: \(0.9(+1) + 0.1(-5) = +0.4\)
- Bad-face outcome EV: \(0.5(+1) + 0.5(-5) = -2.0\)
- Each block: 4 trials with one bad face present + 1 all-good trial
- **Avoided block:** every choice is a good face → block EV \(= 5 \times 0.4 = 2.0\)
- **Failed block:** pick the bad face on all 4 bad-present trials; good on the all-good trial → block EV \(= 4 \times (-2.0) + 0.4 = -7.6\)
- For \(k\) blocks avoided (and \(12 - k\) failed):  
  \(\mathrm{EV}(k) = 2.0\,k + (-7.6)\,(12 - k) = 9.6k - 91.2\)

## Schedule

\(P(\text{bonus}) = 10\% \times (\text{blocks avoided})\), for \(k = 0 \ldots 10\).

| Blocks avoided | EV (points) | P(bonus) |
|----------------|-------------|----------|
| 0 | −91.2 | 0% |
| 1 | −81.6 | 10% |
| 2 | −72.0 | 20% |
| 3 | −61.2 | 30% |
| 4 | −52.8 | 40% |
| 5 | −43.2 | 50% |
| 6 | −33.6 | 60% |
| 7 | −24.0 | 70% |
| 8 | −14.4 | 80% |
| 9 | −4.8 | 90% |
| 10 | 4.8 | 100% |

## Applying to an observed Phase 1 score \(S\)

Assign the bonus probability for the **highest** row whose EV \(\le S\).

- \(S < -91.2\) → 0%
- \(S \ge 4.8\) → 100% (includes avoid 11–12, whose EVs are 14.4 and 24.0)

Phase 2 slider points are not included in this ladder unless folded into \(S\) by a later design choice.
