/**
 * plugin-image-multi-choice
 *
 * Displays multiple images in a grid and allows participant to click one to make a choice.
 * Records which image was clicked and reaction time.
 * Optional trial_duration shows a countdown bar; on timeout a random face is chosen.
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

        let html = "";

        if (trial.prompt !== null) {
            html += `<div class="image-multi-choice-prompt">${trial.prompt}</div>`;
        }

        html += `<div class="image-multi-choice-container" style="
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
                    cursor: pointer;
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
            .image-multi-choice-option:hover {
                border-color: #333 !important;
                transform: scale(1.05);
            }
        `;
        document.head.appendChild(style);

        const finish = (responseIndex, choiceType, rt) => {
            if (trialEnded) return;
            trialEnded = true;
            if (timerHandle) timerHandle.clear();

            const trial_data = {
                rt: rt,
                response: responseIndex,
                choice_type: choiceType,
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

        const choices = display_element.querySelectorAll('.image-multi-choice-option');
        choices.forEach((choice, index) => {
            choice.addEventListener('click', () => {
                const rt = Math.round(performance.now() - startTime);
                finish(index, 'participant', rt);
            });
        });

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
