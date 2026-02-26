/**
 * Configuration and hyperparameters for the Social Exposure Theory experiment
 */

export const CONFIG = {
    // Trial parameters
    // EXPOSURES_PER_FACE: exact number of times each face appears on screen.
    // Every face — regardless of color — appears this many times in Phase 1.
    // Valid values: any positive integer, subject to the constraint that
    //   TOTAL_FACES must be divisible by FACES_PER_TRIAL
    //   (currently 40 / 4 = 10, so any positive integer works).
    // Total Phase 1 trials = TOTAL_FACES × EXPOSURES_PER_FACE / FACES_PER_TRIAL
    //   e.g. 40 × 12 / 4 = 120 trials, 40 × 8 / 4 = 80 trials.
    EXPOSURES_PER_FACE: 12,
    FACES_PER_TRIAL: 4,

    // Stimuli — Phase 1 (base faces)
    TOTAL_FACES: 40,

    // Number of faces assigned to each color group, per Phase 1 exposure condition.
    // The majority-minority split controls how many UNIQUE members of each group
    // the participant encounters — every face still appears EXPOSURES_PER_FACE times.
    // 'majority' and 'minority' are resolved to red/blue at runtime via majorityGroup.
    // Note: at N=40, minority good-face ratio rounds to 75% (6/8) vs. target 70%.
    FACE_COLOR_SPLIT: {
        'equal':             { red: 20, blue: 20 },
        'majority-minority': { majority: 32, minority: 8 }
    },

    // Stimuli — Phase 2 (novel faces)
    // Named face_n001_red.png … face_n120_red.png (and _blue), stored in stimuli/faces/
    TOTAL_NOVEL_FACES: 120,

    // Good/Bad person ratios (modifiable per group)
    GOOD_BAD_RATIO: {
        red: [0.7, 0.3],   // [good_ratio, bad_ratio]
        blue: [0.7, 0.3]
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

    // Points-to-money conversion (shown at end of experiment)
    // 1 point = $0.01 → 100 points = $1.00 (subject to change)
    POINTS_TO_DOLLARS: 0.01,

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

    // Pilot mode — when true, Phase 2 exposure is forced to 'equal' regardless
    // of the 3rd character in the condition code. This effectively reduces the
    // design to 3 (P1 Exposure) x 2 (P1 Type) = 6 active conditions for the pilot.
    // Set to false to re-enable the full 18-condition design.
    PILOT_MODE: true,

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

    // Phase 2 parameters (single-face slider design)
    // Total novel faces shown per session; adjustable
    PHASE2_TOTAL_TRIALS: 60,
    // Red:blue split per Phase 2 Exposure level (must sum to 1.0)
    PHASE2_EXPOSURE_RATIOS: {
        'equal':         { red: 0.50, blue: 0.50 },
        'majority-red':  { red: 0.80, blue: 0.20 },
        'majority-blue': { red: 0.20, blue: 0.80 }
    },

    // Condition codebook: maps short URL codes to internal condition parameters.
    // URL parameter: ?c=<CODE>  (e.g., ?c=RXB)
    //
    // Code scheme (3 characters):
    //   1st char — Phase 1 Exposure:  E=Equal, R=Red-majority, B=Blue-majority
    //   2nd char — Phase 1 Type:      X=Experimental, C=Control
    //   3rd char — Phase 2 Exposure:  E=Equal, R=Red-majority, B=Blue-majority
    CONDITION_CODES: {
        // Equal exposure (Phase 1)
        'EXE': { p1Exposure: 'equal', p1Type: 'experimental', p2Exposure: 'equal',        majorityGroup: null,   label: 'Equal / Experimental / P2-Equal' },
        'EXR': { p1Exposure: 'equal', p1Type: 'experimental', p2Exposure: 'majority-red',  majorityGroup: null,   label: 'Equal / Experimental / P2-Red' },
        'EXB': { p1Exposure: 'equal', p1Type: 'experimental', p2Exposure: 'majority-blue', majorityGroup: null,   label: 'Equal / Experimental / P2-Blue' },
        'ECE': { p1Exposure: 'equal', p1Type: 'control',      p2Exposure: 'equal',        majorityGroup: null,   label: 'Equal / Control / P2-Equal' },
        'ECR': { p1Exposure: 'equal', p1Type: 'control',      p2Exposure: 'majority-red',  majorityGroup: null,   label: 'Equal / Control / P2-Red' },
        'ECB': { p1Exposure: 'equal', p1Type: 'control',      p2Exposure: 'majority-blue', majorityGroup: null,   label: 'Equal / Control / P2-Blue' },

        // Majority-Red exposure (Phase 1)
        'RXE': { p1Exposure: 'majority-minority', p1Type: 'experimental', p2Exposure: 'equal',        majorityGroup: 'red', label: 'Majority-Red / Experimental / P2-Equal' },
        'RXR': { p1Exposure: 'majority-minority', p1Type: 'experimental', p2Exposure: 'majority-red',  majorityGroup: 'red', label: 'Majority-Red / Experimental / P2-Red' },
        'RXB': { p1Exposure: 'majority-minority', p1Type: 'experimental', p2Exposure: 'majority-blue', majorityGroup: 'red', label: 'Majority-Red / Experimental / P2-Blue' },
        'RCE': { p1Exposure: 'majority-minority', p1Type: 'control',      p2Exposure: 'equal',        majorityGroup: 'red', label: 'Majority-Red / Control / P2-Equal' },
        'RCR': { p1Exposure: 'majority-minority', p1Type: 'control',      p2Exposure: 'majority-red',  majorityGroup: 'red', label: 'Majority-Red / Control / P2-Red' },
        'RCB': { p1Exposure: 'majority-minority', p1Type: 'control',      p2Exposure: 'majority-blue', majorityGroup: 'red', label: 'Majority-Red / Control / P2-Blue' },

        // Majority-Blue exposure (Phase 1)
        'BXE': { p1Exposure: 'majority-minority', p1Type: 'experimental', p2Exposure: 'equal',        majorityGroup: 'blue', label: 'Majority-Blue / Experimental / P2-Equal' },
        'BXR': { p1Exposure: 'majority-minority', p1Type: 'experimental', p2Exposure: 'majority-red',  majorityGroup: 'blue', label: 'Majority-Blue / Experimental / P2-Red' },
        'BXB': { p1Exposure: 'majority-minority', p1Type: 'experimental', p2Exposure: 'majority-blue', majorityGroup: 'blue', label: 'Majority-Blue / Experimental / P2-Blue' },
        'BCE': { p1Exposure: 'majority-minority', p1Type: 'control',      p2Exposure: 'equal',        majorityGroup: 'blue', label: 'Majority-Blue / Control / P2-Equal' },
        'BCR': { p1Exposure: 'majority-minority', p1Type: 'control',      p2Exposure: 'majority-red',  majorityGroup: 'blue', label: 'Majority-Blue / Control / P2-Red' },
        'BCB': { p1Exposure: 'majority-minority', p1Type: 'control',      p2Exposure: 'majority-blue', majorityGroup: 'blue', label: 'Majority-Blue / Control / P2-Blue' },
    },

    // Default condition code when ?c= is missing or invalid
    DEFAULT_CONDITION_CODE: 'EXE'
};