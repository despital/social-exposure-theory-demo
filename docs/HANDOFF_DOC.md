# Project Handoff Document
## Social Exposure Theory Experiment - Phase 1

> **Purpose:** This document summarizes the project for continuation in new AI assistant sessions or for onboarding team members.

---

## Quick Start for New Sessions

### Context Summary
We're building a jsPsych v8 experiment investigating approach-avoidance behavior towards in-group vs. out-group members. Participants see 4 faces per trial, choose one, and receive rewards/punishments. The experiment manipulates exposure ratios (equal 50/50 vs. majority-minority 80/20) and information about group statistics (informed vs. uninformed).

### Current State
- ✅ **Phase 1 core functionality is COMPLETE and working**
- ✅ Main experiment loop with 300 trials
- ✅ Custom jsPsych plugin for face selection
- ✅ Firebase integration (structure ready, needs credentials)
- ⚠️ Missing: consent form, surveys, debriefing
- ⚠️ Missing: real face stimuli (using placeholders)

### Tech Stack
- **Framework:** jsPsych v8.2.2
- **Build System:** Webpack 5 with hot reload
- **Styling:** SCSS
- **Database:** Firebase (Realtime Database + Anonymous Auth)
- **Hosting:** GitHub Pages (planned)
- **Repository:** https://github.com/social-ai-uoft/social-exposure-theory

### Development Commands
```bash
npm start         # Start dev server (http://localhost:8080)
npm run build     # Build for production (outputs to dist/)
```

---

## Project Architecture

### Directory Structure
```
social-exposure-theory/
├── src/
│   ├── experiment.js              # Main experiment (Phase 1)
│   ├── index.js                   # Entry point
│   ├── index.html                 # HTML template
│   ├── plugins/
│   │   └── plugin-image-multi-choice.js  # Custom jsPsych plugin
│   ├── styles/
│   │   └── main.scss              # All styling
│   └── utils/
│       ├── config.js              # ALL HYPERPARAMETERS HERE
│       └── helpers.js             # Face generation, trials, outcome logic
├── docs/
│   ├── DEV_LOG.md                 # Detailed development history
│   ├── TODO.md                    # Task list with priorities
│   └── HANDOFF_DOC.md             # This file
├── stimuli/                       # Face images (not yet added)
├── dist/                          # Build output (gitignored)
├── node_modules/                  # Dependencies (gitignored)
├── webpack.config.js              # Webpack configuration
├── package.json                   # Dependencies & scripts
└── .gitignore
```

### Key Files to Know

**`src/utils/config.js`** - Single source of truth for all experiment parameters:
- Trial counts, exposure ratios, reward/punishment values
- Good/bad person probabilities
- Firebase credentials
- DEBUG_MODE flag (to be added)

**`src/utils/helpers.js`** - Core logic functions:
- `generateFaces()`: Creates 100 face objects
- `assignGoodBad()`: Stratified assignment of good/bad status
- `generateTrials()`: Block design, respects exposure ratios
- `getOutcome()`: Probabilistic reward/punishment logic

**`src/plugins/plugin-image-multi-choice.js`** - Custom jsPsych plugin:
- Displays 4 clickable face images in a grid
- Records RT and response automatically
- Fully integrated with jsPsych data collection

**`src/experiment.js`** - Main experiment file:
- Imports all dependencies
- Defines timeline
- Handles data collection and Firebase saving

---

## Design Specifications

### Experimental Conditions (2×2 Design)

| Condition | URL Parameter | Description |
|-----------|--------------|-------------|
| Equal + Informed | `?condition=equal&informed=true` | 50% red, 50% blue faces; told groups are similar |
| Equal + Uninformed | `?condition=equal&informed=false` | 50% red, 50% blue faces; no info given |
| Majority Red + Informed | `?condition=majority&majority_group=red&informed=true` | 80% red, 20% blue; told groups are similar |
| Majority Red + Uninformed | `?condition=majority&majority_group=red&informed=false` | 80% red, 20% blue; no info given |
| Majority Blue + Informed | `?condition=majority&majority_group=blue&informed=true` | 20% red, 80% blue; told groups are similar |
| Majority Blue + Uninformed | `?condition=majority&majority_group=blue&informed=false` | 20% red, 80% blue; no info given |

**Total:** 6 unique experiment URLs

### Trial Structure
- **Total trials:** 300 (100 faces × 3 exposures)
- **Block design:** 3 blocks, each face appears once per block
- **Trial sequence:**
  1. Choice trial: See 4 faces, click one (custom plugin)
  2. Feedback trial: See outcome (+1 or -5), auto-advance after 1.5s
- **Progress bar** updates after each trial

### Person Types
- **Good person:** 90% chance of +1, 10% chance of -5
- **Bad person:** 50% chance of +1, 50% chance of -5
- **Ratio:** 80% good, 20% bad (within each color group)
- **Assignment:** Stratified (exact counts), randomized per participant

### Data Collected
Every choice trial saves:
- Standard jsPsych: `rt`, `response`, `trial_type`, `trial_index`
- Custom: `chosen_face_id`, `chosen_face_color`, `chosen_face_is_good`, `outcome`, `total_score`
- Trial context: `block`, `trial_in_block`, `faces_shown`
- Global: `participant_id`, `condition`, `majority_group`, `informed`

---

## Common Tasks & How-To

### Modify Hyperparameters
Edit `src/utils/config.js`:
```javascript
EXPOSURES_PER_FACE: 3,        // Change to 1 for quick testing
GOOD_BAD_RATIO: {
  red: [0.7, 0.3],           // Change ratio here
  blue: [0.7, 0.3]
},
REWARD_VALUE: 2,              // Change reward amount
PUNISHMENT_VALUE: -10         // Change punishment amount
```

### Add Debug Mode (TODO #1)
1. Add to `config.js`: `DEBUG_MODE: false`
2. In `experiment.js`, check URL param: `const debug = jsPsych.data.getURLVariable('debug') === 'true'`
3. Conditionally skip trials: `if (!debug) { timeline.push(consent, demographics); }`
4. Reduce exposures: `EXPOSURES_PER_FACE: debug ? 1 : 3`

### Add New Timeline Element
In `src/experiment.js`, add before/after existing trials:
```javascript
const newTrial = {
  type: HtmlKeyboardResponsePlugin,
  stimulus: 'Your content here',
  data: { task: 'your_task_name' }
};
timeline.push(newTrial);
```

### Update Firebase Credentials
1. Create Firebase project at https://console.firebase.google.com
2. Enable Realtime Database + Anonymous Authentication
3. Copy config from project settings
4. Paste into `src/utils/config.js` → `FIREBASE_CONFIG`
5. Change `DISABLE_DATA_SAVING: false`

### Add Face Images
1. Place images in `stimuli/` folder:
   - `red_face_000.jpg` through `red_face_049.jpg`
   - `blue_face_000.jpg` through `blue_face_049.jpg`
2. Images should have colored backgrounds (red/blue)
3. Recommended size: 400×400px or larger
4. Format: JPG or PNG

### Test Different Conditions
Visit these URLs:
- http://localhost:8080/?condition=equal&informed=true
- http://localhost:8080/?condition=majority&majority_group=red&informed=false
- (etc., see table above)

---

## Known Issues & Gotchas

1. **jsPsych v8 API changes:**
   - Use `jsPsych.evaluateTimelineVariable()` NOT `jsPsych.timelineVariable()`
   - Use `jsPsych.progressBar.progress = value` NOT `jsPsych.setProgressBar(value)`

2. **Timeline variables:**
   - Must use `evaluateTimelineVariable()` inside dynamic functions
   - Cannot access timeline variables outside of trial functions

3. **Firebase:**
   - Currently using demo credentials (READ-ONLY)
   - Data saving is DISABLED by default (`DISABLE_DATA_SAVING: true`)
   - Must set up new project before real data collection

4. **Image paths:**
   - Currently pointing to non-existent files
   - Experiment works but shows broken image icons
   - Need to add actual face images to `stimuli/` folder

5. **Webpack hot reload:**
   - Sometimes CSS changes don't hot-reload properly
   - Solution: Hard refresh browser (Ctrl+Shift+R) or restart dev server

---

## Important Context for AI Assistants

### What Works Well
- The custom plugin is solid and extensible
- Block design ensures correct exposure counts
- Stratified assignment guarantees exact ratios
- Configuration system is clean and modifiable
- Data structure is comprehensive

### What Needs Work
- Missing consent/surveys/debriefing (Priority 1)
- Need Firebase setup (Priority 1)
- No debug mode yet (Priority 2)
- No real face stimuli (Priority 3)

### Design Philosophy
- **Modular:** Keep plugin, config, and helpers separate
- **Configurable:** Everything in config.js, easy to modify
- **jsPsych-native:** Use jsPsych patterns and conventions
- **Data-rich:** Capture everything for later analysis

### When Adding Features
1. Check if similar code exists in `experiment_demo.js`
2. Put configuration in `src/utils/config.js`
3. Put logic in `src/utils/helpers.js`
4. Keep `experiment.js` focused on timeline definition
5. Test with URL parameters: `?debug=true`, `?condition=X`, etc.

---

## Questions to Ask Before Starting Work

1. **Is this for development or production?**
   - Development: Use `DISABLE_DATA_SAVING: true`, add debug mode
   - Production: Need Firebase credentials, full consent flow

2. **What phase are we working on?**
   - Phase 1: Face selection with rewards/punishments (DONE)
   - Phase 2: TBD (not yet designed)

3. **Do we have face stimuli yet?**
   - No: Continue with placeholders
   - Yes: Add to `stimuli/` folder with proper naming

4. **What's the immediate priority?**
   - Check `docs/TODO.md` for current priorities
   - Priority 1 tasks are essential for data collection

---

## Contact & Resources

**Reference Experiment:** `experiment_demo.js` (bridge rating experiment)
- Shows consent form implementation
- Shows survey structure
- Shows Firebase integration pattern
- Shows Prolific parameter handling

**jsPsych Documentation:**
- Plugin development: https://www.jspsych.org/v7/developers/plugin-development/
- Core library: https://www.jspsych.org/v8/
- Plugins: https://www.jspsych.org/v8/plugins/list-of-plugins/

**GitHub Repository:**
- https://github.com/social-ai-uoft/social-exposure-theory
- Branch: `master`

---

## Continuation Checklist for New Sessions

When starting a new chat with an AI assistant, provide:
1. This document (`HANDOFF_DOC.md`)
2. Current `docs/TODO.md` for priorities
3. The specific task or feature to work on
4. Any new requirements or changes to the design

**Example prompt:**
```
I'm continuing work on the Social Exposure Theory experiment.
Please read docs/HANDOFF_DOC.md for context.
I need to add [SPECIFIC TASK] - see docs/TODO.md #[TASK NUMBER].
Let me know if you have questions before starting.
```

---

**Document Version:** 1.0
**Last Updated:** 2025-09-30
**Status:** Phase 1 core complete, ready for additional features