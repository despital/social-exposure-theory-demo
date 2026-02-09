"""
Firebase to CSV Converter for Social Exposure Theory Experiment

This script converts manually downloaded Firebase data to CSV files for analysis in R/Python.

How to use:
    1. Download data from Firebase Console:
       - Go to https://console.firebase.google.com/
       - Select your project: socialexposuretheory2026
       - Go to Realtime Database
       - Click on "participants" node
       - Click the ⋮ menu → Export JSON
       - Save as: data/firebase_export.json

    2. Run this script:
       python scripts/firebase_to_csv.py

Output (in data/csv_exports/):
    - participants.csv: One row per participant with metadata and summary scores
    - phase1_trials.csv: All Phase 1 trials (long format)
    - phase2_trials.csv: All Phase 2 trials (long format)
    - phase3_trials.csv: All Phase 3 trials (long format)
    - demographics.csv: All demographics responses
    - surveys.csv: Technical check and user feedback responses
"""

import json
import pandas as pd
from pathlib import Path

# ============================================================================
# CONFIGURATION
# ============================================================================

# Input file (manually downloaded from Firebase)
INPUT_FILE = Path("data/firebase_export.json")

# Output directory
OUTPUT_DIR = Path("data/csv_exports")
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

# ============================================================================
# LOAD DATA FROM FILE
# ============================================================================

def load_firebase_data():
    """Load data from manually downloaded Firebase JSON file"""
    if not INPUT_FILE.exists():
        raise FileNotFoundError(
            f"\n❌ Error: {INPUT_FILE} not found!\n\n"
            f"Please download your Firebase data first:\n"
            f"  1. Go to Firebase Console: https://console.firebase.google.com/\n"
            f"  2. Select project: socialexposuretheory2026\n"
            f"  3. Go to Realtime Database\n"
            f"  4. Click on 'participants' node\n"
            f"  5. Click ⋮ menu → Export JSON\n"
            f"  6. Save as: {INPUT_FILE}\n"
        )

    print(f"Loading data from {INPUT_FILE}...")
    with open(INPUT_FILE, 'r', encoding='utf-8') as f:
        data = json.load(f)

    # Firebase export includes a wrapper with the node name
    # Extract the participants node if it exists
    if isinstance(data, dict) and 'participants' in data:
        print("✓ Detected Firebase export format, extracting participants node...")
        data = data['participants']

    if data is None or len(data) == 0:
        raise ValueError("Firebase export file is empty or contains no participants")

    print(f"✓ Loaded data for {len(data)} participants")
    return data

# ============================================================================
# CONVERT TO CSV
# ============================================================================

def flatten_participants(firebase_data):
    """Create participants.csv with metadata and summary scores"""
    participants = []

    for participant_id, pdata in firebase_data.items():
        metadata = pdata.get('metadata', {})
        summary = pdata.get('summary', {})

        row = {
            'participant_id': participant_id,
            # Metadata
            'internal_id': metadata.get('internal_id'),
            'prolific_pid': metadata.get('prolific_pid'),
            'study_id': metadata.get('study_id'),
            'session_id': metadata.get('session_id'),
            'condition_code': metadata.get('condition_code'),
            'condition': metadata.get('condition'),
            'majority_group': metadata.get('majority_group'),
            'p1_type': metadata.get('p1_type'),
            'p2_exposure': metadata.get('p2_exposure'),
            'timestamp': metadata.get('timestamp'),
            'debug_mode': metadata.get('debug_mode'),
            # Summary scores
            'phase1_score': summary.get('phase1_score'),
            'phase2_score': summary.get('phase2_score'),
            'total_score': summary.get('total_score'),
            'phase1_trials_count': summary.get('phase1_trials_count'),
            'phase2_trials_count': summary.get('phase2_trials_count'),
            'phase3_trials_count': summary.get('phase3_trials_count')
        }
        participants.append(row)

    df = pd.DataFrame(participants)
    return df

def flatten_demographics(firebase_data):
    """Create demographics.csv"""
    demographics = []

    for participant_id, pdata in firebase_data.items():
        demo = pdata.get('demographics', {})
        if demo:
            row = {
                'participant_id': participant_id,
                **demo  # Unpack all demographics fields
            }
            demographics.append(row)

    df = pd.DataFrame(demographics)
    return df

def flatten_trials(firebase_data, phase):
    """Create phase-specific trial CSV"""
    trials = []

    for participant_id, pdata in firebase_data.items():
        phase_trials = pdata.get('trials', {}).get(f'phase{phase}', [])

        for trial in phase_trials:
            row = {
                'participant_id': participant_id,
                **trial  # Unpack all trial fields
            }
            trials.append(row)

    df = pd.DataFrame(trials)
    return df

def flatten_surveys(firebase_data):
    """Create surveys.csv with technical check and user feedback"""
    surveys = []

    for participant_id, pdata in firebase_data.items():
        survey_data = pdata.get('surveys', {})

        row = {
            'participant_id': participant_id,
            # Technical check
            'images_loaded': survey_data.get('technical_check', {}).get('images_loaded'),
            'technical_difficulties': survey_data.get('technical_check', {}).get('technical_difficulties'),
            'technical_difficulties_details': survey_data.get('technical_check', {}).get('technical_difficulties_details'),
            # User feedback
            'clarity_rating': survey_data.get('user_feedback', {}).get('clarity_rating'),
            'length_rating': survey_data.get('user_feedback', {}).get('length_rating'),
            'suggestions': survey_data.get('user_feedback', {}).get('suggestions')
        }
        surveys.append(row)

    df = pd.DataFrame(surveys)
    return df

# ============================================================================
# MAIN EXPORT FUNCTION
# ============================================================================

def export_all():
    """Main function to load and export all data to CSV files"""

    # Load data from manually downloaded file
    firebase_data = load_firebase_data()

    # Export participants
    print("\nExporting participants.csv...")
    df_participants = flatten_participants(firebase_data)
    df_participants.to_csv(OUTPUT_DIR / "participants.csv", index=False)
    print(f"✓ Saved {len(df_participants)} participants")

    # Export demographics
    print("\nExporting demographics.csv...")
    df_demographics = flatten_demographics(firebase_data)
    df_demographics.to_csv(OUTPUT_DIR / "demographics.csv", index=False)
    print(f"✓ Saved {len(df_demographics)} demographics responses")

    # Export Phase 1 trials
    print("\nExporting phase1_trials.csv...")
    df_phase1 = flatten_trials(firebase_data, phase=1)
    df_phase1.to_csv(OUTPUT_DIR / "phase1_trials.csv", index=False)
    print(f"✓ Saved {len(df_phase1)} Phase 1 trials")

    # Export Phase 2 trials
    print("\nExporting phase2_trials.csv...")
    df_phase2 = flatten_trials(firebase_data, phase=2)
    df_phase2.to_csv(OUTPUT_DIR / "phase2_trials.csv", index=False)
    print(f"✓ Saved {len(df_phase2)} Phase 2 trials")

    # Export Phase 3 trials
    print("\nExporting phase3_trials.csv...")
    df_phase3 = flatten_trials(firebase_data, phase=3)
    df_phase3.to_csv(OUTPUT_DIR / "phase3_trials.csv", index=False)
    print(f"✓ Saved {len(df_phase3)} Phase 3 trials")

    # Export surveys
    print("\nExporting surveys.csv...")
    df_surveys = flatten_surveys(firebase_data)
    df_surveys.to_csv(OUTPUT_DIR / "surveys.csv", index=False)
    print(f"✓ Saved {len(df_surveys)} survey responses")

    print(f"\n✅ All files exported to: {OUTPUT_DIR.absolute()}")

    # Print summary statistics
    print("\n" + "="*60)
    print("SUMMARY")
    print("="*60)
    print(f"Total participants: {len(df_participants)}")
    print(f"Participants with demographics: {len(df_demographics)}")
    print(f"Total Phase 1 trials: {len(df_phase1)}")
    print(f"Total Phase 2 trials: {len(df_phase2)}")
    print(f"Total Phase 3 trials: {len(df_phase3)}")
    print(f"Survey responses: {len(df_surveys)}")

# ============================================================================
# RUN
# ============================================================================

if __name__ == "__main__":
    export_all()
