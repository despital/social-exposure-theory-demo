/**
 * plugin-image-multi-choice
 *
 * Displays multiple images in a grid and allows participant to click one to make a choice.
 * Records which image was clicked and reaction time.
 * Optional trial_duration shows a countdown bar; on timeout a random face is chosen.
 * Optional response_lock_ms blocks clicks until unlock (status line + cursor only).
 */

import { mountResponseTimer } from '../utils/response_timer.js';

const info = {
    name: "image-multi-choice",
    parameters: {
        /** Array of image objects with {src, color, data} properties */
        images: {
            type: "COMPLEX",
            array: true,
            default: undefined,
        },
        /** Prompt text to display above images */
        prompt: {
            type: "STRING",
            default: null,
        },
        /** Width of each image in pixels */
        image_width: {
            type: "INT",
            default: 200,
        },
        /** Height of each image in pixels */
        image_height: {
            type: "INT",
            default: 200,
        },
        /** Number of columns in grid */
        grid_columns: {
            type: "INT",
            default: 2,
        },
        /** Gap between images in pixels */
        gap: {
            type: "INT",
            default: 20,
        },
        /** Response deadline in ms; null = wait indefinitely */
        trial_duration: {
            type: "INT",
            default: null,
        },
        /** Show countdown bar when trial_duration is set */
        show_timer: {
            type: "BOOL",
            default: true,
        },
        /** ms before clicks are accepted; 0 = no lock */
        response_lock_ms: {
            type: "INT",
            default: 0,
        },
    },
};

class ImageMultiChoicePlugin {
    constructor(jsPsych) {
        this.jsPsych = jsPsych;
    }

    trial(display_element, trial) {
        const startTime = performance.now();
        let trialEnded = false;
        let timerHandle = null;
        let lockTimeoutId = null;
        const lockMs = trial.response_lock_ms > 0 ? trial.response_lock_ms : 0;
        let unlocked = lockMs <= 0;
        let unlockTime = unlocked ? startTime : null;

        let html = "";

        if (trial.prompt !== null) {
            html += `<div class="image-multi-choice-prompt">${trial.prompt}</div>`;
        }

        if (lockMs > 0) {
            html += `<div class="response-lock-status" aria-live="polite">Please wait…</div>`;
        }

        html += `<div class="image-multi-choice-container${lockMs > 0 ? ' response-locked' : ''}" style="
            display: grid;
            grid-template-columns: repeat(${trial.grid_columns}, 1fr);
            gap: ${trial.gap}px;
            max-width: ${(trial.image_width + trial.gap) * trial.grid_columns}px;
            margin: 20px auto;
            justify-content: center;
        ">`;

        trial.images.forEach((image, index) => {
            html += `
                <div class="image-multi-choice-option" data-choice="${index}" style="
                    border: 3px solid transparent;
                    border-radius: 10px;
                    padding: 20px;
                    cursor: ${lockMs > 0 ? 'not-allowed' : 'pointer'};
                    transition: all 0.3s ease;
                    background-color: transparent;
                    text-align: center;
                ">
                    <img src="${image.src}" alt="Choice ${index + 1}" style="
                        width: ${trial.image_width}px;
                        height: ${trial.image_height}px;
                        object-fit: cover;
                        border-radius: 5px;
                        display: block;
                        margin: 0 auto;
                    ">
                </div>
            `;
        });

        html += "</div>";

        display_element.innerHTML = html;

        const style = document.createElement('style');
        style.textContent = `
            .image-multi-choice-container:not(.response-locked) .image-multi-choice-option:hover {
                border-color: #333 !important;
                transform: scale(1.05);
            }
        `;
        document.head.appendChild(style);

        const statusEl = display_element.querySelector('.response-lock-status');
        const container = display_element.querySelector('.image-multi-choice-container');
        const choices = display_element.querySelectorAll('.image-multi-choice-option');

        const finish = (responseIndex, choiceType, rt) => {
            if (trialEnded) return;
            trialEnded = true;
            if (timerHandle) timerHandle.clear();
            if (lockTimeoutId !== null) clearTimeout(lockTimeoutId);

            let rt_from_unlock = null;
            if (rt != null) {
                if (lockMs > 0 && unlockTime != null) {
                    rt_from_unlock = Math.max(0, Math.round((startTime + rt) - unlockTime));
                } else {
                    rt_from_unlock = rt;
                }
            }

            const trial_data = {
                rt: rt,
                response: responseIndex,
                choice_type: choiceType,
                lock_ms: lockMs,
                rt_from_unlock: rt_from_unlock,
                images: trial.images.map(img => ({
                    src: img.src,
                    color: img.color,
                    ...img.data
                }))
            };

            display_element.innerHTML = '';
            style.remove();
            this.jsPsych.finishTrial(trial_data);
        };

        const unlock = () => {
            if (unlocked || trialEnded) return;
            unlocked = true;
            unlockTime = performance.now();
            if (statusEl) statusEl.textContent = 'Click a face to choose';
            if (container) container.classList.remove('response-locked');
            choices.forEach((choice) => {
                choice.style.cursor = 'pointer';
            });
        };

        choices.forEach((choice, index) => {
            choice.addEventListener('click', () => {
                if (!unlocked) return;
                const rt = Math.round(performance.now() - startTime);
                finish(index, 'participant', rt);
            });
        });

        if (lockMs > 0) {
            lockTimeoutId = this.jsPsych.pluginAPI.setTimeout(unlock, lockMs);
        }

        if (trial.trial_duration != null && trial.trial_duration > 0) {
            if (trial.show_timer !== false) {
                timerHandle = mountResponseTimer(display_element, trial.trial_duration, {
                    onTimeout: () => {
                        const randomIndex = Math.floor(Math.random() * trial.images.length);
                        finish(randomIndex, 'random_timeout', null);
                    }
                });
            } else {
                this.jsPsych.pluginAPI.setTimeout(() => {
                    const randomIndex = Math.floor(Math.random() * trial.images.length);
                    finish(randomIndex, 'random_timeout', null);
                }, trial.trial_duration);
            }
        }
    }
}

ImageMultiChoicePlugin.info = info;

export default ImageMultiChoicePlugin;
