# Social Exposure Theory Experiment - Development Log

## Project Overview
A jsPsych-based experiment investigating approach-avoidance behavior towards in-group vs. out-group members in a social exposure paradigm.

**Current Status:** Full Experiment Complete (Phase 1-3 + End-of-Experiment Section) ✅
**Last Updated:** 2026-02-06

---

## Session 4: End-of-Experiment Section (2026-02-06)

### What We Did

#### Implemented Comprehensive End-of-Experiment Section
Added a complete end-of-experiment workflow after Phase 3 to collect final feedback and debrief participants.

**Structure:**
1. **Congratulations Screen**
   - Acknowledges completion of all experiment phases
   - Prepares participants for final questions

2. **Debriefing Screen**
   - Explains the study's purpose: investigating social learning and decision-making
   - Describes what participants did in each phase:
     - Phase 1: Learning about individuals through rewards/punishments
     - Phase 2: Generalizing learning to novel individuals
     - Phase 3: Explicit attitude ratings
   - Clarifies the meaning of background colors (red/blue social groups)

3. **Technical Check Survey** (with conditional logic)
   - Image loading check: "Did all images load properly?"
   - Technical difficulties: Yes/No question
   - **Conditional follow-up**: If "Yes" to difficulties, text area appears for details
   - Uses SurveyJS `visibleIf` for conditional logic

4. **User Feedback Survey**
   - **Clarity Rating**: 0-5 scale ("How clear was the experiment design?")
     - Changed from binary yes/no to rating scale per user request
   - **Length Rating**: 5-point scale from "Much too short" to "Much too long"
     - Reworded to gauge appropriateness of experiment duration
   - **Open-ended Suggestions**: Multi-line text area for improvement ideas

5. **Final Thank You Screen with Scores**
   - Displays participant performance in styled box:
     - Phase 1 Score
     - Phase 2 Score
     - Total Score (highlighted in green)
   - Notifies that data will be saved next
   - Button: "Save Data"

**Debug Mode Integration:**
- Added `endsurvey` to `DEBUG_SECTIONS` in config.js
- Can jump directly to end-of-experiment section: `?debug=true&section=endsurvey`
- When section is skipped in debug mode, shows simplified finish screen (original behavior)

**Files Modified:**
- `src/utils/config.js`:
  - Added `endsurvey` to `DEBUG_SECTIONS` (line 69)
  - Available sections now: consent, demographics, phase1, phase2, phase3, endsurvey, end
- `src/experiment.js`:
  - Replaced single finish screen with comprehensive end section (lines 795-968)
  - All screens conditionally rendered based on `shouldShowSection('endsurvey')`
  - Maintains backward compatibility with simplified screen when skipped
- `README.md`:
  - Updated Section Jumping documentation to include endsurvey
  - Updated Experiment Structure to list all 8 sections including end section and data saving
- `docs/DEV_LOG.md`:
  - Added Session 4 entry (this section)

**Data Collected:**
- `task: 'endsurvey_congratulations'` - Congratulations screen
- `task: 'endsurvey_debriefing'` - Debriefing screen
- `task: 'endsurvey_technical_check'` - Technical check survey responses
  - `images_loaded`: Yes/No/Not sure
  - `technical_difficulties`: Yes/No
  - `technical_difficulties_details`: Text (conditional)
- `task: 'endsurvey_user_feedback'` - User feedback survey responses
  - `clarity_rating`: 0-5 scale
  - `length_rating`: 5-point categorical scale
  - `suggestions`: Open-ended text
- `task: 'endsurvey_final_thank_you'` - Final thank you screen

**Survey Plugin Features Used:**
- Multi-page surveys with `pages` array
- Conditional visibility with `visibleIf` property
- Rating scales with min/max descriptions
- Comment boxes with customizable rows and placeholders
- Required/optional field validation

### Testing Workflow
```bash
# Test only the end-of-experiment section
http://localhost:8080/?debug=true&section=endsurvey

# Test with visual simulation for rapid iteration
http://localhost:8080/?debug=true&section=endsurvey&simulate=visual

# Run full experiment with all sections
http://localhost:8080/?debug=true
```

---

## Session 3: Phase 3 Implementation & Debug Mode (2026-02-06)

### What We Did

#### Added Phase 3: Post-Task Rating
- Created new phase after Phase 2 where participants rate all faces they encountered
- Two-question format per face:
  1. **Good/Bad Rating**: Binary button choice ("Bad" vs "Good")
  2. **Confidence Rating**: 6-level Likert scale with word labels only
     - Very unconfident, Unconfident, Slightly unconfident, Slightly confident, Confident, Very confident
- Face order randomized to prevent order effects
- Progress bar updated to show Phase 3 progress (final 25% of bar)

**Helper Function Added:**
- `generatePhase3Trials()` in `helpers.js` (lines 178-226)
  - Collects all unique faces shown in Phase 1 and Phase 2
  - Creates two trials per face (good/bad + confidence)
  - Shuffles face order for randomization

**Data Collected:**
- `task`: 'phase3_goodbad' or 'phase3_confidence'
- `face_id`, `face_color`, `face_is_good`: Face information
- `rating`: 'bad' or 'good' (for good/bad trials)
- `confidence_level`: 1-6 (for confidence trials)
- `confidence_label`: Text label of confidence level
- `previous_goodbad_rating`: Links confidence to prior rating
- `rt`: Response time (automatic)

#### Implemented Comprehensive Debug Mode System

**1. Basic Debug Mode** (`?debug=true`):
- Skips consent form and demographics survey (configurable)
- Reduces Phase 1: 100 trials (1 exposure) instead of 300 (3 exposures)
- Reduces Phase 2: 5 trials (1 per composition) instead of 25 (5 per composition)
- Can skip Phase 3 (configurable in config.js)
- Records debug status in data for analysis filtering

**2. Section-Jumping System** (`?debug=true&section=X`):
Allows jumping directly to specific sections for rapid testing:
- `section=consent`: Only consent form
- `section=demographics`: Only demographics survey
- `section=phase1`: Only Phase 1 (skips consent, demographics)
- `section=phase2`: Only Phase 2
- `section=phase3`: Only Phase 3 post-task rating
- `section=end`: Skip directly to end screen
- `section=all`: All sections with reduced trials (default)

**3. Simulation Mode Integration** (`?simulate=visual` or `?simulate=data`):
Leverages jsPsych's built-in simulation for automated testing:
- `simulate=visual`: Watch experiment run automatically with UI
- `simulate=data`: Generate data without rendering visuals
- Combinable with debug mode for fastest testing: `?debug=true&section=phase3&simulate=visual`

**Configuration Added:**
```javascript
// config.js
DEBUG_MODE: {
    SKIP_CONSENT: true,
    SKIP_DEMOGRAPHICS: true,
    SKIP_PHASE3: false,
    REDUCE_PHASE1_TRIALS: true,
    REDUCE_PHASE2_TRIALS: true,
    ENABLE_SIMULATION: false
},
DEBUG_SECTIONS: {
    all: ['consent', 'demographics', 'phase1', 'phase2', 'phase3'],
    consent: ['consent'],
    demographics: ['demographics'],
    phase1: ['phase1'],
    phase2: ['phase2'],
    phase3: ['phase3'],
    end: []
}
```

**Console Logging:**
All debug actions are logged for transparency:
```
Debug mode: ENABLED
Section: phase3 -> Showing: ['phase3']
Debug mode: Reduced Phase 1 to 1 exposure per face
Debug mode: Reduced Phase 2 to 1 trial per composition
Debug mode: Skipped consent form
Debug mode: Skipped demographics survey
Phase 3 initialized: { totalTrials: 200, uniqueFaces: 100 }
```

### Technical Implementation Details

**Scope Management:**
- Phase 2 trials generated upfront (even if Phase 2 skipped) so Phase 3 can access face data
- `shouldShowSection()` helper function determines which sections to include
- Whitelist approach: only sections in `sectionsToShow` array are added to timeline

**jsPsych v8 Compatibility:**
- Fixed `button_html` parameter in Phase 3 trials to use function syntax:
  - Before: `button_html: '<button>%choice%</button>'`
  - After: `button_html: (choice) => \`<button>${choice}</button>\``
- Required for jsPsych v8 compatibility

**Files Modified:**
- `src/utils/config.js`: Added DEBUG_MODE and DEBUG_SECTIONS
- `src/utils/helpers.js`: Added `generatePhase3Trials()` function
- `src/experiment.js`:
  - Added Phase 3 timeline and trials
  - Implemented debug mode and section-jumping logic
  - Added simulation mode support at experiment run

### Development Workflow Benefits

**Fast Iteration Examples:**
```bash
# Test only Phase 3 with visual simulation
http://localhost:8080/?debug=true&section=phase3&simulate=visual

# Test Phase 2 with reduced trials
http://localhost:8080/?debug=true&section=phase2

# Quick run-through of entire experiment
http://localhost:8080/?debug=true&simulate=visual

# Test consent form changes
http://localhost:8080/?debug=true&section=consent
```

**Time Savings:**
- Full experiment: ~20-25 minutes
- Debug mode (all phases): ~3-5 minutes
- Section jumping (single phase): ~30 seconds - 2 minutes
- Simulation mode: ~10-30 seconds

---

## Git Repository Structure

### Branch Structure
This project uses two main branches:

1. **`master`** - Development branch
   - Contains source code and all assets
   - All development work happens here
   - Build artifacts (`dist/`) are generated from this branch

2. **`gh-pages`** - Deployment branch
   - Contains built/compiled files for GitHub Pages hosting
   - Only receives updates from `dist/` after building
   - Never modify source files directly on this branch

### Remote Structure
The project maintains two remote repositories:

1. **`demo`** (Primary) - **Personal Repository**
   - URL: `https://github.com/despital/social-exposure-theory-demo.git`
   - **This is the primary repository used for the actual experiment**
   - Deployed at: https://despital.github.io/social-exposure-theory-demo/
   - Participants will access the experiment from this URL

2. **`origin`** (Backup) - **Organization Repository**
   - URL: `https://github.com/social-ai-uoft/social-exposure-theory`
   - Serves as backup/archive
   - Deployed at: https://social-ai-uoft.github.io/social-exposure-theory/

**Important:** Both remotes are kept in sync, but the personal repo (`demo`) is what participants will use.

### Standard Deployment Workflow

When you need to deploy updates to GitHub Pages:

```bash
# 1. Ensure you're on master and changes are committed
git add .
git commit -m "Your changes description"
git push origin master
git push demo master

# 2. Build the project
npm run build

# 3. Switch to gh-pages branch
git checkout gh-pages

# 4. Copy built files to gh-pages root
cp -r dist/* .

# 5. Stage and commit all changes
git add -A
git commit -m "Deploy: brief description of what changed"

# 6. Push to both remotes
git push origin gh-pages
git push demo gh-pages

# 7. Switch back to master
git checkout master
```

**Key Points:**
- Always build from `master` branch with latest changes
- The `dist/` folder contains the production build
- Copy ALL files from `dist/` to gh-pages root to ensure everything is updated
- Push to both remotes to keep them synchronized
- Changes take a few minutes to appear on GitHub Pages after pushing

---

## Session 2: FaceGen Stimuli Integration (2026-02-05)

### What We Did

#### Generated Actual Face Stimuli
- Created 100 FaceGen face images with transparent backgrounds (PNG format)
- Developed Python script (`generate_colored_faces.py`) to generate colored versions:
  - Reads transparent PNG images from `stimuli/fg_faces/`
  - Creates 200 output images: both red and blue versions of all 100 faces
  - Applies solid red (255,0,0) and blue (0,0,255) backgrounds
  - Outputs to `stimuli/faces/` as PNG files

#### Deployment
- Built production version with new stimuli
- Deployed to GitHub Pages on both repositories:
  - Organization: https://social-ai-uoft.github.io/social-exposure-theory/
  - Personal: https://despital.github.io/social-exposure-theory-demo/
- Successfully replaced demo images with actual FaceGen stimuli

**Files Added:**
- `stimuli/fg_faces/face_001.png` to `face_100.png` (source images)
- `stimuli/faces/face_000_red.png` to `face_099_red.png` (red backgrounds)
- `stimuli/faces/face_000_blue.png` to `face_099_blue.png` (blue backgrounds)
- `generate_colored_faces.py` (image processing script)

---

## Session 1: Initial Setup & Phase 1 Development (2025-09-30)

### What We Built

#### 1. Project Infrastructure
- ✅ Initialized git repository
- ✅ Set up npm with jsPsych v8.2.2
- ✅ Configured webpack bundler with hot-reload
- ✅ Created modular project structure:
  ```
  src/
  ├── experiment.js          # Main experiment file
  ├── index.js              # Entry point
  ├── index.html            # HTML template
  ├── plugins/              # Custom jsPsych plugins
  │   └── plugin-image-multi-choice.js
  ├── styles/
  │   └── main.scss         # Experiment styling
  └── utils/
      ├── config.js         # Hyperparameters & configuration
      └── helpers.js        # Helper functions
  ```

#### 2. Custom jsPsych Plugin
**File:** `src/plugins/plugin-image-multi-choice.js`

Created a custom plugin for displaying 4 clickable face images:
- Displays images in a 2x2 grid
- Direct click interaction (face IS the button)
- Automatic RT recording
- Colored backgrounds (red/blue) for group distinction
- Hover effects for better UX
- Properly integrates with jsPsych data collection

**Parameters:**
- `images`: Array of image objects with `{src, color, data}`
- `prompt`: Text to display above images
- `image_width`, `image_height`: Dimensions (default: 200px)
- `grid_columns`: Number of columns (default: 2)
- `gap`: Space between images (default: 20px)

#### 3. Experiment Design Implementation

**Configuration System** (`src/utils/config.js`):
All hyperparameters are easily modifiable:
```javascript
EXPOSURES_PER_FACE: 3           // Each face shown 3 times
FACES_PER_TRIAL: 4             // 4 faces per choice trial
RED_FACES: 50, BLUE_FACES: 50  // 100 total faces
GOOD_BAD_RATIO: {              // Stratified assignment
  red: [0.8, 0.2],
  blue: [0.8, 0.2]
}
GOOD_PERSON_PROBS: {reward: 0.9, punishment: 0.1}
BAD_PERSON_PROBS: {reward: 0.5, punishment: 0.5}
REWARD_VALUE: 1
PUNISHMENT_VALUE: -5
```

**Trial Structure:**
- **Block design**: 3 blocks, each face appears once per block
- **Stratified assignment**: Maintains exact good/bad ratio within each color group
- **Random sampling**: Each participant gets different good/bad assignments
- **Exposure ratios**: Configurable via URL parameters

**Condition Assignment via URL Parameters:**
1. Equal exposure (50% red, 50% blue) + Informed
   - `?condition=equal&informed=true`
2. Equal exposure + Uninformed
   - `?condition=equal&informed=false`
3. Majority-Minority (80/20, counterbalanced) + Informed/Uninformed
   - `?condition=majority&majority_group=red&informed=true`
   - `?condition=majority&majority_group=red&informed=false`
   - `?condition=majority&majority_group=blue&informed=true`
   - `?condition=majority&majority_group=blue&informed=false`

#### 4. Data Collection

**Automatic jsPsych data:**
- `rt`: Reaction time in milliseconds
- `response`: Which face was clicked (0-3)

**Custom data tracked:**
- `chosen_face_id`: ID of selected face
- `chosen_face_color`: Color group (red/blue)
- `chosen_face_is_good`: Whether person is "good" or "bad"
- `outcome`: Reward (+1) or punishment (-5) received
- `total_score`: Running total score
- `block`: Block number (1-3)
- `trial_in_block`: Trial position within block
- `faces_shown`: All 4 faces displayed (IDs, colors, good/bad status)

**Global properties added:**
- `participant_id`, `study_id`, `session_id` (Prolific compatible)
- `condition`, `majority_group`, `informed`

#### 5. Firebase Integration
- ✅ Firebase SDK installed and imported
- ✅ Data saving logic implemented
- ⚠️ Currently disabled for development (`DISABLE_DATA_SAVING: true`)
- ⚠️ Using demo Firebase credentials (read-only)

#### 6. Timeline Flow
Current experiment flow:
1. Welcome screen
2. Instructions (dynamic based on informed/uninformed condition)
3. Main experiment loop (300 trials = 100 faces × 3 exposures):
   - Choice trial (click face)
   - Feedback trial (show outcome +1 or -5)
   - Progress bar updates
4. Completion screen with final score
5. Data saving (disabled in dev mode)
6. Goodbye screen

---

## Technical Decisions & Rationale

### Why Custom Plugin?
- Standard `html-button-response` couldn't handle 4 face images as clickable buttons
- Tried workarounds (faces in stimulus, buttons separately) but poor UX
- Custom plugin provides clean interaction: faces ARE the buttons
- Proper RT recording and data collection

### Why Block Design?
- Ensures each face appears exactly 3 times
- Easier to verify correct exposure counts
- Simpler logic than continuous sampling

### Why Stratified Assignment?
- Guarantees exact 80/20 good/bad ratio within each color group
- Prevents random imbalance (e.g., 38 red good + 42 blue good)
- More controlled experimental design

### Why URL Parameters?
- Static HTML deployment (no server logic needed for assignment)
- Easy to generate links for different conditions
- Compatible with Prolific/Qualtrics
- Can switch to server-based assignment later if needed

---

## Development Commands

```bash
# Start development server (with hot reload)
npm start

# Build for production
npm run build

# The built files will be in dist/ folder
# Upload dist/ to GitHub Pages for deployment
```

---

## Git Integration

Repository: `https://github.com/social-ai-uoft/social-exposure-theory`

Current branch: `master`

Files tracked:
- Source code (`src/`)
- Configuration files (`webpack.config.js`, `package.json`)
- Documentation (`docs/`, `README.md`)

Files ignored (`.gitignore`):
- `node_modules/`
- `dist/`
- Firebase config (if stored separately)

---

## Next Steps

See [TODO.md](./TODO.md) for upcoming tasks and priorities.