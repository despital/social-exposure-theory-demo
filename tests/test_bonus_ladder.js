/**
 * Edge checks for Phase 1 → bonus probability ladder.
 * Usage: node tests/test_bonus_ladder.js
 *
 * Mirrors CONFIG.BONUS_PROBABILITY_LADDER + getBonusProbability logic
 * (CommonJS self-contained; no webpack).
 */

'use strict';

const LADDER = [
    { minScore: -91.2, p: 0.0 },
    { minScore: -81.6, p: 0.1 },
    { minScore: -72.0, p: 0.2 },
    { minScore: -61.2, p: 0.3 },
    { minScore: -52.8, p: 0.4 },
    { minScore: -43.2, p: 0.5 },
    { minScore: -33.6, p: 0.6 },
    { minScore: -24.0, p: 0.7 },
    { minScore: -14.4, p: 0.8 },
    { minScore: -4.8,  p: 0.9 },
    { minScore: 4.8,   p: 1.0 }
];

function getBonusProbability(phase1Score) {
    let p = 0;
    for (const row of LADDER) {
        if (phase1Score >= row.minScore) p = row.p;
        else break;
    }
    return p;
}

const cases = [
    { s: -91.3, expect: 0.0 },
    { s: -91.2, expect: 0.0 },
    { s: -81.6, expect: 0.1 },
    { s: -4.8,  expect: 0.9 },
    { s: 0,     expect: 0.9 },
    { s: 4.7,   expect: 0.9 },
    { s: 4.8,   expect: 1.0 },
    { s: 24,    expect: 1.0 },
];

let ok = true;
for (const { s, expect } of cases) {
    const got = getBonusProbability(s);
    const pass = Math.abs(got - expect) < 1e-9;
    console.log(`${pass ? '✓' : '✗'} score=${s} → ${got} (expected ${expect})`);
    if (!pass) ok = false;
}

if (!ok) process.exit(1);
console.log('All bonus ladder edge checks passed.');
