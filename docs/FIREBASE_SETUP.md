# Firebase Setup and Data Structure

## Overview

This document describes the Firebase integration and optimized data structure for the Social Exposure Theory experiment.

## Current Status

✅ **Completed**:
- Firebase credentials integrated (Social Exposure Theory 2026)
- Optimized data structure implemented
- CSV export scripts created (Python & R)
- Documentation updated

⚠️ **Testing Phase**:
- Data saving currently **DISABLED** (`DISABLE_DATA_SAVING: true`)
- Enable for production: Set to `false` in `src/utils/config.js`

## What Changed

### OLD Structure (Problematic)
```
{random_firebase_uid}/
  {random_10_digit_number}/
    data: [all trials nested in array]
    study: 'social_exposure_theory_phase1'
    date: 'Thu Feb 06 2026...'
```

**Problems**:
- Random UIDs made it hard to identify participants
- Random session numbers had no meaning
- All data buried under "data" array
- Not analysis-ready
- Required custom script to unnest before use

### NEW Structure (Optimized)
```
participants/
  {participant_id}/              # Uses Prolific PID or internal_XXXXX
    metadata:
      internal_id               # Always generated
      prolific_pid              # From URL parameter
      study_id                  # From Prolific
      session_id                # From Prolific
      condition                 # Experiment condition
      majority_group            # red/blue
      informed                  # true/false
      timestamp                 # ISO format
      debug_mode                # Filter test data
    demographics: {...}
    summary:
      phase1_score
      phase2_score
      total_score
      *_trials_count
    trials:
      phase1: [array of Phase 1 trials]
      phase2: [array of Phase 2 trials]
      phase3: [array of Phase 3 trials]
    surveys:
      technical_check: {...}
      user_feedback: {...}
```

**Advantages**:
- ✅ Meaningful participant IDs
- ✅ Metadata at top level
- ✅ Organized by phase
- ✅ Easy to query and filter
- ✅ Direct CSV export
- ✅ Handles missing Prolific IDs gracefully

## Participant ID Strategy

The system uses a **dual ID approach**:

1. **Prolific PID** (Primary): Used as `participant_id` when available
2. **Internal ID** (Fallback): `internal_XXXXX` generated if Prolific PID missing
3. **Both stored**: `internal_id` always created for backup

This ensures:
- Data never lost if Prolific parameters fail
- Easy to identify Prolific participants
- Can link back to Prolific for payments

## How to Enable Data Saving

1. **Test First** (Recommended):
   ```javascript
   // In src/utils/config.js
   DISABLE_DATA_SAVING: false  // Enable saving
   ```

2. **Run a test participant**:
   ```
   http://localhost:8080?participant_id=TEST_001
   ```

3. **Check Firebase Console**:
   - Go to https://console.firebase.google.com
   - Select "Social Exposure Theory 2026" project
   - Navigate to Realtime Database
   - Look for `participants/TEST_001`

4. **Verify structure**:
   - Check metadata is present
   - Verify trials are separated by phase
   - Confirm demographics captured

5. **Export to CSV**:
   ```bash
   python scripts/firebase_to_csv.py
   ```

6. **Check output**:
   - Should see 6 CSV files in `data/csv_exports/`
   - Open in Excel/R to verify

## Firebase Security Rules (TODO)

Before production, set up security rules:

```json
{
  "rules": {
    "participants": {
      "$participant_id": {
        ".write": "auth != null && !data.exists()",
        ".read": "auth != null"
      }
    }
  }
}
```

This ensures:
- Participants can only write once (no overwriting)
- Must be authenticated (anonymous auth)
- Only authenticated users can read

## Data Export Workflow

### Option 1: Python
```bash
pip install pandas requests
python scripts/firebase_to_csv.py
```

### Option 2: R  
```r
install.packages(c("jsonlite", "dplyr", "tidyr", "purrr"))
source("scripts/firebase_to_csv.R")
export_all()
```

Both create:
- `participants.csv` - One row per participant
- `phase1_trials.csv` - All Phase 1 trials (long format)
- `phase2_trials.csv` - All Phase 2 trials
- `phase3_trials.csv` - All Phase 3 trials
- `demographics.csv` - Demographics responses
- `surveys.csv` - Survey responses

### Example Analysis (R)
```r
library(dplyr)

# Load data
participants <- read.csv('data/csv_exports/participants.csv')
phase1 <- read.csv('data/csv_exports/phase1_trials.csv')

# Filter real participants (exclude debug)
real_data <- participants %>%
  filter(debug_mode == FALSE)

# Merge trials with participant info
trials_full <- phase1 %>%
  inner_join(real_data, by = 'participant_id')

# Analyze by condition
condition_summary <- trials_full %>%
  group_by(condition, participant_id) %>%
  summarize(avg_score = mean(outcome))
```

## Troubleshooting

### "Data not saving"
- Check `DISABLE_DATA_SAVING: false`
- Verify Firebase credentials correct
- Check browser console for errors
- Ensure internet connection

### "Empty CSVs"
- Verify data exists in Firebase Console
- Check database URL in export script
- Confirm `/participants` path exists

### "Missing Prolific ID"
- Check URL parameters passed correctly
- Verify `participant_id` parameter present
- Falls back to `internal_XXXXX` if missing

## Next Steps

1. ✅ Test with one participant
2. ✅ Verify data structure in Firebase
3. ✅ Export and check CSVs
4. ⬜ Set up Firebase security rules
5. ⬜ Deploy to production
6. ⬜ Test with Prolific integration

## Questions?

See also:
- [scripts/README.md](../scripts/README.md) - Export script documentation
- [README.md](../README.md) - Main project documentation
- [docs/TODO.md](TODO.md) - Implementation checklist
