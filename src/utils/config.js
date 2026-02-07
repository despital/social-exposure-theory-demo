/**
 * Configuration and hyperparameters for the Social Exposure Theory experiment
 */

export const CONFIG = {
    // Trial parameters
    EXPOSURES_PER_FACE: 3,
    FACES_PER_TRIAL: 4,

    // Stimuli
    TOTAL_FACES: 100,
    RED_FACES: 50,
    BLUE_FACES: 50,

    // Good/Bad person ratios (modifiable per group)
    GOOD_BAD_RATIO: {
        red: [0.8, 0.2],   // [good_ratio, bad_ratio]
        blue: [0.8, 0.2]
    },

    // Reward/punishment probabilities
    GOOD_PERSON_PROBS: {
        reward: 0.9,     // +1 with 90% probability
        punishment: 0.1  // -5 with 10% probability
    },
    BAD_PERSON_PROBS: {
        reward: 0.5,     // +1 with 50% probability
        punishment: 0.5  // -5 with 50% probability
    },

    // Reward values
    REWARD_VALUE: 1,
    PUNISHMENT_VALUE: -5,

    // Firebase configuration - Social Exposure Theory 2026
    FIREBASE_CONFIG: {
        apiKey: "AIzaSyCAtUZBBpJKiF3pI3CHCTeKxk_ayyiGs3I",
        authDomain: "socialexposuretheory2026.firebaseapp.com",
        databaseURL: "https://socialexposuretheory2026-default-rtdb.firebaseio.com",
        projectId: "socialexposuretheory2026",
        storageBucket: "socialexposuretheory2026.firebasestorage.app",
        messagingSenderId: "864406557205",
        appId: "1:864406557205:web:5b35e2ee0504357baab41c"
    },

    // Development mode - disable Firebase data saving
    // Set to false when ready for production data collection
    DISABLE_DATA_SAVING: false,

    // Debug mode settings (activated via ?debug=true URL parameter)
    DEBUG_MODE: {
        SKIP_CONSENT: true,           // Skip consent form
        SKIP_DEMOGRAPHICS: true,      // Skip demographics survey
        REDUCE_PHASE3_TRIALS: true,   // Rate only 5 faces instead of all (10 trials total)
        REDUCE_PHASE1_TRIALS: true,   // Use 1 exposure instead of 3
        REDUCE_PHASE2_TRIALS: true,   // Use 1 trial per composition instead of 5
        ENABLE_AUTOCLICK: false       // Auto-click through trials (also available via ?debug=true&autoclick=true)
    },

    // Section jumping for debug mode
    // Use ?debug=true&section=X to jump directly to a specific section
    // Available sections: 'all', 'consent', 'demographics', 'phase1', 'phase2', 'phase3', 'endsurvey', 'end'
    DEBUG_SECTIONS: {
        all: ['consent', 'demographics', 'phase1', 'phase2', 'phase3', 'endsurvey'],
        consent: ['consent'],
        demographics: ['demographics'],
        phase1: ['phase1'],
        phase2: ['phase2'],
        phase3: ['phase3'],
        endsurvey: ['endsurvey'],
        end: []  // Skip directly to end
    },

    // Phase 2 parameters
    PHASE2_TRIALS_PER_COMPOSITION: 5,
    PHASE2_COMPOSITIONS: [
        { red: 4, blue: 0 },
        { red: 3, blue: 1 },
        { red: 2, blue: 2 },
        { red: 1, blue: 3 },
        { red: 0, blue: 4 }
    ]
};