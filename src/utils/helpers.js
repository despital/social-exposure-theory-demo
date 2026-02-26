/**
 * Helper functions for the experiment
 */

import { CONFIG } from './config.js';

/**
 * Generate face objects with IDs and colors.
 *
 * Creates TOTAL_FACES face objects for Phase 1. Each face gets a unique
 * numeric ID (0 through TOTAL_FACES-1) and is assigned to either the "red"
 * or "blue" group. The red/blue split depends on the experimental condition:
 *
 *   - Equal condition:           20 red, 20 blue
 *   - Majority-red condition:    32 red, 8 blue
 *   - Majority-blue condition:   8 red, 32 blue
 *
 * Counts come from CONFIG.FACE_COLOR_SPLIT. Which specific IDs become red vs.
 * blue is randomized per participant. Every face appears exactly
 * CONFIG.EXPOSURES_PER_FACE times in Phase 1 regardless of color.
 *
 * Each face object looks like:
 *   {
 *     id: 42,
 *     color: 'red',
 *     imagePath: 'stimuli/faces/face_042_red.png'
 *   }
 *
 * @param {object} jsPsych   - The jsPsych instance (provides randomization).
 * @param {object} urlParams - Parsed URL parameters from getURLParams().
 *   Must include `condition` ('equal' or 'majority-minority') and
 *   `majorityGroup` ('red' or 'blue').
 * @returns {Array<object>} Array of TOTAL_FACES face objects.
 */
export function generateFaces(jsPsych, urlParams) {
    // Resolve red/blue counts from condition
    let numRed, numBlue;
    if (urlParams.condition === 'equal') {
        numRed  = CONFIG.FACE_COLOR_SPLIT['equal'].red;
        numBlue = CONFIG.FACE_COLOR_SPLIT['equal'].blue;
    } else {
        const split = CONFIG.FACE_COLOR_SPLIT['majority-minority'];
        numRed  = urlParams.majorityGroup === 'red'  ? split.majority : split.minority;
        numBlue = urlParams.majorityGroup === 'blue' ? split.majority : split.minority;
    }

    // Shuffle all face IDs, then assign the first numRed to red, rest to blue
    const faceIds = Array.from({length: CONFIG.TOTAL_FACES}, (_, i) => i);
    const shuffledIds = jsPsych.randomization.shuffle(faceIds);
    const redIds  = shuffledIds.slice(0, numRed);
    const blueIds = shuffledIds.slice(numRed, numRed + numBlue);

    const faces = [];

    redIds.forEach(id => {
        faces.push({
            id: id,
            color: 'red',
            imagePath: `stimuli/faces/face_${String(id).padStart(3, '0')}_red.png`
        });
    });

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
 * Generate novel face objects for Phase 2.
 *
 * Works identically to generateFaces() but draws from the pool of 120 novel
 * face identities (face_n001 … face_n120). Each novel face is randomly
 * assigned to either red or blue (60 per group) and gets a good/bad label
 * using the same ratios as Phase 1. Good/bad status is tracked internally
 * but is NOT revealed to participants during Phase 2 — it is only used for
 * backend scoring shown at the very end of the experiment.
 *
 * @param {object} jsPsych - The jsPsych instance for randomization.
 * @returns {Array<object>} An array of 120 novel face objects, each with
 *   id (e.g. "n001"), color, imagePath, and isGood.
 */
export function generateNovelFaces(jsPsych) {
    const novelIds = Array.from({length: CONFIG.TOTAL_NOVEL_FACES}, (_, i) => i + 1);
    const shuffledIds = jsPsych.randomization.shuffle(novelIds);
    const half = CONFIG.TOTAL_NOVEL_FACES / 2;
    const redIds = shuffledIds.slice(0, half);
    const blueIds = shuffledIds.slice(half);

    const faces = [];

    redIds.forEach(id => {
        faces.push({
            id: `n${String(id).padStart(3, '0')}`,
            color: 'red',
            imagePath: `stimuli/faces/face_n${String(id).padStart(3, '0')}_red.png`
        });
    });

    blueIds.forEach(id => {
        faces.push({
            id: `n${String(id).padStart(3, '0')}`,
            color: 'blue',
            imagePath: `stimuli/faces/face_n${String(id).padStart(3, '0')}_blue.png`
        });
    });

    // Assign good/bad using the same ratio as Phase 1
    const redFaces = faces.filter(f => f.color === 'red');
    const blueFaces = faces.filter(f => f.color === 'blue');

    const shuffledRed = jsPsych.randomization.shuffle(redFaces);
    const numGoodRed = Math.round(half * CONFIG.GOOD_BAD_RATIO.red[0]);
    shuffledRed.forEach((face, idx) => { face.isGood = idx < numGoodRed; });

    const shuffledBlue = jsPsych.randomization.shuffle(blueFaces);
    const numGoodBlue = Math.round(half * CONFIG.GOOD_BAD_RATIO.blue[0]);
    shuffledBlue.forEach((face, idx) => { face.isGood = idx < numGoodBlue; });

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
    const numGoodRed = Math.round(redFaces.length * CONFIG.GOOD_BAD_RATIO.red[0]);
    shuffledRed.forEach((face, idx) => {
        face.isGood = idx < numGoodRed;
    });

    // Shuffle and assign for blue faces
    const shuffledBlue = jsPsych.randomization.shuffle(blueFaces);
    const numGoodBlue = Math.round(blueFaces.length * CONFIG.GOOD_BAD_RATIO.blue[0]);
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
 * Every face in the array appears exactly CONFIG.EXPOSURES_PER_FACE times
 * across the experiment. The color split (how many unique red vs. blue faces
 * the participant encounters) is already encoded in the `faces` array by
 * generateFaces() and requires no further logic here.
 *
 * Trials are built in EXPOSURES_PER_FACE blocks. In each block every face
 * appears exactly once: the full face array is shuffled, then chunked into
 * groups of FACES_PER_TRIAL. Because each face appears at most once per block,
 * no face can appear twice in the same trial panel.
 *
 * Total trials = TOTAL_FACES × EXPOSURES_PER_FACE / FACES_PER_TRIAL = 120.
 *
 * Each trial object looks like:
 *   {
 *     block: 1,          // block number (1-indexed, 1 … EXPOSURES_PER_FACE)
 *     trialInBlock: 5,   // position within the block (1-indexed)
 *     faces: [...]       // array of FACES_PER_TRIAL unique face objects
 *   }
 *
 * @param {Array<object>} faces  - Face objects from generateFaces().
 * @param {object}        jsPsych - The jsPsych instance (provides randomization).
 * @returns {Array<object>} Flat array of all trial objects in presentation order.
 */
export function generateTrials(faces, jsPsych) {
    const trials = [];

    for (let block = 0; block < CONFIG.EXPOSURES_PER_FACE; block++) {
        // Each block is one full shuffle of the face pool, chunked into panels of 4.
        // Shuffling independently per block randomizes which faces appear together
        // while guaranteeing every face appears exactly once per block.
        const shuffled = jsPsych.randomization.shuffle([...faces]);
        const trialsPerBlock = Math.floor(shuffled.length / CONFIG.FACES_PER_TRIAL);

        for (let t = 0; t < trialsPerBlock; t++) {
            trials.push({
                block: block + 1,
                trialInBlock: t + 1,
                faces: shuffled.slice(t * CONFIG.FACES_PER_TRIAL, (t + 1) * CONFIG.FACES_PER_TRIAL)
            });
        }
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

    // In pilot mode, force Phase 2 exposure to 'equal' regardless of condition code
    let p2Exposure = decoded.p2Exposure;
    if (CONFIG.PILOT_MODE && p2Exposure !== 'equal') {
        console.warn(
            `Pilot mode: Phase 2 exposure overridden from "${p2Exposure}" to "equal". ` +
            `Set PILOT_MODE to false in config.js to re-enable Phase 2 exposure manipulation.`
        );
        p2Exposure = 'equal';
    }

    return {
        conditionCode: conditionCode,
        condition: decoded.p1Exposure,
        majorityGroup: decoded.majorityGroup || 'red',
        p1Type: decoded.p1Type,
        p2Exposure: p2Exposure,
        participantId: prolificPID || jsPsych.data.getURLVariable('participant_id') || `P${Date.now()}`,
        studyId: studyID || null,
        sessionId: sessionID || null
    };
}

/**
 * Generate trials for Phase 2 (single-face approach-avoidance slider).
 *
 * Phase 2 presents novel faces (never seen in Phase 1) one at a time.
 * The participant rates each face on a continuous approach-avoidance slider
 * using jsPsych's html-slider-response plugin. No feedback is provided.
 *
 * The number of red vs. blue novel faces shown is determined by the Phase 2
 * exposure condition (urlParams.p2Exposure) and PHASE2_EXPOSURE_RATIOS in
 * config. During pilot mode this is always 'equal' (50/50).
 *
 * Novel faces also carry a hidden good/bad label (same ratio as Phase 1).
 * This status is NOT revealed during Phase 2 — it is only used for backend
 * scoring displayed at the very end of the experiment.
 *
 * Each trial object looks like:
 *   {
 *     face: { id: 'n042', color: 'red', imagePath: '...', isGood: true },
 *     phase: 2
 *   }
 *
 * @param {Array<object>} novelFaces - Novel face objects from generateNovelFaces().
 * @param {object} urlParams - Parsed URL parameters; p2Exposure determines
 *   the red:blue ratio of novel faces shown.
 * @param {object} jsPsych - The jsPsych instance, used for randomization.
 * @returns {Array<object>} A shuffled array of trial objects (one face per trial).
 */
export function generatePhase2Trials(novelFaces, urlParams, jsPsych) {
    const totalTrials = CONFIG.PHASE2_TOTAL_TRIALS;
    const ratios = CONFIG.PHASE2_EXPOSURE_RATIOS[urlParams.p2Exposure] || CONFIG.PHASE2_EXPOSURE_RATIOS['equal'];
    const redCount = Math.round(totalTrials * ratios.red);
    const blueCount = totalTrials - redCount;

    const redPool = novelFaces.filter(f => f.color === 'red');
    const bluePool = novelFaces.filter(f => f.color === 'blue');

    // Sample without replacement when pool is large enough, otherwise with replacement
    const selectedRed = redCount <= redPool.length
        ? jsPsych.randomization.sampleWithoutReplacement(redPool, redCount)
        : jsPsych.randomization.sampleWithReplacement(redPool, redCount);

    const selectedBlue = blueCount <= bluePool.length
        ? jsPsych.randomization.sampleWithoutReplacement(bluePool, blueCount)
        : jsPsych.randomization.sampleWithReplacement(bluePool, blueCount);

    const selectedFaces = jsPsych.randomization.shuffle([...selectedRed, ...selectedBlue]);

    return selectedFaces.map(face => ({
        face: face,
        phase: 2
    }));
}

/**
 * Generate trials for Phase 3 (post-task rating).
 *
 * Phase 3 is the final measurement phase. The participant is shown faces
 * they encountered during **Phase 1 only** (not Phase 2 novel faces),
 * one at a time, and asked to rate each one twice:
 *
 *   1. **Good/Bad rating** — "Do you think this person is good or bad?"
 *   2. **Confidence rating** — "How confident are you in that judgment?"
 *
 * How it works:
 *   - The function collects every unique face ID that appeared in Phase 1
 *     trials (using a Set to avoid duplicates).
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
 * @param {Array<object>} faces - All face objects from generateFaces(),
 *   used to look up full face data by ID.
 * @param {object} jsPsych - The jsPsych instance, used for randomization.
 * @returns {Array<object>} An array of trial objects — two per unique face
 *   (one 'goodbad' and one 'confidence'), with faces in shuffled order.
 */
export function generatePhase3Trials(phase1Trials, faces, jsPsych) {
    // Collect all unique face IDs from Phase 1 only
    const shownFaceIds = new Set();

    phase1Trials.forEach(trial => {
        trial.faces.forEach(face => {
            shownFaceIds.add(face.id);
        });
    });

    // Get face objects for all shown faces
    const shownFaces = faces.filter(face => shownFaceIds.has(face.id));

    // Shuffle the order of faces
    const shuffledFaces = jsPsych.randomization.shuffle(shownFaces);

    // Create one probability estimation trial per face
    const trials = [];
    shuffledFaces.forEach(face => {
        trials.push({
            face: face,
            phase: 3
        });
    });

    return trials;
}