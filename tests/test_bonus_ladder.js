/**
 * Edge checks for Phase 1 score → smooth bonus probability ladder.
 * Usage: node tests/test_bonus_ladder.js
 */

'use strict';

const LADDER = [
    { minScore: -19.2, p: 0.05 },
    { minScore: -16.8, p: 0.10 },
    { minScore: -14.4, p: 0.15 },
    { minScore: -12.0, p: 0.20 },
    { minScore:  -9.6, p: 0.25 },
    { minScore:  -7.2, p: 0.30 },
    { minScore:  -4.8, p: 0.35 },
    { minScore:  -2.4, p: 0.40 },
    { minScore:   0.0, p: 0.50 },
    { minScore:   2.4, p: 0.55 },
    { minScore:   4.8, p: 0.60 },
    { minScore:   7.2, p: 0.70 },
    { minScore:   9.6, p: 0.75 },
    { minScore:  12.0, p: 0.80 },
    { minScore:  14.4, p: 0.85 },
    { minScore:  16.8, p: 0.90 },
    { minScore:  19.2, p: 0.95 },
    { minScore:  21.6, p: 1.00 }
];

function getBonusProbability(score) {
    let p = 0;
    for (const row of LADDER) {
        if (score >= row.minScore) p = row.p;
        else break;
    }
    return p;
}

const cases = [
    { score: -91.2, expect: 0.0 },
    { score: -19.3, expect: 0.0 },
    { score: -19.2, expect: 0.05 }, // ≈ m = 30
    { score: -4.8,  expect: 0.35 }, // ≈ m = 36 random
    { score: -2.5,  expect: 0.35 },
    { score: -2.4,  expect: 0.40 },
    { score:  0.0,  expect: 0.50 },
    { score:  7.2,  expect: 0.70 },
    { score: 19.2,  expect: 0.95 },
    { score: 21.6,  expect: 1.00 },
    { score: 24.0,  expect: 1.00 },
];

let ok = true;
for (const { score, expect } of cases) {
    const got = getBonusProbability(score);
    const pass = Math.abs(got - expect) < 1e-9;
    console.log(`${pass ? '✓' : '✗'} score=${score} → ${got} (expected ${expect})`);
    if (!pass) ok = false;
}

if (!ok) process.exit(1);
console.log('All smooth bonus ladder edge checks passed.');
