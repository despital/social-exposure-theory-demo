/**
 * Face Sampling Logic Test
 *
 * Runs generateFaces + generateTrials 2× per condition (6 runs total),
 * validates key properties, and writes results to CSV.
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

// ─── Config (mirrors src/utils/config.js) ─────────────────────────────────────

const CONFIG = {
    EXPOSURES_PER_FACE: 12,
    FACES_PER_TRIAL:     4,
    TOTAL_FACES:        100,
    FACE_COLOR_SPLIT: {
        'equal':             { red: 50, blue: 50 },
        'majority-minority': { majority: 80, minority: 20 }
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

function generateTrials(faces, jsPsych) {
    const trials = [];
    for (let block = 0; block < CONFIG.EXPOSURES_PER_FACE; block++) {
        const shuffled = jsPsych.randomization.shuffle([...faces]);
        const nTrials  = Math.floor(shuffled.length / CONFIG.FACES_PER_TRIAL);
        for (let t = 0; t < nTrials; t++) {
            trials.push({
                block:        block + 1,
                trialInBlock: t + 1,
                faces:        shuffled.slice(
                    t * CONFIG.FACES_PER_TRIAL,
                    (t + 1) * CONFIG.FACES_PER_TRIAL
                )
            });
        }
    }
    return trials;
}

// ─── Validation ───────────────────────────────────────────────────────────────

function validateFaces(faces, urlParams) {
    const redFaces  = faces.filter(f => f.color === 'red');
    const blueFaces = faces.filter(f => f.color === 'blue');
    const uniqueIds = new Set(faces.map(f => f.id));

    let expectedRed, expectedBlue;
    if (urlParams.condition === 'equal') {
        expectedRed  = CONFIG.FACE_COLOR_SPLIT['equal'].red;
        expectedBlue = CONFIG.FACE_COLOR_SPLIT['equal'].blue;
    } else {
        const split  = CONFIG.FACE_COLOR_SPLIT['majority-minority'];
        expectedRed  = urlParams.majorityGroup === 'red'  ? split.majority : split.minority;
        expectedBlue = urlParams.majorityGroup === 'blue' ? split.majority : split.minority;
    }

    const checks = [
        { name: 'total face count',   pass: faces.length === CONFIG.TOTAL_FACES,
          detail: `${faces.length} (expected ${CONFIG.TOTAL_FACES})` },
        { name: 'red count',          pass: redFaces.length === expectedRed,
          detail: `${redFaces.length} (expected ${expectedRed})` },
        { name: 'blue count',         pass: blueFaces.length === expectedBlue,
          detail: `${blueFaces.length} (expected ${expectedBlue})` },
        { name: 'all IDs unique',     pass: uniqueIds.size === CONFIG.TOTAL_FACES,
          detail: `${uniqueIds.size} unique IDs` },
    ];

    checks.forEach(c => console.log(`    ${c.pass ? '✓' : '✗'} ${c.name}: ${c.detail}`));
    return checks.every(c => c.pass);
}

function validateTrials(trials, faces) {
    const expectedTotal = CONFIG.TOTAL_FACES * CONFIG.EXPOSURES_PER_FACE / CONFIG.FACES_PER_TRIAL;

    // Count how many times each face appears across all trials
    const appearances = new Map(faces.map(f => [f.id, 0]));
    let withinTrialDuplicates = 0;

    for (const trial of trials) {
        const ids = trial.faces.map(f => f.id);
        if (new Set(ids).size !== CONFIG.FACES_PER_TRIAL) withinTrialDuplicates++;
        ids.forEach(id => appearances.set(id, appearances.get(id) + 1));
    }

    const wrongCounts = [...appearances.entries()].filter(([, c]) => c !== CONFIG.EXPOSURES_PER_FACE);
    const blocks      = new Set(trials.map(t => t.block));

    const checks = [
        { name: 'total trial count',          pass: trials.length === expectedTotal,
          detail: `${trials.length} (expected ${expectedTotal})` },
        { name: 'each face appears exactly 12×', pass: wrongCounts.length === 0,
          detail: wrongCounts.length === 0 ? 'all good' : `${wrongCounts.length} face(s) with wrong count` },
        { name: 'no within-trial duplicates', pass: withinTrialDuplicates === 0,
          detail: `${withinTrialDuplicates} violation(s)` },
        { name: 'exactly 12 blocks',          pass: blocks.size === CONFIG.EXPOSURES_PER_FACE,
          detail: `${blocks.size} block(s) found` },
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

    const faceRows       = [];   // → face_assignment.csv
    const appearanceRows = [];   // → trial_appearances.csv
    let   allPassed      = true;

    for (const urlParams of conditions) {
        for (let run = 1; run <= RUNS_PER_CONDITION; run++) {
            console.log(`\n── run ${run} | ${urlParams.label} ──`);
            const jsPsych = createMockJsPsych();

            // generateFaces
            console.log('  generateFaces:');
            const faces   = generateFaces(jsPsych, urlParams);
            allPassed     = validateFaces(faces, urlParams) && allPassed;

            // generateTrials
            console.log('  generateTrials:');
            const trials  = generateTrials(faces, jsPsych);
            allPassed     = validateTrials(trials, faces) && allPassed;

            // Collect face assignment rows
            faces.forEach(f => faceRows.push({
                run, condition: urlParams.label, face_id: f.id, color: f.color
            }));

            // Collect per-face appearance counts from the trial schedule
            const counts = new Map(faces.map(f => [f.id, 0]));
            trials.forEach(t => t.faces.forEach(f => counts.set(f.id, counts.get(f.id) + 1)));
            counts.forEach((appearances, id) => appearanceRows.push({
                run,
                condition:   urlParams.label,
                face_id:     id,
                color:       faces.find(f => f.id === id).color,
                appearances
            }));
        }
    }

    // Write output CSVs
    const outDir = path.join(__dirname, 'output');
    fs.mkdirSync(outDir, { recursive: true });

    fs.writeFileSync(
        path.join(outDir, 'face_assignment.csv'),
        toCSV(['run', 'condition', 'face_id', 'color'], faceRows)
    );
    fs.writeFileSync(
        path.join(outDir, 'trial_appearances.csv'),
        toCSV(['run', 'condition', 'face_id', 'color', 'appearances'], appearanceRows)
    );

    console.log('\n─────────────────────────────────────────');
    console.log(allPassed
        ? '✓  All assertions passed'
        : '✗  One or more assertions FAILED');
    console.log('CSV files written to tests/output/');
}

main();
