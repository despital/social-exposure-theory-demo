# Social Exposure Theory Experiment

A jsPsych experiment testing approach-avoidance behavior towards in-group vs. out-group members across two phases.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Configure Firebase:
   - Edit `src/utils/config.js` and replace the `FIREBASE_CONFIG` object with your Firebase credentials
   - Currently set to `DISABLE_DATA_SAVING: true` for development

3. Add face stimuli:
   - Place your GAN-generated face images in the `stimuli/faces/` folder
   - Format: `face_000_red.png` to `face_049_red.png` and `face_000_blue.png` to `face_049_blue.png`

## Development

### Running the Experiment Locally

Start the development server:
```bash
npm start
```

**To run the DEMO version** (shortened, 5+5 trials):
```
http://localhost:8080?demo=true
```

**To run the FULL version** (complete experiment with consent, demographics, Phase 1 & Phase 2):
```
http://localhost:8080
```

The project uses `src/index.js` as a router that automatically selects between `experiment.js` (full) and `experiment_demo.js` (demo) based on the URL parameter.

### Debug Mode

For rapid development and testing, the experiment includes a comprehensive debug mode system:

#### Basic Debug Mode
```
http://localhost:8080/?debug=true
```
- Skips consent form and demographics survey
- Reduces Phase 1: 100 trials (1 exposure) instead of 300
- Reduces Phase 2: 5 trials instead of 25
- Records debug status in data for filtering

#### Section Jumping
Jump directly to specific sections for rapid testing:

```
http://localhost:8080/?debug=true&section=consent       # Only consent form
http://localhost:8080/?debug=true&section=demographics  # Only demographics
http://localhost:8080/?debug=true&section=phase1        # Only Phase 1
http://localhost:8080/?debug=true&section=phase2        # Only Phase 2
http://localhost:8080/?debug=true&section=phase3        # Only Phase 3
http://localhost:8080/?debug=true&section=end           # Skip to end
```

#### Simulation Mode (jsPsych Built-in)
Automated testing with simulated participant behavior:

```
http://localhost:8080/?simulate=visual                  # Watch experiment run automatically
http://localhost:8080/?simulate=data                    # Generate data without visuals
```

#### Combined Usage
Combine debug and simulation for fastest iteration:

```
http://localhost:8080/?debug=true&section=phase3&simulate=visual
```

**Time Savings:**
- Full experiment: ~20-25 minutes
- Debug mode (all phases): ~3-5 minutes
- Section jumping (single phase): ~30 seconds - 2 minutes
- Visual simulation: ~10-30 seconds

**Configuration:**
Debug settings can be customized in `src/utils/config.js`:
```javascript
DEBUG_MODE: {
    SKIP_CONSENT: true,
    SKIP_DEMOGRAPHICS: true,
    SKIP_PHASE3: false,
    REDUCE_PHASE1_TRIALS: true,
    REDUCE_PHASE2_TRIALS: true,
    ENABLE_SIMULATION: false
}
```

## Build for Production

Build the experiment for deployment:
```bash
npm run build
```

The built files will be in the `dist/` folder.

### Deploying to GitHub Pages

1. Build the project: `npm run build`
2. Switch to the gh-pages branch: `git checkout gh-pages`
3. Copy all files from `dist/` to the root of gh-pages branch
4. Commit and push to gh-pages

Once deployed, users can access:
- Full version: `https://yourusername.github.io/repo-name/`
- Demo version: `https://yourusername.github.io/repo-name/?demo=true`

## Experiment Structure

The experiment consists of:

1. **Consent Form** - Informed consent with checkbox validation
2. **Demographics Survey** - 3-page survey collecting participant information
3. **Phase 1: Social Learning** (300 trials)
   - Participants choose 1 face from 4 options
   - Receive immediate feedback (+1 or -5 points)
   - Learn which individuals are "good" or "bad"
4. **Break Screen** - 60-second break with countdown timer
5. **Phase 2: Partner Choice** (25 trials)
   - Choose 1 face from 4 novel faces
   - No immediate feedback
   - Session summary shown at end
6. **Phase 3: Post-Task Rating** (~200 trials)
   - Rate all faces encountered in the experiment
   - Two questions per face:
     - **Good/Bad**: Binary choice between "Bad" and "Good"
     - **Confidence**: 6-level Likert scale (Very unconfident → Very confident)
   - Face order randomized

## Experiment Conditions

The experiment supports URL parameters for condition assignment:

### Equal Exposure + Informed
```
?condition=equal&informed=true
```

### Equal Exposure + Uninformed
```
?condition=equal&informed=false
```

### Majority Red + Informed
```
?condition=majority&majority_group=red&informed=true
```

### Majority Red + Uninformed
```
?condition=majority&majority_group=red&informed=false
```

### Majority Blue + Informed
```
?condition=majority&majority_group=blue&informed=true
```

### Majority Blue + Uninformed
```
?condition=majority&majority_group=blue&informed=false
```

### Optional: Participant ID
Add `&participant_id=XXX` to any URL, or use Prolific parameters (`PROLIFIC_PID`, `STUDY_ID`, `SESSION_ID`)

## Configuration

All hyperparameters are in `src/utils/config.js`:

### Phase 1 Parameters
- `EXPOSURES_PER_FACE`: Number of times each face appears (default: 3)
- `FACES_PER_TRIAL`: Number of faces shown per trial (default: 4)
- `GOOD_BAD_RATIO`: Proportion of good/bad people per group
- `GOOD_PERSON_PROBS`: Reward/punishment probabilities for good people
- `BAD_PERSON_PROBS`: Reward/punishment probabilities for bad people
- `REWARD_VALUE`: Points for reward (default: +1)
- `PUNISHMENT_VALUE`: Points for punishment (default: -5)

### Phase 2 Parameters
- `PHASE2_TRIALS_PER_COMPOSITION`: Trials per composition (default: 5)
- `PHASE2_COMPOSITIONS`: Array of red:blue ratios (4:0, 3:1, 2:2, 1:3, 0:4)

### Phase 3 Parameters
- Phase 3 trials are automatically generated based on faces shown in Phases 1 and 2
- Two trials per unique face: good/bad rating + confidence rating
- Face presentation order is randomized

## Project Structure

```
social-exposure-theory/
├── src/
│   ├── index.js                # Entry point & version router
│   ├── index.html              # HTML template
│   ├── experiment.js           # Full experiment (Phase 1 & 2)
│   ├── experiment_demo.js      # Demo version (shortened)
│   ├── plugins/
│   │   └── plugin-image-multi-choice.js  # Custom jsPsych plugin
│   ├── styles/
│   │   └── main.scss           # Experiment styles
│   └── utils/
│       ├── config.js           # Configuration & hyperparameters
│       └── helpers.js          # Helper functions
├── stimuli/                    # Face images (not included)
├── assets/                     # Consent forms, etc.
├── docs/                       # Documentation
├── dist/                       # Build output (generated)
├── webpack.config.js           # Webpack configuration
└── package.json                # Dependencies
```

## Data

Data is automatically saved to Firebase at the end of the experiment. Each participant's data includes:

### Phase 1 Data
- Trial-by-trial choices
- Outcomes (rewards/punishments)
- Face information (ID, color, good/bad status)
- Reaction times
- Running score

### Phase 2 Data
- Partner choices
- Face compositions (red:blue ratios)
- Outcomes (calculated but not shown)
- Phase 2 total score

### Phase 3 Data
- Good/bad ratings for each face encountered
- Confidence ratings (1-6 scale)
- Face information (ID, color, actual good/bad status)
- Reaction times for both rating types
- Link between good/bad rating and corresponding confidence rating

### Global Data
- Condition parameters
- Participant ID
- Demographics responses
- Timestamps

## Documentation

For detailed information, see:
- `docs/PHASE2_DESIGN.md` - Phase 2 design specifications
- `docs/DEV_LOG.md` - Development history and decisions
- `docs/TODO.md` - Task list and priorities
- `docs/HANDOFF_DOC.md` - Project handoff guide