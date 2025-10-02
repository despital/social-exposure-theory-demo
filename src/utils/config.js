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

    // Firebase configuration (from demo - READ ONLY, will not write data)
    FIREBASE_CONFIG: {
        apiKey: "AIzaSyDRiXU9n0kSDKaRoMcp02_W4sfd-xrjADQ",
        authDomain: "bwlabsummer2022bridgerating.firebaseapp.com",
        databaseURL: "https://bwlabsummer2022bridgerating-default-rtdb.firebaseio.com",
        projectId: "bwlabsummer2022bridgerating",
        storageBucket: "bwlabsummer2022bridgerating.appspot.com",
        messagingSenderId: "357648218957",
        appId: "1:357648218957:web:1d91c083af04f494dc5504",
        measurementId: "G-79YVWTZZEZ"
    },

    // Development mode - disable Firebase data saving
    DISABLE_DATA_SAVING: true,

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