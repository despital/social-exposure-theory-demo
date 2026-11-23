/**
 * Phase 1 score → $5 bonus lottery helpers.
 * Ladder thresholds live in CONFIG.BONUS_PROBABILITY_LADDER.
 */

import { CONFIG } from './config.js';

/**
 * Map Phase 1 score to bonus win probability in [0, 1].
 * Uses the highest ladder row with minScore <= phase1Score.
 * Scores below the lowest threshold → 0.
 */
export function getBonusProbability(phase1Score) {
    const ladder = CONFIG.BONUS_PROBABILITY_LADDER;
    let p = 0;
    for (const row of ladder) {
        if (phase1Score >= row.minScore) {
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

/** Mount or refresh the fixed bottom Phase 1 score + bonus-chance HUD. */
export function updateBonusHud(phase1Score) {
    let el = document.getElementById(HUD_ID);
    if (!el) {
        el = document.createElement('div');
        el.id = HUD_ID;
        el.className = 'score-display';
        document.body.appendChild(el);
    }
    const p = getBonusProbability(phase1Score);
    el.innerHTML = `
        <span class="score-display-score">Score: <strong>${phase1Score}</strong></span>
        <span class="score-display-sep">·</span>
        <span class="score-display-chance">Bonus chance: <strong>${formatBonusPercent(p)}</strong></span>
    `;
}

/** Remove the Phase 1 HUD (call when leaving Phase 1). */
export function removeBonusHud() {
    const el = document.getElementById(HUD_ID);
    if (el) el.remove();
}
