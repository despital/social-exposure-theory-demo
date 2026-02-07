# Data Export Scripts

This folder contains scripts to convert manually downloaded Firebase data to CSV format for analysis.

## Quick Start

### Step 1: Download Data from Firebase

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: **socialexposuretheory2026**
3. Navigate to **Realtime Database**
4. Click on the **participants** node
5. Click the **⋮** menu → **Export JSON**
6. Save the file as: `data/firebase_export.json`

### Step 2: Convert to CSV

**Python:**
```bash
pip install pandas
python scripts/firebase_to_csv.py
```

**R:**
```r
install.packages(c("jsonlite", "dplyr", "tidyr", "purrr"))
source("scripts/firebase_to_csv.R")
export_all()
```

## Output Files (in data/csv_exports/)
- **participants.csv** - Metadata, conditions, summary scores
- **demographics.csv** - Demographics responses
- **phase1_trials.csv** - All Phase 1 trials
- **phase2_trials.csv** - All Phase 2 trials  
- **phase3_trials.csv** - All Phase 3 trials (ratings + confidence)
- **surveys.csv** - Technical check + user feedback

## Firebase Structure
```
participants/
  {participant_id}/
    metadata: {internal_id, prolific_pid, condition, ...}
    demographics: {...}
    summary: {phase1_score, phase2_score, total_score}
    trials: {phase1: [...], phase2: [...], phase3: [...]}
    surveys: {technical_check: {...}, user_feedback: {...}}
```
