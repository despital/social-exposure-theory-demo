# Social Exposure Theory Experiment - Phase 1

A jsPsych experiment testing approach-avoidance behavior towards in-group vs. out-group members.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Configure Firebase:
   - Edit `src/experiment.js` and replace the `FIREBASE_CONFIG` object with your Firebase credentials
   - Or create a separate `src/firebase-config.js` file (it's in .gitignore)

3. Add face stimuli:
   - Place your GAN-generated face images in the `stimuli/` folder
   - Red background faces: `red_face_000.jpg` to `red_face_049.jpg`
   - Blue background faces: `blue_face_000.jpg` to `blue_face_049.jpg`

## Development

Run development server:
```bash
npm start
```

This will open the experiment at `http://localhost:8080`

## Build for Production

```bash
npm run build
```

The built files will be in the `dist/` folder, ready for deployment.

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

All hyperparameters are in `src/experiment.js` under the `CONFIG` object:

- `EXPOSURES_PER_FACE`: Number of times each face appears (default: 3)
- `FACES_PER_TRIAL`: Number of faces shown per trial (default: 4)
- `GOOD_BAD_RATIO`: Proportion of good/bad people per group
- `GOOD_PERSON_PROBS`: Reward/punishment probabilities for good people
- `BAD_PERSON_PROBS`: Reward/punishment probabilities for bad people
- `REWARD_VALUE`: Points for reward (default: +1)
- `PUNISHMENT_VALUE`: Points for punishment (default: -5)

## Project Structure

```
social-exposure-theory/
├── src/
│   ├── index.js           # Entry point
│   ├── experiment.js      # Main experiment code
│   ├── index.html         # HTML template
│   └── styles/
│       └── main.scss      # Experiment styles
├── stimuli/               # Face images (not included)
├── dist/                  # Build output (generated)
├── webpack.config.js      # Webpack configuration
└── package.json           # Dependencies
```

## Data

Data is automatically saved to Firebase at the end of the experiment. Each participant's data includes:
- Trial-by-trial choices
- Outcomes (rewards/punishments)
- Face information (ID, color, good/bad status)
- Total score
- Condition parameters
- Timestamps