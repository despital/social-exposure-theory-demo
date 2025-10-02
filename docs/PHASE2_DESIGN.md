# Phase 2: Partner Choice Task - Design Document

**Status:** Demo Implementation Complete (Placeholder Stimuli)
**Last Updated:** 2025-10-01

---

## Overview

Phase 2 is a partner choice task designed to measure participants' willingness to interact with novel members from different social groups after exposure manipulation in Phase 1.

**Research Question:** Will participants in the majority-minority exposure condition show less willingness to interact with novel outgroup members compared to those in the equal exposure condition?

---

## Current Implementation (Demo Version)

### Trial Structure

**Total Trials:** 25 trials
- 5 different exposure ratio compositions
- 5 trials per composition
- Balanced design across all compositions

**Exposure Ratios (Red:Blue faces per trial):**
1. 4:0 (all majority group)
2. 3:1 (majority-heavy)
3. 2:2 (balanced)
4. 1:3 (minority-heavy)
5. 0:4 (all minority group)

### Key Features

**No Immediate Feedback:**
- Participants make choices without seeing outcomes
- Outcomes are calculated in the background
- Total Phase 2 score shown at end

**Novel Faces:**
- ⚠️ **Demo Limitation:** Currently uses SAME 100 faces from Phase 1
- Each face appears only once in Phase 2
- Production version will use completely separate face identities

**Progress Bar:**
- Continues from Phase 1 (starts at 100%)
- Phase 2 adds an additional 50% to progress bar
- Final progress: 150% (but displayed as continuing)

---

## Data Collected

**Per Trial:**
- `task`: "phase2_choice"
- `phase`: 2
- `composition`: e.g., "3R-1B"
- `red_count`: Number of red faces shown
- `blue_count`: Number of blue faces shown
- `chosen_face_id`: ID of selected face
- `chosen_face_color`: Color of selected face
- `chosen_face_is_good`: Good/bad status (hidden from participant)
- `outcome`: Points earned (hidden from participant)
- `phase2_score`: Running total
- `rt`: Reaction time

**Summary Data:**
- Phase 2 total score
- Combined Phase 1 + Phase 2 score

---

## Design Calculation

### Image Requirements

**Current Demo:**
- Uses 100 faces total (50 red + 50 blue)
- 25 trials × 4 faces/trial = 100 face presentations
- Each face used exactly once

**Breakdown by composition (5 trials each):**
- 4R-0B: 20 red, 0 blue
- 3R-1B: 15 red, 5 blue
- 2R-2B: 10 red, 10 blue
- 1R-3B: 5 red, 15 blue
- 0R-4B: 0 red, 20 blue
- **Total:** 50 red + 50 blue = 100 faces

### Production Requirements

**For truly novel stimuli:**
- **Option A:** 200 total face identities
  - Phase 1: 100 identities (each shown with red/blue background)
  - Phase 2: 100 NEW identities (50 red + 50 blue)

- **Option B:** 150 total face identities
  - Phase 1: 50 identities (used across conditions)
  - Phase 2: 100 NEW identities

---

## Open Questions & Design Decisions Needed

### 1. ⚠️ **CRITICAL: Dependent Variable Problem**

**Current Issue:** If all faces in Phase 2 are novel, what's the comparison?

**Potential Solutions:**
- **Option A:** Compare proportion of minority-group choices between conditions
  - Equal condition baseline: ~50% minority choices expected
  - Majority-minority condition: Hypothesis predicts <50% minority choices

- **Option B:** Mix novel and familiar faces (as suggested by supervisor)
  - More complex design: some trials with 4 novel, some with mix
  - Would need to track: novel vs. familiar, and familiarity × outcome history
  - Analysis complexity increases significantly

**Recommendation Needed:** Which approach to use?

### 2. Trial Composition Distribution

**Current:** Equal number of each composition (5 trials × 5 compositions)

**Alternatives:**
- Weight compositions differently based on Phase 1 condition?
- More trials of critical compositions (e.g., 2:2 balanced trials)?

### 3. Good/Bad Status Assignment

**Current:** Phase 2 faces inherit good/bad status (80/20 ratio)

**Questions:**
- Should novel faces have good/bad status at all?
- If yes, should ratio match Phase 1 (80/20)?
- Do participants expect rewards/punishments in Phase 2?

### 4. Feedback Timing

**Current:** No immediate feedback, summary at end

**Alternatives:**
- No feedback at all (pure preference measure)?
- Feedback after every N trials?
- Only total score at end (current implementation)?

### 5. Instructions Clarity

**Current:** "Choose a person you would like to interact with"

**Considerations:**
- Should we explicitly say "novel faces"?
- How to frame the lack of feedback?
- Should we remind them of Phase 1 learning?

---

## Implementation Notes

### Files Modified

**`src/utils/config.js`:**
```javascript
PHASE2_TRIALS_PER_COMPOSITION: 5,
PHASE2_COMPOSITIONS: [
    { red: 4, blue: 0 },
    { red: 3, blue: 1 },
    { red: 2, blue: 2 },
    { red: 1, blue: 3 },
    { red: 0, blue: 4 }
]
```

**`src/utils/helpers.js`:**
- Added `generatePhase2Trials()` function
- Samples faces without replacement
- Ensures each face appears only once
- Balances compositions
- Shuffles trial order

**`src/experiment.js`:**
- Phase 1 complete screen
- 60-second break with skip option
- Phase 2 instructions
- Phase 2 choice trials (no feedback)
- Phase 2 summary screen
- Updated final completion screen

### Known Limitations (Demo)

1. **Not truly novel:** Uses same face identities as Phase 1
2. **Insufficient faces:** Would need 200+ for production with more trials
3. **Dependent variable unclear:** See Open Questions #1
4. **No mixed novel/familiar:** Simpler version for now

---

## Future Enhancements

### Short-term (For Production)

1. Acquire 100+ novel face identities (StyleGAN3 or other source)
2. Decide on dependent variable approach
3. Add attention checks if Phase 2 is long
4. Consider adding practice trials for Phase 2

### Long-term (If Mixing Novel/Familiar)

1. Design trial composition with novel + familiar faces
2. Track familiarity and outcome history
3. More complex analysis: interaction effects
4. Longer experiment duration

---

## Testing Checklist

- [ ] Verify 25 trials total in Phase 2
- [ ] Verify each composition appears 5 times
- [ ] Verify no face repeats within Phase 2
- [ ] Verify progress bar continues from Phase 1
- [ ] Verify no feedback shown during Phase 2 trials
- [ ] Verify Phase 2 summary shows correct score
- [ ] Verify combined score calculation
- [ ] Test with different Phase 1 conditions (equal, majority-red, majority-blue)

---

## Questions for Research Team

1. **Stimuli:** Approve using same faces for demo, confirm need for novel set?
2. **Dependent Variable:** Which analysis approach? (pure minority proportion vs. mixed design)
3. **Trial Count:** Is 25 trials sufficient, or need more statistical power?
4. **Feedback:** Confirm no immediate feedback is correct design?
5. **Instructions:** Review Phase 2 instruction wording?

---

**Next Steps:**
1. Get research team feedback on open questions
2. Acquire novel face stimuli for production
3. Finalize dependent variable approach
4. Test demo implementation