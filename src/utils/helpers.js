/**
 * Helper functions for the experiment
 */

import { CONFIG } from './config.js';

/**
 * Generate face objects with IDs and colors.
 *
 * This function creates 100 face objects used as stimuli in the experiment.
 * Each face gets a unique numeric ID (0 through 99) and is randomly assigned
 * to either the "red" group or the "blue" group — 50 faces per group.
 *
 * The assignment is randomized so that every participant sees a different
 * red/blue split, preventing any single face from always being in the same group.
 *
 * Each face object in the returned array looks like:
 *   {
 *     id: 42,                                       // unique number identifying this face
 *     color: 'red',                                  // which group the face belongs to
 *     imagePath: 'stimuli/faces/face_042_red.png'    // file path to the face image
 *   }
 *
 * @param {object} jsPsych - The jsPsych instance, which provides the
 *   randomization.shuffle() method used to randomly divide faces into groups.
 * @returns {Array<object>} An array of 100 face objects, each with an id,
 *   color ('red' or 'blue'), and imagePath.
 */
export function generateFaces(jsPsych) {
    const faces = [];

    // Create array of 100 unique face IDs (0-99)
    const faceIds = Array.from({length: CONFIG.TOTAL_FACES}, (_, i) => i);

    // Shuffle and split into two groups (50 red, 50 blue)
    const shuffledIds = jsPsych.randomization.shuffle(faceIds);
    const redIds = shuffledIds.slice(0, CONFIG.TOTAL_FACES / 2);
    const blueIds = shuffledIds.slice(CONFIG.TOTAL_FACES / 2);

    // Create red faces
    redIds.forEach(id => {
        faces.push({
            id: id,
            color: 'red',
            imagePath: `stimuli/faces/face_${String(id).padStart(3, '0')}_red.png`
        });
    });

    // Create blue faces
    blueIds.forEach(id => {
        faces.push({
            id: id,
            color: 'blue',
            imagePath: `stimuli/faces/face_${String(id).padStart(3, '0')}_blue.png`
        });
    });

    return faces;
}

/**
 * Assign good/bad status to faces (stratified by color).
 *
 * In this experiment, each face is secretly labeled as either a "good" person
 * or a "bad" person. This label is never shown to the participant — it only
 * controls whether interacting with that face tends to give a reward or a
 * punishment (see getOutcome()).
 *
 * The assignment is done separately for red and blue groups so that both
 * groups have the same proportion of good vs. bad faces. By default
 * (CONFIG.GOOD_BAD_RATIO), 80% of faces in each group are "good" and 20%
 * are "bad". This ensures that any difference the participant perceives
 * between groups is due to exposure frequency, not actual differences in
 * reward rates.
 *
 * This function modifies each face object in place by adding an `isGood`
 * property (true = good person, false = bad person) and also returns the
 * updated array.
 *
 * @param {Array<object>} faces - The array of face objects created by
 *   generateFaces(). Each object must have a `color` property ('red' or 'blue').
 * @param {object} jsPsych - The jsPsych instance, used for randomization.
 * @returns {Array<object>} The same array of face objects, now with an
 *   `isGood` boolean added to each one.
 */
export function assignGoodBad(faces, jsPsych) {
    const redFaces = faces.filter(f => f.color === 'red');
    const blueFaces = faces.filter(f => f.color === 'blue');

    // Shuffle and assign for red faces
    const shuffledRed = jsPsych.randomization.shuffle(redFaces);
    const numGoodRed = Math.round(CONFIG.RED_FACES * CONFIG.GOOD_BAD_RATIO.red[0]);
    shuffledRed.forEach((face, idx) => {
        face.isGood = idx < numGoodRed;
    });

    // Shuffle and assign for blue faces
    const shuffledBlue = jsPsych.randomization.shuffle(blueFaces);
    const numGoodBlue = Math.round(CONFIG.BLUE_FACES * CONFIG.GOOD_BAD_RATIO.blue[0]);
    shuffledBlue.forEach((face, idx) => {
        face.isGood = idx < numGoodBlue;
    });

    return faces;
}

/**
 * Generate the trial list for Phase 1 (the exposure/learning phase).
 *
 * Phase 1 is the core learning task where participants repeatedly see faces
 * and choose one to interact with. This function builds every trial the
 * participant will see during that phase.
 *
 * How it works, step by step:
 *
 * 1. **Determine exposure ratios** — Based on the experimental condition
 *    (passed in via URL parameters), the function decides what percentage of
 *    faces shown in each block should be red vs. blue:
 *      - "equal" condition:   50% red, 50% blue
 *      - "majority-minority": 80% for the majority group, 20% for the minority
 *
 * 2. **Create blocks** — The experiment has multiple blocks (default: 3,
 *    set by CONFIG.EXPOSURES_PER_FACE). Each block contains 100 face
 *    presentations. Within each block:
 *      - The appropriate number of red and blue faces are selected at random.
 *      - If a condition requires more faces of one color than are available
 *        (e.g., 80 red faces but only 50 exist), faces are sampled WITH
 *        replacement (meaning some faces repeat within the block).
 *      - All selected faces are shuffled into a random order.
 *
 * 3. **Build individual trials** — For each selected face in a block, one
 *    trial is created. Each trial shows that face (the "target") alongside
 *    3 other randomly chosen faces, for a total of 4 faces on screen
 *    (CONFIG.FACES_PER_TRIAL). The 4 faces are shuffled so the target
 *    doesn't always appear in the same position.
 *
 * Each trial object in the returned array looks like:
 *   {
 *     block: 1,          // which block this trial belongs to (1-indexed)
 *     trialInBlock: 5,   // position within the block (1-indexed)
 *     faces: [...]       // array of 4 face objects shown on this trial
 *   }
 *
 * @param {Array<object>} faces - All 100 face objects from generateFaces().
 * @param {object} urlParams - The parsed URL parameters from getURLParams().
 *   Must include `condition` ('equal' or 'majority-minority') and
 *   `majorityGroup` ('red' or 'blue').
 * @param {object} jsPsych - The jsPsych instance, used for randomization.
 * @returns {Array<object>} A flat array of all trial objects across all blocks,
 *   in presentation order.
 */
export function generateTrials(faces, urlParams, jsPsych) {
    const trials = [];

    // Determine exposure ratio based on condition
    let redExposureRatio, blueExposureRatio;
    if (urlParams.condition === 'equal') {
        redExposureRatio = 0.5;
        blueExposureRatio = 0.5;
    } else { // majority-minority
        if (urlParams.majorityGroup === 'red') {
            redExposureRatio = 0.8;
            blueExposureRatio = 0.2;
        } else {
            redExposureRatio = 0.2;
            blueExposureRatio = 0.8;
        }
    }

    // Create blocks
    for (let block = 0; block < CONFIG.EXPOSURES_PER_FACE; block++) {
        const totalFacesPerBlock = faces.length;
        const redCount = Math.round(totalFacesPerBlock * redExposureRatio);
        const blueCount = totalFacesPerBlock - redCount;

        const redFaces = faces.filter(f => f.color === 'red');
        const blueFaces = faces.filter(f => f.color === 'blue');

        // Use sampleWithReplacement if we need more faces than available
        // This allows faces to repeat within a block in majority/minority conditions
        const selectedRed = redCount <= redFaces.length
            ? jsPsych.randomization.sampleWithoutReplacement(redFaces, redCount)
            : jsPsych.randomization.sampleWithReplacement(redFaces, redCount);

        const selectedBlue = blueCount <= blueFaces.length
            ? jsPsych.randomization.sampleWithoutReplacement(blueFaces, blueCount)
            : jsPsych.randomization.sampleWithReplacement(blueFaces, blueCount);

        const blockFaces = [...selectedRed, ...selectedBlue];
        const shuffledBlockFaces = jsPsych.randomization.shuffle(blockFaces);

        // Create trials for this block
        shuffledBlockFaces.forEach((targetFace, idx) => {
            const otherFaces = jsPsych.randomization.sampleWithoutReplacement(
                faces.filter(f => f.id !== targetFace.id),
                CONFIG.FACES_PER_TRIAL - 1
            );

            const trialFaces = jsPsych.randomization.shuffle([targetFace, ...otherFaces]);

            trials.push({
                block: block + 1,
                trialInBlock: idx + 1,
                faces: trialFaces
            });
        });
    }

    return trials;
}

/**
 * Calculate the reward or punishment outcome when a participant interacts
 * with a face.
 *
 * After a participant selects a face in Phase 1, this function is called to
 * determine what happens. The result depends on whether the face is secretly
 * a "good" or "bad" person (set earlier by assignGoodBad()):
 *
 *   - Good person: 90% chance of +1 reward, 10% chance of -5 punishment
 *   - Bad person:  50% chance of +1 reward, 50% chance of -5 punishment
 *
 * These probabilities are configured in CONFIG.GOOD_PERSON_PROBS and
 * CONFIG.BAD_PERSON_PROBS. The actual reward/punishment values come from
 * CONFIG.REWARD_VALUE (+1) and CONFIG.PUNISHMENT_VALUE (-5).
 *
 * The participant never sees the good/bad label — they only see the outcome
 * (+1 or -5) and must learn over time which faces tend to give better results.
 *
 * @param {object} face - A face object that must have an `isGood` boolean
 *   property (set by assignGoodBad()).
 * @returns {number} Either +1 (reward) or -5 (punishment), determined
 *   randomly based on the face's good/bad probabilities.
 */
export function getOutcome(face) {
    const probs = face.isGood ? CONFIG.GOOD_PERSON_PROBS : CONFIG.BAD_PERSON_PROBS;
    const rand = Math.random();

    if (rand < probs.reward) {
        return CONFIG.REWARD_VALUE;
    } else {
        return CONFIG.PUNISHMENT_VALUE;
    }
}

/**
 * Read experiment settings from the URL query string.
 *
 * Condition assignment uses a single encoded URL parameter `c` that maps
 * to an entry in CONFIG.CONDITION_CODES. For example, `?c=RXB` decodes to:
 *   - Phase 1 exposure: majority-minority (red majority)
 *   - Phase 1 type: experimental
 *   - Phase 2 exposure: majority-blue
 *
 * The 3-character code scheme:
 *   1st char — Phase 1 Exposure:  E=Equal, R=Red-majority, B=Blue-majority
 *   2nd char — Phase 1 Type:      X=Experimental, C=Control
 *   3rd char — Phase 2 Exposure:  E=Equal, R=Red-majority, B=Blue-majority
 *
 * If the `c` parameter is missing or invalid, the function falls back to
 * CONFIG.DEFAULT_CONDITION_CODE ('EXE') and logs a warning. For backward
 * compatibility during development, legacy `condition` and `majority_group`
 * parameters are also checked.
 *
 * Returned object properties:
 *   - conditionCode (string): The raw 3-character code from the URL (e.g., 'RXB').
 *   - condition (string): Phase 1 exposure — 'equal' or 'majority-minority'.
 *   - majorityGroup (string): 'red' or 'blue'. Only meaningful when
 *     condition is 'majority-minority'. Defaults to 'red' for equal.
 *   - p1Type (string): Phase 1 type — 'experimental' or 'control'.
 *   - p2Exposure (string): Phase 2 exposure — 'equal', 'majority-red',
 *     or 'majority-blue'.
 *   - participantId (string): Prolific PID, custom ID, or auto-generated.
 *   - studyId (string|null): Prolific study ID.
 *   - sessionId (string|null): Prolific session ID.
 *
 * @param {object} jsPsych - The jsPsych instance, which provides
 *   data.getURLVariable() for reading query parameters.
 * @returns {object} An object containing all the parsed parameters listed above.
 */
export function getURLParams(jsPsych) {
    const prolificPID = jsPsych.data.getURLVariable('PROLIFIC_PID');
    const studyID = jsPsych.data.getURLVariable('STUDY_ID');
    const sessionID = jsPsych.data.getURLVariable('SESSION_ID');

    // Decode condition from ?c= parameter
    let conditionCode = jsPsych.data.getURLVariable('c');
    let decoded;

    if (conditionCode && CONFIG.CONDITION_CODES[conditionCode]) {
        decoded = CONFIG.CONDITION_CODES[conditionCode];
    } else if (conditionCode) {
        console.warn(
            `Unknown condition code "${conditionCode}". ` +
            `Valid codes: ${Object.keys(CONFIG.CONDITION_CODES).join(', ')}. ` +
            `Falling back to "${CONFIG.DEFAULT_CONDITION_CODE}".`
        );
        conditionCode = CONFIG.DEFAULT_CONDITION_CODE;
        decoded = CONFIG.CONDITION_CODES[conditionCode];
    } else {
        // Check for legacy parameters (backward compat during development)
        const legacyCondition = jsPsych.data.getURLVariable('condition');
        if (legacyCondition) {
            console.warn(
                'Legacy URL parameters detected (condition=, majority_group=). ' +
                'Please switch to the new ?c= format. ' +
                'See CONDITION_CODES in config.js for valid codes.'
            );
            const legacyMajority = jsPsych.data.getURLVariable('majority_group') || 'red';
            decoded = {
                p1Exposure: legacyCondition,
                p1Type: 'experimental',
                p2Exposure: 'equal',
                majorityGroup: legacyMajority
            };
            conditionCode = 'LEGACY';
        } else {
            conditionCode = CONFIG.DEFAULT_CONDITION_CODE;
            decoded = CONFIG.CONDITION_CODES[conditionCode];
        }
    }

    return {
        conditionCode: conditionCode,
        condition: decoded.p1Exposure,
        majorityGroup: decoded.majorityGroup || 'red',
        p1Type: decoded.p1Type,
        p2Exposure: decoded.p2Exposure,
        participantId: prolificPID || jsPsych.data.getURLVariable('participant_id') || `P${Date.now()}`,
        studyId: studyID || null,
        sessionId: sessionID || null
    };
}

/**
 * Generate trials for Phase 2 (the partner choice task).
 *
 * Phase 2 tests whether the participant's exposure to red vs. blue faces
 * in Phase 1 influenced their preferences. On each trial, the participant
 * sees 4 faces and chooses one as a "partner" — but this time there are no
 * rewards or punishments. The key variable is the color composition of the
 * 4 faces shown.
 *
 * The experiment uses 5 different compositions (set in CONFIG.PHASE2_COMPOSITIONS):
 *   - 4 red, 0 blue
 *   - 3 red, 1 blue
 *   - 2 red, 2 blue
 *   - 1 red, 3 blue
 *   - 0 red, 4 blue
 *
 * For each composition, multiple trials are created (default: 5 per
 * composition, set by CONFIG.PHASE2_TRIALS_PER_COMPOSITION), giving a total
 * of 25 trials. Faces are randomly sampled for each trial without
 * replacement (no duplicate faces within a single trial).
 *
 * All 25 trials are shuffled into a random order before being returned so
 * the participant doesn't see all trials of the same composition back-to-back.
 *
 * Each trial object looks like:
 *   {
 *     faces: [...],                   // array of 4 face objects
 *     composition: { red: 3, blue: 1 }, // the red:blue ratio for this trial
 *     phase: 2                        // identifies this as a Phase 2 trial
 *   }
 *
 * @param {Array<object>} faces - All 100 face objects from generateFaces().
 * @param {object} jsPsych - The jsPsych instance, used for randomization.
 * @returns {Array<object>} A shuffled array of 25 trial objects.
 */
export function generatePhase2Trials(faces, jsPsych) {
    const trials = [];

    // For each composition (4:0, 3:1, 2:2, 1:3, 0:4)
    CONFIG.PHASE2_COMPOSITIONS.forEach(composition => {
        // Create PHASE2_TRIALS_PER_COMPOSITION trials for this composition
        for (let i = 0; i < CONFIG.PHASE2_TRIALS_PER_COMPOSITION; i++) {
            const redFaces = faces.filter(f => f.color === 'red');
            const blueFaces = faces.filter(f => f.color === 'blue');

            // Sample faces without replacement
            const selectedRed = jsPsych.randomization.sampleWithoutReplacement(redFaces, composition.red);
            const selectedBlue = jsPsych.randomization.sampleWithoutReplacement(blueFaces, composition.blue);

            const trialFaces = jsPsych.randomization.shuffle([...selectedRed, ...selectedBlue]);

            trials.push({
                faces: trialFaces,
                composition: composition,
                phase: 2
            });
        }
    });

    // Shuffle all trials
    return jsPsych.randomization.shuffle(trials);
}

/**
 * Generate trials for Phase 3 (post-task rating).
 *
 * Phase 3 is the final measurement phase. The participant is shown every
 * face they encountered during Phase 1 and Phase 2, one at a time, and
 * asked to rate each one twice:
 *
 *   1. **Good/Bad rating** — "Do you think this person is good or bad?"
 *   2. **Confidence rating** — "How confident are you in that judgment?"
 *
 * How it works:
 *   - The function collects every unique face ID that appeared in any
 *     Phase 1 or Phase 2 trial (using a Set to avoid duplicates).
 *   - It looks up the full face objects for those IDs.
 *   - The faces are shuffled into a random order.
 *   - For each face, two back-to-back trial objects are created: first the
 *     good/bad rating, then the confidence rating.
 *
 * Each trial object looks like:
 *   {
 *     face: { id: 42, color: 'red', ... },  // the face being rated
 *     trialType: 'goodbad',                  // or 'confidence'
 *     phase: 3                               // identifies this as Phase 3
 *   }
 *
 * @param {Array<object>} phase1Trials - The array of Phase 1 trial objects
 *   returned by generateTrials(). Each must have a `faces` array.
 * @param {Array<object>} phase2Trials - The array of Phase 2 trial objects
 *   returned by generatePhase2Trials(). Each must have a `faces` array.
 * @param {Array<object>} faces - All 100 face objects from generateFaces(),
 *   used to look up full face data by ID.
 * @param {object} jsPsych - The jsPsych instance, used for randomization.
 * @returns {Array<object>} An array of trial objects — two per unique face
 *   (one 'goodbad' and one 'confidence'), with faces in shuffled order.
 */
export function generatePhase3Trials(phase1Trials, phase2Trials, faces, jsPsych) {
    // Collect all unique face IDs from Phase 1 and Phase 2
    const shownFaceIds = new Set();

    // Add faces from Phase 1
    phase1Trials.forEach(trial => {
        trial.faces.forEach(face => {
            shownFaceIds.add(face.id);
        });
    });

    // Add faces from Phase 2
    phase2Trials.forEach(trial => {
        trial.faces.forEach(face => {
            shownFaceIds.add(face.id);
        });
    });

    // Get face objects for all shown faces
    const shownFaces = faces.filter(face => shownFaceIds.has(face.id));

    // Shuffle the order of faces
    const shuffledFaces = jsPsych.randomization.shuffle(shownFaces);

    // Create trials: for each face, create good/bad trial and confidence trial
    const trials = [];
    shuffledFaces.forEach(face => {
        // Trial 1: Good/Bad rating
        trials.push({
            face: face,
            trialType: 'goodbad',
            phase: 3
        });

        // Trial 2: Confidence rating
        trials.push({
            face: face,
            trialType: 'confidence',
            phase: 3
        });
    });

    return trials;
}