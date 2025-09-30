/**
 * plugin-image-multi-choice
 *
 * Displays multiple images in a grid and allows participant to click one to make a choice.
 * Records which image was clicked and reaction time.
 */

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
    },
};

class ImageMultiChoicePlugin {
    constructor(jsPsych) {
        this.jsPsych = jsPsych;
    }

    trial(display_element, trial) {
        // Store trial start time
        const startTime = performance.now();

        // Build HTML
        let html = "";

        // Add prompt if provided
        if (trial.prompt !== null) {
            html += `<div class="image-multi-choice-prompt">${trial.prompt}</div>`;
        }

        // Create grid container
        html += `<div class="image-multi-choice-container" style="
            display: grid;
            grid-template-columns: repeat(${trial.grid_columns}, 1fr);
            gap: ${trial.gap}px;
            max-width: ${(trial.image_width + trial.gap) * trial.grid_columns}px;
            margin: 20px auto;
            justify-content: center;
        ">`;

        // Add each image
        trial.images.forEach((image, index) => {
            const backgroundColor = image.color || 'transparent';
            html += `
                <div class="image-multi-choice-option" data-choice="${index}" style="
                    border: 3px solid transparent;
                    border-radius: 10px;
                    padding: 20px;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    background-color: ${backgroundColor === 'red' ? 'rgba(255, 0, 0, 0.3)' : backgroundColor === 'blue' ? 'rgba(0, 0, 255, 0.3)' : 'transparent'};
                    text-align: center;
                ">
                    <img src="${image.src}" alt="Choice ${index + 1}" style="
                        width: ${trial.image_width}px;
                        height: ${trial.image_height}px;
                        object-fit: cover;
                        border-radius: 5px;
                        display: block;
                        margin: 0 auto;
                        background-color: ${backgroundColor};
                    ">
                </div>
            `;
        });

        html += "</div>";

        // Display HTML
        display_element.innerHTML = html;

        // Add hover effect via CSS
        const style = document.createElement('style');
        style.textContent = `
            .image-multi-choice-option:hover {
                border-color: #333 !important;
                transform: scale(1.05);
            }
        `;
        document.head.appendChild(style);

        // Add click handlers
        const choices = display_element.querySelectorAll('.image-multi-choice-option');
        choices.forEach((choice, index) => {
            choice.addEventListener('click', () => {
                // Calculate reaction time
                const endTime = performance.now();
                const rt = Math.round(endTime - startTime);

                // Gather trial data
                const trial_data = {
                    rt: rt,
                    response: index,
                    images: trial.images.map(img => ({
                        src: img.src,
                        color: img.color,
                        ...img.data
                    }))
                };

                // Clear display
                display_element.innerHTML = '';

                // Remove style element
                style.remove();

                // End trial
                this.jsPsych.finishTrial(trial_data);
            });
        });
    }
}

ImageMultiChoicePlugin.info = info;

export default ImageMultiChoicePlugin;