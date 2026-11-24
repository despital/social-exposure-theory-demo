/**
 * Phase 1 score → $5 bonus lottery helpers.
 * Smooth discrete ladder: CONFIG.BONUS_PROBABILITY_LADDER.
 */

import { CONFIG } from './config.js';

/**
 * Map Phase 1 point total to bonus win probability in [0, 1].
 * Uses the highest ladder row with minScore <= score (else 0).
 */
export function getBonusProbability(phase1Score) {
    const score = phase1Score;
    const ladder = CONFIG.BONUS_PROBABILITY_LADDER;
    let p = 0;
    for (const row of ladder) {
        if (score >= row.minScore) {
            p = row.p;
        } else {
            break;
        }
    }
    return p;
}

/**
 * Draw the flat bonus given probability p.
 * @returns {{ won: boolean, amount_usd: number, probability: number }}
 */
export function drawBonus(p) {
    const won = Math.random() < p;
    return {
        won,
        amount_usd: won ? CONFIG.BONUS_AMOUNT_USD : 0,
        probability: p
    };
}

/** Format probability for HUD / end screens, e.g. 0.8 → "80%" */
export function formatBonusPercent(p) {
    return `${Math.round(p * 100)}%`;
}

const HUD_ID = 'bonus-status-hud';

/**
 * Mount or refresh the fixed bottom Phase 1 HUD.
 * @param {number} phase1Score
 */
export function updateBonusHud(phase1Score) {
    let el = document.getElementById(HUD_ID);
    if (!el) {
        el = document.createElement('div');
        el.id = HUD_ID;
        el.className = 'score-display';
        document.body.appendChild(el);
    }
    el.innerHTML = `
        <span class="score-display-score">Score: <strong>${phase1Score}</strong></span>
    `;
}

/** Remove the Phase 1 HUD (call when leaving Phase 1). */
export function removeBonusHud() {
    const el = document.getElementById(HUD_ID);
    if (el) el.remove();
}
