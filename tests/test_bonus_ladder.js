/**
 * Edge checks for bad-face-trials-avoided → bonus probability ladder.
 * Usage: node tests/test_bonus_ladder.js
 */

'use strict';

const LADDER = [
    { minAvoided: 0,  p: 0.0 },
    { minAvoided: 37, p: 0.1 },
    { minAvoided: 38, p: 0.2 },
    { minAvoided: 39, p: 0.3 },
    { minAvoided: 40, p: 0.4 },
    { minAvoided: 41, p: 0.5 },
    { minAvoided: 42, p: 0.6 },
    { minAvoided: 43, p: 0.7 },
    { minAvoided: 44, p: 0.8 },
    { minAvoided: 45, p: 0.9 },
    { minAvoided: 46, p: 1.0 }
];

function getBonusProbability(m) {
    let p = 0;
    for (const row of LADDER) {
        if (m >= row.minAvoided) p = row.p;
        else break;
    }
    return p;
}

const cases = [
    { m: 0,  expect: 0.0 },
    { m: 36, expect: 0.0 }, // ≈ random
    { m: 37, expect: 0.1 },
    { m: 40, expect: 0.4 },
    { m: 45, expect: 0.9 },
    { m: 46, expect: 1.0 },
    { m: 48, expect: 1.0 },
];

let ok = true;
for (const { m, expect } of cases) {
    const got = getBonusProbability(m);
    const pass = Math.abs(got - expect) < 1e-9;
    console.log(`${pass ? '✓' : '✗'} m=${m} → ${got} (expected ${expect})`);
    if (!pass) ok = false;
}

if (!ok) process.exit(1);
console.log('All bonus ladder edge checks passed.');
