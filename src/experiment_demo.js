/**
 * @title Social Exposure Theory Experiment - DEMO VERSION
 * @description Simplified demo for supervisor review (5 Phase 1 trials + 5 Phase 2 trials)
 * @version 1.0.0-demo
 */

// Import styles
import "./styles/main.scss";
import "jspsych/css/jspsych.css";

// Import jsPsych and plugins
import { initJsPsych } from "jspsych";
import HtmlKeyboardResponsePlugin from "@jspsych/plugin-html-keyboard-response";
import ImageMultiChoicePlugin from "./plugins/plugin-image-multi-choice.js";

// Import utilities
import { CONFIG } from "./utils/config.js";
import { generateFaces, assignGoodBad, getOutcome, getURLParams } from "./utils/helpers.js";

/**
 * DEMO CONFIGURATION - Override config values for quick demo
 */
const DEMO_CONFIG = {
    PHASE1_TRIALS: 5,  // Only 5 trials for Phase 1
    PHASE2_TRIALS: 5   // Only 5 trials for Phase 2
};

/**
 * Generate simplified Phase 1 trials for demo
 */
function generateDemoPhase1Trials(faces, jsPsych) {
    const trials = [];

    // Generate PHASE1_TRIALS simple trials by sampling without replacement from
    // the pre-coloured face pool (color split already set by generateFaces).
    for (let i = 0; i < DEMO_CONFIG.PHASE1_TRIALS; i++) {
        const trialFaces = jsPsych.randomization.sampleWithoutReplacement(
            faces, CONFIG.FACES_PER_TRIAL
        );
        trials.push({
            trialNum: i + 1,
            faces: jsPsych.randomization.shuffle(trialFaces)
        });
    }

    return trials;
}

/**
 * Generate simplified Phase 2 trials for demo
 */
function generateDemoPhase2Trials(faces, jsPsych) {
    const trials = [];
    const compositions = [
        { red: 4, blue: 0 },
        { red: 3, blue: 1 },
        { red: 2, blue: 2 },
        { red: 1, blue: 3 },
        { red: 0, blue: 4 }
    ];

    const redFaces = faces.filter(f => f.color === 'red');
    const blueFaces = faces.filter(f => f.color === 'blue');

    for (let i = 0; i < DEMO_CONFIG.PHASE2_TRIALS; i++) {
        const composition = compositions[i];

        const redSample = jsPsych.randomization.sampleWithoutReplacement(redFaces, composition.red);
        const blueSample = jsPsych.randomization.sampleWithoutReplacement(blueFaces, composition.blue);

        const trialFaces = jsPsych.randomization.shuffle([...redSample, ...blueSample]);

        trials.push({
            trialNum: i + 1,
            composition: `${composition.red}R-${composition.blue}B`,
            redCount: composition.red,
            blueCount: composition.blue,
            faces: trialFaces
        });
    }

    return trials;
}

/**
 * Main experiment function
 */
export async function run({ assetPaths, input = {}, environment, title, version }) {
    // Initialize jsPsych
    const jsPsych = initJsPsych({
        show_progress_bar: true,
        auto_update_progress_bar: false,
        on_finish: function() {
            jsPsych.data.displayData();
        }
    });

    // Get URL parameters for condition assignment
    const urlParams = getURLParams(jsPsych);

    // Generate faces and assign good/bad
    let faces = generateFaces(jsPsych, urlParams);
    faces = assignGoodBad(faces, jsPsych);

    // Generate demo trials
    const phase1Trials = generateDemoPhase1Trials(faces, jsPsych);
    const phase2Trials = generateDemoPhase2Trials(faces, jsPsych);

    // Track scores
    let phase1Score = 0;
    let phase2Score = 0;
    let phase1Count = 0;
    let phase2Count = 0;

    console.log('DEMO Experiment initialized:', {
        conditionCode: urlParams.conditionCode,
        condition: urlParams.condition,
        majorityGroup: urlParams.majorityGroup,
        p1Type: urlParams.p1Type,
        p2Exposure: urlParams.p2Exposure,
        phase1Trials: phase1Trials.length,
        phase2Trials: phase2Trials.length
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
            <p>This is a simplified demo with only 5 trials per phase.</p>
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

    // Phase 1 Instructions (differ between experimental and control)
    const phase1InstructionText = urlParams.p1Type === 'control'
        ? `<div style="max-width: 800px; margin: auto; text-align: left;">
            <h2>Phase 1: Learning Task</h2>
            <p>You will see <strong>4 faces</strong> on each trial.</p>
            <p>Your task is to choose <strong>one person</strong> to interact with by clicking on their face.</p>
            <p>After your choice, the reward values for <strong>all four people</strong> will be revealed.</p>
            <p>Each person can give you either a <strong>reward (+1)</strong> or a <strong>punishment (-5)</strong>.</p>
            <p><strong>Your goal is to maximize your total score.</strong></p>
            <p><strong>Demo:</strong> You will complete 5 trials.</p>
            <p>Press any key to start.</p>
        </div>`
        : `<div style="max-width: 800px; margin: auto; text-align: left;">
            <h2>Phase 1: Learning Task</h2>
            <p>You will see <strong>4 faces</strong> on each trial.</p>
            <p>Your task is to choose <strong>one person</strong> to interact with by clicking on their face.</p>
            <p>After your choice, you will receive either a <strong>reward (+1)</strong> or a <strong>punishment (-5)</strong>.</p>
            <p><strong>Your goal is to maximize your total score.</strong></p>
            <p><strong>Demo:</strong> You will complete 5 trials.</p>
            <p>Press any key to start.</p>
        </div>`;

    const phase1Instructions = {
        type: HtmlKeyboardResponsePlugin,
        stimulus: phase1InstructionText
    };
    timeline.push(phase1Instructions);

    // Phase 1 Choice trial
    const phase1ChoiceTrial = {
        type: ImageMultiChoicePlugin,
        images: function() {
            const trialFaces = jsPsych.evaluateTimelineVariable('faces');
            return trialFaces.map(face => ({
                src: face.imagePath,
                color: face.color,
                data: {
                    id: face.id,
                    isGood: face.isGood
                }
            }));
        },
        prompt: function() {
            return `
                <div class="score-display">Phase 1 Score: ${phase1Score}</div>
                <p>Choose a person to interact with:</p>
            `;
        },
        image_width: 200,
        image_height: 200,
        grid_columns: 2,
        gap: 20,
        data: function() {
            return {
                task: 'phase1_choice',
                phase: 1,
                trial_num: jsPsych.evaluateTimelineVariable('trialNum')
            };
        },
        on_finish: function(data) {
            const trialFaces = jsPsych.evaluateTimelineVariable('faces');
            const chosenFace = trialFaces[data.response];
            const outcome = getOutcome(chosenFace);

            phase1Score += outcome;
            phase1Count++;

            data.chosen_face_id = chosenFace.id;
            data.chosen_face_color = chosenFace.color;
            data.chosen_face_is_good = chosenFace.isGood;
            data.outcome = outcome;
            data.phase1_score = phase1Score;

            // Control condition: compute and store outcomes for all 4 faces
            if (urlParams.p1Type === 'control') {
                data.all_outcomes = trialFaces.map(face => ({
                    id: face.id,
                    color: face.color,
                    isGood: face.isGood,
                    outcome: face === chosenFace ? outcome : getOutcome(face),
                    imagePath: face.imagePath
                }));
            }

            // Update progress
            const progress = phase1Count / DEMO_CONFIG.PHASE1_TRIALS;
            jsPsych.progressBar.progress = progress * 0.4; // Phase 1 is 40% of total
        }
    };

    // Phase 1 Feedback trial
    const phase1FeedbackTrial = {
        type: HtmlKeyboardResponsePlugin,
        stimulus: function() {
            const lastTrial = jsPsych.data.get().last(1).values()[0];
            const outcome = lastTrial.outcome;

            if (urlParams.p1Type === 'control') {
                // Control: show all 4 faces with their outcomes
                const allOutcomes = lastTrial.all_outcomes;
                const chosenIndex = lastTrial.response;
                let html = `<div class="score-display">Phase 1 Score: ${phase1Score}</div>`;
                html += '<div class="control-feedback-grid">';
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
                // Experimental: single outcome
                const feedbackClass = outcome > 0 ? 'positive' : 'negative';
                const feedbackText = outcome > 0 ? `+${outcome}` : outcome;
                return `
                    <div class="score-display">Phase 1 Score: ${phase1Score}</div>
                    <div class="feedback ${feedbackClass}">
                        ${feedbackText}
                    </div>
                    <p>Press any key to continue</p>
                `;
            }
        },
        trial_duration: 1500,
        data: {
            task: 'phase1_feedback',
            phase: 1
        }
    };

    // Phase 1 timeline
    const phase1Timeline = {
        timeline: [phase1ChoiceTrial, phase1FeedbackTrial],
        timeline_variables: phase1Trials
    };
    timeline.push(phase1Timeline);

    // Phase 1 Summary
    const phase1Summary = {
        type: HtmlKeyboardResponsePlugin,
        stimulus: function() {
            return `
                <h2>Phase 1 Complete!</h2>
                <p>Your Phase 1 score: <strong>${phase1Score}</strong></p>
                <p>Press any key to continue to Phase 2.</p>
            `;
        },
        post_trial_gap: 500
    };
    timeline.push(phase1Summary);

    // ========================================================================
    // PHASE 2: PARTNER CHOICE
    // ========================================================================

    // Phase 2 Instructions
    const phase2Instructions = {
        type: HtmlKeyboardResponsePlugin,
        stimulus: `
            <div style="max-width: 800px; margin: auto; text-align: left;">
                <h2>Phase 2: Partner Choice Task</h2>
                <p>In this phase, you will see <strong>4 new faces</strong> on each trial.</p>
                <p>Your task is to choose <strong>one person</strong> you would like to interact with.</p>
                <p><strong>Note:</strong> You will NOT receive immediate feedback after each choice.</p>
                <p>At the end of this phase, you will see your total score for Phase 2.</p>
                <p><strong>Demo:</strong> You will complete 5 trials.</p>
                <p>Press any key to start Phase 2.</p>
            </div>
        `,
        data: {
            task: 'phase2_instructions'
        }
    };
    timeline.push(phase2Instructions);

    // Phase 2 Choice trial (no feedback)
    const phase2ChoiceTrial = {
        type: ImageMultiChoicePlugin,
        images: function() {
            const trialFaces = jsPsych.evaluateTimelineVariable('faces');
            return trialFaces.map(face => ({
                src: face.imagePath,
                color: face.color,
                data: {
                    id: face.id,
                    isGood: face.isGood
                }
            }));
        },
        prompt: function() {
            return `
                <p>Choose a person you would like to interact with:</p>
                <p style="color: #666; font-size: 14px;">Trial ${phase2Count + 1} of ${DEMO_CONFIG.PHASE2_TRIALS}</p>
            `;
        },
        image_width: 200,
        image_height: 200,
        grid_columns: 2,
        gap: 20,
        data: function() {
            return {
                task: 'phase2_choice',
                phase: 2,
                trial_num: jsPsych.evaluateTimelineVariable('trialNum'),
                composition: jsPsych.evaluateTimelineVariable('composition'),
                red_count: jsPsych.evaluateTimelineVariable('redCount'),
                blue_count: jsPsych.evaluateTimelineVariable('blueCount')
            };
        },
        on_finish: function(data) {
            const trialFaces = jsPsych.evaluateTimelineVariable('faces');
            const chosenFace = trialFaces[data.response];

            // Calculate outcome (but don't show it)
            const outcome = getOutcome(chosenFace);
            phase2Score += outcome;
            phase2Count++;

            data.chosen_face_id = chosenFace.id;
            data.chosen_face_color = chosenFace.color;
            data.chosen_face_is_good = chosenFace.isGood;
            data.outcome = outcome;
            data.phase2_score = phase2Score;

            // Update progress
            const phase1Progress = 0.4;
            const phase2Progress = (phase2Count / DEMO_CONFIG.PHASE2_TRIALS) * 0.6;
            jsPsych.progressBar.progress = phase1Progress + phase2Progress;
        }
    };

    // Phase 2 timeline
    const phase2Timeline = {
        timeline: [phase2ChoiceTrial],
        timeline_variables: phase2Trials
    };
    timeline.push(phase2Timeline);

    // Phase 2 Summary
    const phase2Summary = {
        type: HtmlKeyboardResponsePlugin,
        stimulus: function() {
            return `
                <h2>Phase 2 Complete!</h2>
                <p>Your Phase 2 score: <strong>${phase2Score}</strong></p>
                <p>Press any key to continue.</p>
            `;
        },
        post_trial_gap: 500
    };
    timeline.push(phase2Summary);

    // ========================================================================
    // FINAL SUMMARY
    // ========================================================================

    const finalSummary = {
        type: HtmlKeyboardResponsePlugin,
        stimulus: function() {
            return `
                <h2>Demo Complete!</h2>
                <h3>Summary</h3>
                <p>Phase 1 score: <strong>${phase1Score}</strong> (${DEMO_CONFIG.PHASE1_TRIALS} trials)</p>
                <p>Phase 2 score: <strong>${phase2Score}</strong> (${DEMO_CONFIG.PHASE2_TRIALS} trials)</p>
                <p>Total combined score: <strong>${phase1Score + phase2Score}</strong></p>
                <hr>
                <p style="color: #666;">Code: ${urlParams.conditionCode} | Condition: ${urlParams.condition}, Majority: ${urlParams.majorityGroup}, P1 Type: ${urlParams.p1Type}, P2 Exposure: ${urlParams.p2Exposure}</p>
                <p>Press any key to view data.</p>
            `;
        },
        post_trial_gap: 500
    };
    timeline.push(finalSummary);

    // Run the experiment
    await jsPsych.run(timeline);
}