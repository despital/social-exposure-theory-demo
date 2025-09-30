# Social Exposure Theory Experiment - Development Log

## Project Overview
A jsPsych-based experiment investigating approach-avoidance behavior towards in-group vs. out-group members in a social exposure paradigm.

**Current Status:** Phase 1 core functionality complete ✅
**Last Updated:** 2025-09-30

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

## Known Issues & Limitations

1. **No real face stimuli yet**: Using placeholder image paths
   - Images expected in: `stimuli/red_face_XXX.jpg` and `stimuli/blue_face_XXX.jpg`

2. **Firebase disabled**: Currently using demo credentials in read-only mode
   - Need to set up new Firebase project
   - Update credentials in `src/utils/config.js`

3. **No consent/surveys**: Core experiment only, missing:
   - Consent form
   - Demographics survey
   - Post-experiment debriefing
   - Attention checks

4. **No skip logic for development**: Developers must go through all trials
   - Should add debug mode with reduced trials

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