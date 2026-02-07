# Development Log

**Status:** Production Ready ✅
**Last Updated:** 2026-02-07

---

## Recent Updates

### Demographics Enhancement (2026-02-07)
- Added "Prefer not to say" option to geographic location dropdown
- Integrated `i18n-iso-countries` (249 countries) and `iso-639-1` (184 languages)
- Changed primary language from text input to searchable dropdown
- Both dropdowns auto-enable search functionality for 10+ options

### Extended Demographics Survey (2026-02-06)
Added 4-page demographics survey:
- **Page 1:** Age, gender, race/ethnicity
- **Page 2:** Education, SES, political orientation
- **Page 3:** Employment, language proficiency, geographic location
- **Page 4:** Vision, color blindness, device type

### End-of-Experiment Section (2026-02-06)
Implemented complete post-experiment workflow:
- Congratulations screen
- Debriefing (study purpose and design explanation)
- Technical check survey (with conditional follow-up for issues)
- User feedback (clarity 0-5, length rating, suggestions)
- Final score display with data saving confirmation

### Phase 3: Post-Task Rating (2026-02-06)
- Two questions per face: Good/Bad binary + Confidence (1-6 Likert)
- Randomized face presentation order
- Rates all faces from Phases 1 & 2 (~200 trials)
- Added to progress bar (final 25%)

### Debug Mode System (2026-02-06)
**Basic mode** (`?debug=true`):
- Reduces Phase 1: 100 trials (1 exposure vs. 3)
- Reduces Phase 2: 5 trials (1 per composition vs. 5)
- Skips consent, demographics, Phase 3 (configurable)
- Marks data with `debug_mode: true`

**Section jumping** (`?debug=true&section=X`):
- `consent`, `demographics`, `phase1`, `phase2`, `phase3`, `endsurvey`, `end`
- Test individual sections in isolation
- Combine with simulation: `?debug=true&section=phase3&simulate=visual`

### FaceGen Stimuli (2026-02-05)
- Integrated 100 FaceGen faces with colored backgrounds
- Generated 200 images (red/blue versions) via `generate_colored_faces.py`
- Deployed to GitHub Pages (both organization and personal repos)

---

## Key Technical Decisions

### Face Identity Assignment
Each face ID (0-99) randomly assigned to **either** red **or** blue group per experiment. Prevents same face appearing in both groups for a single participant. Implemented via `generateFaces(jsPsych)` with random shuffling.

### Sampling Strategy
- **Phase 1:** Uses `sampleWithReplacement` when needed (e.g., majority condition: 80 faces from pool of 50)
- **Phase 2:** Novel faces not seen in Phase 1
- Prevents "sample size exceeds set size" errors

### Configuration System
All parameters centralized in `src/utils/config.js`:
- Experiment parameters (exposures, faces per trial, ratios)
- Firebase configuration
- Debug mode settings
- Probabilities and reward values

### URL-Based Condition Assignment
Conditions assigned via URL parameters (no server needed):
- `?condition=equal&informed=true` - Equal exposure, informed
- `?condition=majority&informed=true&majority=red` - Majority red, informed
- Compatible with Prolific/Qualtrics

---

## Repository Structure

### Branches
- **`master`** - Development and source code
- **`gh-pages`** - Deployment (built files only)

### Remotes
- **`demo`** (Primary) - Personal repo: `despital/social-exposure-theory-demo`
  - Live URL: https://despital.github.io/social-exposure-theory-demo/
- **`origin`** (Backup) - Organization repo: `social-ai-uoft/social-exposure-theory`
  - Live URL: https://social-ai-uoft.github.io/social-exposure-theory/

### Deployment Workflow
```bash
npm run build                     # Build to dist/
git checkout gh-pages             # Switch to deployment branch
cp -r dist/* .                    # Copy built files
git add -A && git commit -m "..." # Commit
git push demo gh-pages            # Deploy to primary
git checkout master               # Return to dev
```

---

## Initial Implementation (2025-09-30)

### Core Features
- **Custom Plugin:** `plugin-image-multi-choice.js` for 4-face selection with direct click interaction
- **Block Design:** 3 blocks × 100 faces = 300 trials (Phase 1)
- **Stratified Assignment:** Maintains exact 80/20 good/bad ratio per group
- **Data Collection:** RT, choices, outcomes, running score
- **Firebase Integration:** Realtime Database with anonymous auth

### Project Setup
- jsPsych v8.2.2
- Webpack bundler with hot-reload
- Modular structure: `src/`, `stimuli/`, `assets/`, `docs/`
- Configuration-driven design

---

## Development Commands

```bash
npm start              # Dev server with hot reload
npm run build          # Production build to dist/

# Debug modes
http://localhost:8080/?debug=true                      # Reduced trials
http://localhost:8080/?debug=true&section=phase3       # Test Phase 3 only
http://localhost:8080/?debug=true&simulate=visual      # Auto-run with UI
```
