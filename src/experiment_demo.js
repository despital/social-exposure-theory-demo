/**
 * @title Social Exposure Theory Experiment - DEMO VERSION
 * @description In-lab demo showcasing the pilot design (5 trials per phase).
 * @version 2.0.0-demo
 */

// Import styles
import "./styles/main.scss";
import "jspsych/css/jspsych.css";

// Import jsPsych and plugins
import { initJsPsych } from "jspsych";
import HtmlKeyboardResponsePlugin from "@jspsych/plugin-html-keyboard-response";
import HtmlSliderResponsePlugin from "@jspsych/plugin-html-slider-response";
import ImageMultiChoicePlugin from "./plugins/plugin-image-multi-choice.js";

// Import utilities
import { CONFIG } from "./utils/config.js";
import {
    generateFaces,
    assignGoodBad,
    generateTrials,
    getOutcome,
    getURLParams,
    generateNovelFaces,
    generatePhase2Trials,
    generatePhase3Trials
} from "./utils/helpers.js";

const DEMO_TRIALS_PER_PHASE = 5;

/**
 * Main experiment function
 */
export async function run({ assetPaths, input = {}, environment, title, version }) {
    const jsPsych = initJsPsych({
        show_progress_bar: true,
        auto_update_progress_bar: false,
        on_finish: function() {
            jsPsych.data.displayData();
        }
    });

    const urlParams = getURLParams(jsPsych);

    // Generate Phase 1 faces and assign good/bad status
    let faces = generateFaces(jsPsych, urlParams);
    faces = assignGoodBad(faces, jsPsych);

    // Generate novel faces for Phase 2
    const novelFaces = generateNovelFaces(jsPsych);

    // Generate trials (slice to 5 per phase)
    const phase1Trials = generateTrials(faces, jsPsych).slice(0, DEMO_TRIALS_PER_PHASE);
    const phase2Trials = generatePhase2Trials(novelFaces, urlParams, jsPsych).slice(0, DEMO_TRIALS_PER_PHASE);
    const phase3Trials = generatePhase3Trials(phase1Trials, faces, jsPsych).slice(0, DEMO_TRIALS_PER_PHASE);

    // Score and counter tracking
    let totalScore = 0;       // Phase 1 cumulative score
    let phase2Score = 0;
    let phase1Count = 0;
    let phase2TrialCount = 0;
    let phase3TrialCount = 0;

    console.log('DEMO Experiment initialized:', {
        conditionCode: urlParams.conditionCode,
        condition: urlParams.condition,
        majorityGroup: urlParams.majorityGroup,
        p1Type: urlParams.p1Type,
        p2Exposure: urlParams.p2Exposure,
        phase1Trials: phase1Trials.length,
        phase2Trials: phase2Trials.length,
        phase3Trials: phase3Trials.length
    });

    // ========================================================================
    // TIMELINE
    // ========================================================================

    const timeline = [];

    // Welcome screen
    const welcome = {
        type: HtmlKeyboardResponsePlugin,
        stimulus: `
            <h1>Social Exposure Theory Experiment</h1>
            <h2 style="color: #e74c3c;">DEMO VERSION</h2>
            <p>This is a simplified in-lab demo with ${DEMO_TRIALS_PER_PHASE} trials per phase.</p>
            <p style="color: #666;">Condition: ${urlParams.conditionCode} | P1: ${urlParams.p1Type} | P2 Exposure: ${urlParams.p2Exposure}</p>
            <p>Press any key to begin.</p>
        `,
        on_start: function() {
            jsPsych.progressBar.progress = 0;
        }
    };
    timeline.push(welcome);

    // ========================================================================
    // PHASE 1: LEARNING TASK
    // ========================================================================

    const phase1InstructionText = urlParams.p1Type === 'control'
        ? `<div style="max-width: 800px; margin: auto; text-align: left;">
            <h2>Phase 1: Learning Task</h2>
            <p>You will see <strong>4 faces</strong> on each trial.</p>
            <p>Your task is to choose <strong>one person</strong> to interact with by clicking on their face.</p>
            <p>After your choice, the reward values for <strong>all four people</strong> will be revealed.</p>
            <p>Each person can give you either a <strong>reward (+1)</strong> or a <strong>punishment (-5)</strong>.</p>
            <p><strong>Your goal is to maximize your total score.</strong></p>
            <p><em>Demo: ${DEMO_TRIALS_PER_PHASE} trials.</em></p>
            <p>Press any key to start.</p>
        </div>`
        : `<div style="max-width: 800px; margin: auto; text-align: left;">
            <h2>Phase 1: Learning Task</h2>
            <p>You will see <strong>4 faces</strong> on each trial.</p>
            <p>Your task is to choose <strong>one person</strong> to interact with by clicking on their face.</p>
            <p>After your choice, you will receive either a <strong>reward (+1)</strong> or a <strong>punishment (-5)</strong>.</p>
            <p><strong>Your goal is to maximize your total score.</strong></p>
            <p><em>Demo: ${DEMO_TRIALS_PER_PHASE} trials.</em></p>
            <p>Press any key to start.</p>
        </div>`;

    const phase1Instructions = {
        type: HtmlKeyboardResponsePlugin,
        stimulus: phase1InstructionText,
        data: { task: 'phase1_instructions' }
    };
    timeline.push(phase1Instructions);

    // Phase 1 choice trial
    const choiceTrial = {
        type: ImageMultiChoicePlugin,
        images: function() {
            const trialFaces = jsPsych.evaluateTimelineVariable('faces');
            return trialFaces.map(face => ({
                src: face.imagePath,
                color: face.color,
                data: { id: face.id, isGood: face.isGood }
            }));
        },
        prompt: function() {
            return `<p>Choose a person to interact with by clicking on a face:</p>`;
        },
        image_width: 200,
        image_height: 200,
        grid_columns: 2,
        gap: 20,
        data: function() {
            return {
                task: 'choice',
                phase: 1,
                block: jsPsych.evaluateTimelineVariable('block'),
                trial_in_block: jsPsych.evaluateTimelineVariable('trialInBlock')
            };
        },
        on_finish: function(data) {
            const trialFaces = jsPsych.evaluateTimelineVariable('faces');
            const chosenFace = trialFaces[data.response];
            const outcome = getOutcome(chosenFace);

            totalScore += outcome;
            phase1Count++;

            data.chosen_face_id = chosenFace.id;
            data.chosen_face_color = chosenFace.color;
            data.chosen_face_is_good = chosenFace.isGood;
            data.outcome = outcome;
            data.total_score = totalScore;

            if (urlParams.p1Type === 'control') {
                data.all_outcomes = trialFaces.map(face => ({
                    id: face.id,
                    color: face.color,
                    isGood: face.isGood,
                    outcome: face === chosenFace ? outcome : getOutcome(face),
                    imagePath: face.imagePath
                }));
            }
        }
    };

    // Phase 1 feedback trial
    const feedbackTrial = {
        type: HtmlKeyboardResponsePlugin,
        stimulus: function() {
            const lastTrial = jsPsych.data.get().last(1).values()[0];
            const outcome = lastTrial.outcome;

            if (urlParams.p1Type === 'control') {
                const allOutcomes = lastTrial.all_outcomes;
                const chosenIndex = lastTrial.response;
                let html = '<div class="control-feedback-grid">';
                allOutcomes.forEach((face, i) => {
                    const isChosen = i === chosenIndex;
                    const feedbackClass = face.outcome > 0 ? 'positive' : 'negative';
                    html += `
                        <div class="control-feedback-cell ${isChosen ? 'chosen' : ''}">
                            <div class="feedback-value ${feedbackClass}">
                                ${face.outcome > 0 ? '+' + face.outcome : face.outcome}
                            </div>
                        </div>`;
                });
                html += '</div>';
                return html;
            } else {
                const feedbackClass = outcome > 0 ? 'positive' : 'negative';
                const feedbackText = outcome > 0 ? `+${outcome}` : outcome;
                return `
                    <div class="feedback ${feedbackClass}">
                        ${feedbackText}
                    </div>
                `;
            }
        },
        choices: "NO_KEYS",
        trial_duration: 1000,
        data: { task: 'feedback', phase: 1 },
        on_finish: function() {
            jsPsych.progressBar.progress = (phase1Count / DEMO_TRIALS_PER_PHASE) * 0.6;
        }
    };

    const phase1Timeline = {
        timeline: [choiceTrial, feedbackTrial],
        timeline_variables: phase1Trials
    };
    timeline.push(phase1Timeline);

    // Phase 1 complete
    const phase1Complete = {
        type: HtmlKeyboardResponsePlugin,
        stimulus: `
            <h2>Phase 1 Complete!</h2>
            <p>Great job! You've finished the first part of the experiment.</p>
            <p>Press any key to continue.</p>
        `,
        post_trial_gap: 500,
        data: { task: 'phase1_complete' }
    };
    timeline.push(phase1Complete);

    // ========================================================================
    // PHASE 2 BREAK (shortened to 10 s for demo)
    // ========================================================================

    let breakCountdownInterval = null;
    const phase2BreakScreen = {
        type: HtmlKeyboardResponsePlugin,
        stimulus: function() {
            return `
                <div id="break-container">
                    <h2>Break Time!</h2>
                    <p>You've completed Phase 1. Please take a short break before Phase 2.</p>
                    <p>The experiment will continue in:</p>
                    <div id="countdown-timer" style="font-size: 48px; font-weight: bold; margin: 30px 0;">10</div>
                    <p style="color: #666;"><em>(Demo: 10 s break)</em> — or press <strong>spacebar</strong> to continue now</p>
                </div>
            `;
        },
        choices: [' '],
        trial_duration: 10000,
        on_load: function() {
            let timeLeft = 10;
            const timerElement = document.getElementById('countdown-timer');
            breakCountdownInterval = setInterval(() => {
                timeLeft--;
                if (timerElement) timerElement.textContent = timeLeft;
                if (timeLeft <= 0) clearInterval(breakCountdownInterval);
            }, 1000);
        },
        on_finish: function() {
            if (breakCountdownInterval) {
                clearInterval(breakCountdownInterval);
                breakCountdownInterval = null;
            }
        },
        data: { task: 'phase2_break' }
    };
    timeline.push(phase2BreakScreen);

    // ========================================================================
    // PHASE 2: APPROACH-AVOIDANCE SLIDER TASK (NOVEL FACES)
    // ========================================================================

    const phase2Instructions = {
        type: HtmlKeyboardResponsePlugin,
        stimulus: `
            <div style="max-width: 800px; margin: auto; text-align: left;">
                <h2>Phase 2 Instructions</h2>
                <p>In this phase, you will see <strong>new faces</strong> one at a time.</p>
                <p>For each face, you will answer <strong>three questions</strong>:</p>
                <ol style="text-align: left; line-height: 2;">
                    <li>How willing are you to <strong>approach</strong> or <strong>avoid</strong> this person?</li>
                    <li>What is the <strong>probability</strong> that this person will give you a punishment?</li>
                    <li>How <strong>confident</strong> are you in your punishment probability estimate?</li>
                </ol>
                <p><strong>Note:</strong> You will NOT receive feedback after each rating.</p>
                <p><em>Demo: ${DEMO_TRIALS_PER_PHASE} faces.</em></p>
                <p>Press any key to start Phase 2.</p>
            </div>
        `,
        data: { task: 'phase2_instructions' }
    };
    timeline.push(phase2Instructions);

    const phase2SliderTrial = {
        type: HtmlSliderResponsePlugin,
        stimulus: function() {
            const face = jsPsych.evaluateTimelineVariable('face');
            return `
                <div style="text-align: center; user-select: none; -webkit-user-select: none;">
                    <img src="${face.imagePath}" draggable="false"
                         style="width: 300px; height: 300px; border: 10px solid ${face.color}; border-radius: 10px; margin-bottom: 20px; -webkit-user-drag: none;">
                    <h3 style="margin-top: 10px;">How willing are you to <strong>approach</strong> or <strong>avoid</strong> this person?</h3>
                </div>
            `;
        },
        labels: ['Avoid', 'Neutral', 'Approach'],
        min: 0,
        max: 100,
        start: 50,
        step: 1,
        slider_width: 500,
        require_movement: true,
        data: function() {
            const face = jsPsych.evaluateTimelineVariable('face');
            return {
                task: 'phase2_slider',
                phase: 2,
                face_id: face.id,
                face_color: face.color,
                face_is_good: face.isGood,
                image_path: face.imagePath
            };
        },
        on_finish: function(data) {
            const face = jsPsych.evaluateTimelineVariable('face');
            data.slider_rating = data.response;

            const rating = data.slider_rating;
            let outcome;
            if (rating === 50) {
                outcome = 0;
                data.correct = null;
            } else if (face.isGood) {
                data.correct = rating > 50;
                outcome = rating > 50 ? CONFIG.REWARD_VALUE : CONFIG.PUNISHMENT_VALUE;
            } else {
                data.correct = rating < 50;
                outcome = rating < 50 ? CONFIG.REWARD_VALUE : CONFIG.PUNISHMENT_VALUE;
            }

            phase2Score += outcome;
            data.outcome = outcome;
            data.phase2_score = phase2Score;

            delete data.stimulus;
            delete data.slider_start;
            delete data.plugin_version;
            delete data.response;
            delete data.trial_type;
        }
    };

    const phase2ProbabilityTrial = {
        type: HtmlSliderResponsePlugin,
        stimulus: function() {
            const face = jsPsych.evaluateTimelineVariable('face');
            return `
                <div style="text-align: center; user-select: none; -webkit-user-select: none;">
                    <img src="${face.imagePath}" draggable="false"
                         style="width: 300px; height: 300px; border: 10px solid ${face.color}; border-radius: 10px; margin-bottom: 20px; -webkit-user-drag: none;">
                    <h3 style="margin-top: 10px;">What is the probability that this person will give you a <strong>punishment</strong>?</h3>
                </div>
            `;
        },
        min: 0,
        max: 100,
        start: 50,
        step: 1,
        slider_width: 500,
        labels: ['0%', '25%', '50%', '75%', '100%'],
        require_movement: true,
        data: function() {
            const face = jsPsych.evaluateTimelineVariable('face');
            return {
                task: 'phase2_probability',
                phase: 2,
                face_id: face.id,
                face_color: face.color,
                face_is_good: face.isGood,
                image_path: face.imagePath
            };
        },
        on_finish: function(data) {
            data.probability_punishment = data.response;
            delete data.stimulus;
            delete data.slider_start;
            delete data.plugin_version;
            delete data.response;
            delete data.trial_type;
        }
    };

    const phase2ConfidenceTrial = {
        type: HtmlSliderResponsePlugin,
        stimulus: function() {
            const face = jsPsych.evaluateTimelineVariable('face');
            return `
                <div style="text-align: center; user-select: none; -webkit-user-select: none;">
                    <img src="${face.imagePath}" draggable="false"
                         style="width: 300px; height: 300px; border: 10px solid ${face.color}; border-radius: 10px; margin-bottom: 20px; -webkit-user-drag: none;">
                    <h3 style="margin-top: 10px;">How <strong>confident</strong> are you in your punishment probability estimate?</h3>
                </div>
            `;
        },
        min: 0,
        max: 100,
        start: 50,
        step: 1,
        slider_width: 500,
        labels: ['Not at all confident', 'Somewhat confident', 'Very confident', 'Extremely confident'],
        require_movement: true,
        data: function() {
            const face = jsPsych.evaluateTimelineVariable('face');
            return {
                task: 'phase2_confidence',
                phase: 2,
                face_id: face.id,
                face_color: face.color,
                face_is_good: face.isGood,
                image_path: face.imagePath
            };
        },
        on_finish: function(data) {
            data.confidence_rating = data.response;

            phase2TrialCount++;
            jsPsych.progressBar.progress = 0.6 + (phase2TrialCount / DEMO_TRIALS_PER_PHASE) * 0.1;

            delete data.stimulus;
            delete data.slider_start;
            delete data.plugin_version;
            delete data.response;
            delete data.trial_type;
        }
    };

    const phase2Timeline = {
        timeline: [phase2SliderTrial, phase2ProbabilityTrial, phase2ConfidenceTrial],
        timeline_variables: phase2Trials
    };
    timeline.push(phase2Timeline);

    const phase2Summary = {
        type: HtmlKeyboardResponsePlugin,
        stimulus: `
            <h2>Phase 2 Complete!</h2>
            <p>Thank you for completing your ratings!</p>
            <p>Press any key to continue.</p>
        `,
        post_trial_gap: 500,
        data: { task: 'phase2_summary' }
    };
    timeline.push(phase2Summary);

    // ========================================================================
    // PHASE 3: PUNISHMENT PROBABILITY ESTIMATION (PHASE 1 FACES)
    // ========================================================================

    const phase3Instructions = {
        type: HtmlKeyboardResponsePlugin,
        stimulus: `
            <div style="max-width: 800px; margin: auto; text-align: left;">
                <h2>Phase 3 Instructions</h2>
                <p>In this final phase, we will show you the faces you encountered during Phase 1.</p>
                <p>For each face, use the slider to indicate:</p>
                <ul>
                    <li>What is the probability (0–100%) that this person will give you a <strong>punishment</strong>?</li>
                </ul>
                <p>The slider starts at 50%. You must move it before you can continue.</p>
                <p>There are no right or wrong answers — we're interested in your impressions.</p>
                <p><em>Demo: ${DEMO_TRIALS_PER_PHASE} trials.</em></p>
                <p>Press any key to start Phase 3.</p>
            </div>
        `,
        data: { task: 'phase3_instructions' }
    };
    timeline.push(phase3Instructions);

    const phase3ProbabilityTrial = {
        type: HtmlSliderResponsePlugin,
        stimulus: function() {
            const face = jsPsych.evaluateTimelineVariable('face');
            return `
                <div style="text-align: center; user-select: none; -webkit-user-select: none;">
                    <img src="${face.imagePath}" draggable="false"
                         style="width: 300px; height: 300px; border: 10px solid ${face.color}; border-radius: 10px; margin-bottom: 20px; -webkit-user-drag: none;">
                    <h3 style="margin-top: 10px;">What is the probability that this person will give you a <strong>punishment</strong>?</h3>
                </div>
            `;
        },
        min: 0,
        max: 100,
        start: 50,
        step: 1,
        slider_width: 500,
        labels: ['0%', '25%', '50%', '75%', '100%'],
        require_movement: true,
        data: function() {
            return {
                task: 'phase3_probability',
                phase: 3,
                face_id: jsPsych.evaluateTimelineVariable('face').id,
                face_color: jsPsych.evaluateTimelineVariable('face').color,
                face_is_good: jsPsych.evaluateTimelineVariable('face').isGood
            };
        },
        on_finish: function(data) {
            data.probability_punishment = data.response;
            phase3TrialCount++;
            jsPsych.progressBar.progress = 0.7 + (phase3TrialCount / DEMO_TRIALS_PER_PHASE) * 0.3;
        }
    };

    const phase3Timeline = {
        timeline: [phase3ProbabilityTrial],
        timeline_variables: phase3Trials
    };
    timeline.push(phase3Timeline);

    const phase3Complete = {
        type: HtmlKeyboardResponsePlugin,
        stimulus: `
            <h2>Phase 3 Complete!</h2>
            <p>Thank you for providing your ratings.</p>
            <p>Press any key to continue.</p>
        `,
        post_trial_gap: 500,
        data: { task: 'phase3_complete' }
    };
    timeline.push(phase3Complete);

    // ========================================================================
    // FINAL SUMMARY
    // ========================================================================

    const finalSummary = {
        type: HtmlKeyboardResponsePlugin,
        stimulus: function() {
            return `
                <h2>Demo Complete!</h2>
                <h3>Summary</h3>
                <p>Phase 1 score: <strong>${totalScore}</strong> (${DEMO_TRIALS_PER_PHASE} trials)</p>
                <p>Phase 2 score: <strong>${phase2Score}</strong> (${DEMO_TRIALS_PER_PHASE} approach/avoidance ratings)</p>
                <p>Phase 3: ${DEMO_TRIALS_PER_PHASE} punishment probability estimates</p>
                <hr>
                <p style="color: #666; font-size: 13px;">
                    Code: ${urlParams.conditionCode} &nbsp;|&nbsp;
                    Condition: ${urlParams.condition} &nbsp;|&nbsp;
                    Majority: ${urlParams.majorityGroup} &nbsp;|&nbsp;
                    P1 Type: ${urlParams.p1Type} &nbsp;|&nbsp;
                    P2 Exposure: ${urlParams.p2Exposure}
                </p>
                <p>Press any key to view raw data.</p>
            `;
        },
        post_trial_gap: 500
    };
    timeline.push(finalSummary);

    await jsPsych.run(timeline);
}
