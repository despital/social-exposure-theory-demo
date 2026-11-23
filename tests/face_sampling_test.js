/**
 * Face Sampling Logic Test
 *
 * Runs generateFaces + assignGoodBad + generateTrials 2× per condition,
 * validates key properties (including ≤1 bad face per Phase 1 trial),
 * and writes results to CSV.
 *
 * Self-contained: mirrors config + helpers logic inline so it can run as
 * plain Node.js CommonJS without touching the webpack build setup.
 *
 * Usage:   node tests/face_sampling_test.js
 * Output:  tests/output/face_assignment.csv
 *          tests/output/trial_appearances.csv
 */

'use strict';

const fs   = require('fs');
const path = require('path');

// ─── Config (mirrors src/utils/config.js — Configuration A) ───────────────────

const CONFIG = {
    EXPOSURES_PER_FACE: 12,
    FACES_PER_TRIAL:     4,
    TOTAL_FACES:        20,
    FACE_COLOR_SPLIT: {
        'equal':             { red: 10, blue: 10 },
        'majority-minority': { majority: 15, minority: 5 }
    },
    GOOD_BAD_RATIO: {
        red:  [0.8, 0.2],
        blue: [0.8, 0.2]
    }
};

// ─── jsPsych mock ─────────────────────────────────────────────────────────────

function createMockJsPsych() {
    return {
        randomization: {
            shuffle(arr) {
                const a = [...arr];
                for (let i = a.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1));
                    [a[i], a[j]] = [a[j], a[i]];
                }
                return a;
            }
        }
    };
}

// ─── Core functions (mirrors src/utils/helpers.js) ────────────────────────────

function generateFaces(jsPsych, urlParams) {
    let numRed, numBlue;
    if (urlParams.condition === 'equal') {
        numRed  = CONFIG.FACE_COLOR_SPLIT['equal'].red;
        numBlue = CONFIG.FACE_COLOR_SPLIT['equal'].blue;
    } else {
        const split = CONFIG.FACE_COLOR_SPLIT['majority-minority'];
        numRed  = urlParams.majorityGroup === 'red'  ? split.majority : split.minority;
        numBlue = urlParams.majorityGroup === 'blue' ? split.majority : split.minority;
    }

    const faceIds  = Array.from({ length: CONFIG.TOTAL_FACES }, (_, i) => i);
    const shuffled = jsPsych.randomization.shuffle(faceIds);
    const redIds   = shuffled.slice(0, numRed);
    const blueIds  = shuffled.slice(numRed, numRed + numBlue);

    const faces = [];
    redIds.forEach(id  => faces.push({ id, color: 'red'  }));
    blueIds.forEach(id => faces.push({ id, color: 'blue' }));
    return faces;
}

function assignGoodBad(faces, jsPsych) {
    const redFaces  = faces.filter(f => f.color === 'red');
    const blueFaces = faces.filter(f => f.color === 'blue');

    const shuffledRed = jsPsych.randomization.shuffle(redFaces);
    const numGoodRed  = Math.round(redFaces.length * CONFIG.GOOD_BAD_RATIO.red[0]);
    shuffledRed.forEach((face, idx) => { face.isGood = idx < numGoodRed; });

    const shuffledBlue = jsPsych.randomization.shuffle(blueFaces);
    const numGoodBlue  = Math.round(blueFaces.length * CONFIG.GOOD_BAD_RATIO.blue[0]);
    shuffledBlue.forEach((face, idx) => { face.isGood = idx < numGoodBlue; });

    return faces;
}

function generateTrials(faces, jsPsych) {
    const k = CONFIG.FACES_PER_TRIAL;
    const trials = [];

    for (let block = 0; block < CONFIG.EXPOSURES_PER_FACE; block++) {
        const bad = jsPsych.randomization.shuffle(
            faces.filter(f => f.isGood === false)
        );
        const good = jsPsych.randomization.shuffle(
            faces.filter(f => f.isGood === true)
        );

        if (bad.length + good.length !== faces.length) {
            throw new Error('generateTrials: every face must have isGood set');
        }

        const goodsPerBadPanel = k - 1;
        const goodsNeededForBad = bad.length * goodsPerBadPanel;
        if (goodsNeededForBad > good.length) {
            throw new Error('generateTrials: cannot enforce ≤1 bad per trial');
        }
        if ((good.length - goodsNeededForBad) % k !== 0) {
            throw new Error('generateTrials: remaining goods not divisible by panel size');
        }

        const panels = [];
        let goodIdx = 0;

        for (const badFace of bad) {
            const panel = [badFace, ...good.slice(goodIdx, goodIdx + goodsPerBadPanel)];
            goodIdx += goodsPerBadPanel;
            panels.push(jsPsych.randomization.shuffle(panel));
        }

        while (goodIdx < good.length) {
            panels.push(jsPsych.randomization.shuffle(good.slice(goodIdx, goodIdx + k)));
            goodIdx += k;
        }

        const orderedPanels = jsPsych.randomization.shuffle(panels);
        orderedPanels.forEach((panel, idx) => {
            trials.push({
                block:        block + 1,
                trialInBlock: idx + 1,
                faces:        panel
            });
        });
    }

    return trials;
}

// ─── Validation ───────────────────────────────────────────────────────────────

function validateFaces(faces, urlParams) {
    const redFaces  = faces.filter(f => f.color === 'red');
    const blueFaces = faces.filter(f => f.color === 'blue');
    const uniqueIds = new Set(faces.map(f => f.id));
    const badFaces  = faces.filter(f => f.isGood === false);
    const goodFaces = faces.filter(f => f.isGood === true);

    let expectedRed, expectedBlue;
    if (urlParams.condition === 'equal') {
        expectedRed  = CONFIG.FACE_COLOR_SPLIT['equal'].red;
        expectedBlue = CONFIG.FACE_COLOR_SPLIT['equal'].blue;
    } else {
        const split  = CONFIG.FACE_COLOR_SPLIT['majority-minority'];
        expectedRed  = urlParams.majorityGroup === 'red'  ? split.majority : split.minority;
        expectedBlue = urlParams.majorityGroup === 'blue' ? split.majority : split.minority;
    }

    const expectedGood = Math.round(expectedRed * CONFIG.GOOD_BAD_RATIO.red[0])
                       + Math.round(expectedBlue * CONFIG.GOOD_BAD_RATIO.blue[0]);
    const expectedBad  = CONFIG.TOTAL_FACES - expectedGood;

    const checks = [
        { name: 'total face count',   pass: faces.length === CONFIG.TOTAL_FACES,
          detail: `${faces.length} (expected ${CONFIG.TOTAL_FACES})` },
        { name: 'red count',          pass: redFaces.length === expectedRed,
          detail: `${redFaces.length} (expected ${expectedRed})` },
        { name: 'blue count',         pass: blueFaces.length === expectedBlue,
          detail: `${blueFaces.length} (expected ${expectedBlue})` },
        { name: 'all IDs unique',     pass: uniqueIds.size === CONFIG.TOTAL_FACES,
          detail: `${uniqueIds.size} unique IDs` },
        { name: 'good/bad counts',    pass: goodFaces.length === expectedGood && badFaces.length === expectedBad,
          detail: `${goodFaces.length} good / ${badFaces.length} bad (expected ${expectedGood}/${expectedBad})` },
    ];

    checks.forEach(c => console.log(`    ${c.pass ? '✓' : '✗'} ${c.name}: ${c.detail}`));
    return checks.every(c => c.pass);
}

function validateTrials(trials, faces) {
    const expectedTotal = CONFIG.TOTAL_FACES * CONFIG.EXPOSURES_PER_FACE / CONFIG.FACES_PER_TRIAL;

    const appearances = new Map(faces.map(f => [f.id, 0]));
    let withinTrialDuplicates = 0;
    let multiBadTrials = 0;

    for (const trial of trials) {
        const ids = trial.faces.map(f => f.id);
        if (new Set(ids).size !== CONFIG.FACES_PER_TRIAL) withinTrialDuplicates++;
        ids.forEach(id => appearances.set(id, appearances.get(id) + 1));

        const nBad = trial.faces.filter(f => f.isGood === false).length;
        if (nBad > 1) multiBadTrials++;
    }

    // Per-block: each face appears exactly once
    let blockCoverageFailures = 0;
    for (let b = 1; b <= CONFIG.EXPOSURES_PER_FACE; b++) {
        const blockTrials = trials.filter(t => t.block === b);
        const idsInBlock = blockTrials.flatMap(t => t.faces.map(f => f.id));
        if (new Set(idsInBlock).size !== faces.length || idsInBlock.length !== faces.length) {
            blockCoverageFailures++;
        }
    }

    const wrongCounts = [...appearances.entries()].filter(([, c]) => c !== CONFIG.EXPOSURES_PER_FACE);
    const blocks      = new Set(trials.map(t => t.block));

    const checks = [
        { name: 'total trial count',             pass: trials.length === expectedTotal,
          detail: `${trials.length} (expected ${expectedTotal})` },
        { name: 'each face appears exactly 12×', pass: wrongCounts.length === 0,
          detail: wrongCounts.length === 0 ? 'all good' : `${wrongCounts.length} face(s) with wrong count` },
        { name: 'no within-trial duplicates',    pass: withinTrialDuplicates === 0,
          detail: `${withinTrialDuplicates} violation(s)` },
        { name: 'exactly 12 blocks',             pass: blocks.size === CONFIG.EXPOSURES_PER_FACE,
          detail: `${blocks.size} block(s) found` },
        { name: 'each face once per block',      pass: blockCoverageFailures === 0,
          detail: `${blockCoverageFailures} block(s) with coverage failure` },
        { name: '≤1 bad face per trial',         pass: multiBadTrials === 0,
          detail: `${multiBadTrials} trial(s) with 2+ bad faces` },
    ];

    checks.forEach(c => console.log(`    ${c.pass ? '✓' : '✗'} ${c.name}: ${c.detail}`));
    return checks.every(c => c.pass);
}

// ─── CSV helpers ──────────────────────────────────────────────────────────────

function toCSV(headers, rows) {
    const escape = v => (String(v).includes(',') ? `"${v}"` : String(v));
    return [
        headers.join(','),
        ...rows.map(r => headers.map(h => escape(r[h] ?? '')).join(','))
    ].join('\n');
}

// ─── Main ─────────────────────────────────────────────────────────────────────

function main() {
    const RUNS_PER_CONDITION = 2;

    const conditions = [
        { condition: 'equal',             majorityGroup: 'red',  label: 'equal'         },
        { condition: 'majority-minority', majorityGroup: 'red',  label: 'majority-red'  },
        { condition: 'majority-minority', majorityGroup: 'blue', label: 'majority-blue' },
    ];

    const faceRows       = [];
    const appearanceRows = [];
    let   allPassed      = true;

    for (const urlParams of conditions) {
        for (let run = 1; run <= RUNS_PER_CONDITION; run++) {
            console.log(`\n── run ${run} | ${urlParams.label} ──`);
            const jsPsych = createMockJsPsych();

            console.log('  generateFaces + assignGoodBad:');
            let faces = generateFaces(jsPsych, urlParams);
            faces = assignGoodBad(faces, jsPsych);
            allPassed = validateFaces(faces, urlParams) && allPassed;

            console.log('  generateTrials:');
            const trials = generateTrials(faces, jsPsych);
            allPassed = validateTrials(trials, faces) && allPassed;

            faces.forEach(f => faceRows.push({
                run, condition: urlParams.label, face_id: f.id, color: f.color, is_good: f.isGood
            }));

            const counts = new Map(faces.map(f => [f.id, 0]));
            trials.forEach(t => t.faces.forEach(f => counts.set(f.id, counts.get(f.id) + 1)));
            counts.forEach((appearances, id) => appearanceRows.push({
                run,
                condition:   urlParams.label,
                face_id:     id,
                color:       faces.find(f => f.id === id).color,
                is_good:     faces.find(f => f.id === id).isGood,
                appearances
            }));
        }
    }

    const outDir = path.join(__dirname, 'output');
    fs.mkdirSync(outDir, { recursive: true });

    fs.writeFileSync(
        path.join(outDir, 'face_assignment.csv'),
        toCSV(['run', 'condition', 'face_id', 'color', 'is_good'], faceRows)
    );
    fs.writeFileSync(
        path.join(outDir, 'trial_appearances.csv'),
        toCSV(['run', 'condition', 'face_id', 'color', 'is_good', 'appearances'], appearanceRows)
    );

    console.log('\n─────────────────────────────────────────');
    console.log(allPassed
        ? '✓  All assertions passed'
        : '✗  One or more assertions FAILED');
    console.log('CSV files written to tests/output/');

    if (!allPassed) process.exit(1);
}

main();
