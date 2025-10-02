/**
 * Helper functions for the experiment
 */

import { CONFIG } from './config.js';

/**
 * Generate face objects with IDs and colors
 */
export function generateFaces() {
    const faces = [];

    // Generate red faces (IDs: 0-49)
    for (let i = 0; i < CONFIG.RED_FACES; i++) {
        faces.push({
            id: i,
            color: 'red',
            imagePath: `stimuli/faces/face_${String(i).padStart(3, '0')}_red.png`
        });
    }

    // Generate blue faces (IDs: 50-99)
    for (let i = 0; i < CONFIG.BLUE_FACES; i++) {
        faces.push({
            id: CONFIG.RED_FACES + i,
            color: 'blue',
            imagePath: `stimuli/faces/face_${String(i).padStart(3, '0')}_blue.png`
        });
    }

    return faces;
}

/**
 * Assign good/bad status to faces (stratified by color)
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
 * Generate trials using block design
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
        const totalFacesPerBlock = 100;
        const redCount = Math.round(totalFacesPerBlock * redExposureRatio);
        const blueCount = totalFacesPerBlock - redCount;

        const redFaces = faces.filter(f => f.color === 'red');
        const blueFaces = faces.filter(f => f.color === 'blue');

        const selectedRed = jsPsych.randomization.sampleWithoutReplacement(redFaces, redCount);
        const selectedBlue = jsPsych.randomization.sampleWithoutReplacement(blueFaces, blueCount);

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
 * Calculate outcome based on face type
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
 * Get URL parameters for condition assignment
 */
export function getURLParams(jsPsych) {
    const prolificPID = jsPsych.data.getURLVariable('PROLIFIC_PID');
    const studyID = jsPsych.data.getURLVariable('STUDY_ID');
    const sessionID = jsPsych.data.getURLVariable('SESSION_ID');

    return {
        condition: jsPsych.data.getURLVariable('condition') || 'equal',
        majorityGroup: jsPsych.data.getURLVariable('majority_group') || 'red',
        informed: jsPsych.data.getURLVariable('informed') === 'true',
        participantId: prolificPID || jsPsych.data.getURLVariable('participant_id') || `P${Date.now()}`,
        studyId: studyID,
        sessionId: sessionID
    };
}

/**
 * Generate Phase 2 trials (partner choice task)
 * Each trial shows 4 novel faces with varying red:blue ratios
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