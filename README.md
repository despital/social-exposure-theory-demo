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