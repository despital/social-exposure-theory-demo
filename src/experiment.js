/**
 * @title Social Exposure Theory Experiment
 * @description Phase 1: Testing approach-avoidance behavior towards in-group vs. out-group members
 * @version 1.0.0
 */

// Import styles
import "./styles/main.scss";
import "jspsych/css/jspsych.css";

// Import jsPsych and plugins
import { initJsPsych } from "jspsych";
import HtmlKeyboardResponsePlugin from "@jspsych/plugin-html-keyboard-response";
import ImageMultiChoicePlugin from "./plugins/plugin-image-multi-choice.js";

// Import Firebase
import { initializeApp } from "firebase/app";
import { getDatabase, ref, set } from "firebase/database";
import { getAuth, signInAnonymously } from "firebase/auth";

// Import utilities
import { CONFIG } from "./utils/config.js";
import { generateFaces, assignGoodBad, generateTrials, getOutcome, getURLParams } from "./utils/helpers.js";

/**
 * This function will be executed by jsPsych Builder and is expected to run the jsPsych experiment
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

    // Add experiment properties to all data
    jsPsych.data.addProperties({
        participant_id: urlParams.participantId,
        study_id: urlParams.studyId,
        session_id: urlParams.sessionId,
        condition: urlParams.condition,
        majority_group: urlParams.majorityGroup,
        informed: urlParams.informed
    });

    // Initialize Firebase (optional - disabled in development)
    let app, database, auth;
    if (!CONFIG.DISABLE_DATA_SAVING) {
        app = initializeApp(CONFIG.FIREBASE_CONFIG);
        database = getDatabase(app);
        auth = getAuth();

        signInAnonymously(auth).catch((error) => {
            console.error("Firebase authentication error:", error);
        });
    } else {
        console.log("Firebase data saving is DISABLED (development mode)");
    }

    // Generate faces and assign good/bad
    let faces = generateFaces();
    faces = assignGoodBad(faces, jsPsych);

    // Generate trials using block design
    const trials = generateTrials(faces, urlParams, jsPsych);

    // Track score
    let totalScore = 0;
    let trialCount = 0;

    console.log('Experiment initialized:', {
        condition: urlParams.condition,
        majorityGroup: urlParams.majorityGroup,
        informed: urlParams.informed,
        participantId: urlParams.participantId,
        totalTrials: trials.length
    });

    // ========================================================================
    // TIMELINE
    // ========================================================================

    const timeline = [];

    // Welcome screen
    const welcome = {
        type: HtmlKeyboardResponsePlugin,
        stimulus: `
            <h1>Welcome to the Social Exposure Theory Experiment</h1>
            <p>Press any key to begin.</p>
        `
    };
    timeline.push(welcome);

    // Instructions
    const instructions = {
        type: HtmlKeyboardResponsePlugin,
        stimulus: function() {
            let text = `
                <div style="max-width: 800px; margin: auto; text-align: left;">
                    <h2>Instructions</h2>
                    <p>In this experiment, you will see <strong>4 faces</strong> on each trial.</p>
                    <p>Your task is to choose <strong>one person</strong> to interact with by clicking on their face.</p>
                    <p>After your choice, you will receive either a <strong>reward (+1)</strong> or a <strong>punishment (-5)</strong>.</p>
                    <p><strong>Your goal is to maximize your total score.</strong></p>
            `;

            if (urlParams.informed) {
                text += `
                    <p><strong>Important information:</strong> The faces have colored backgrounds (red or blue).
                    Both groups have similar proportions of people who tend to give rewards vs punishments.</p>
                `;
            }

            text += `
                    <p>Press any key to start the experiment.</p>
                </div>
            `;
            return text;
        },
        on_start: function() {
            jsPsych.progressBar.progress = 0;
        }
    };
    timeline.push(instructions);

    // Choice trial using custom plugin
    const choiceTrial = {
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
                <div class="score-display">Score: ${totalScore}</div>
                <h3>Trial ${trialCount + 1} of ${trials.length}</h3>
                <p>Choose a person to interact with by clicking on a face:</p>
            `;
        },
        image_width: 200,
        image_height: 200,
        grid_columns: 2,
        gap: 20,
        data: function() {
            return {
                task: 'choice',
                block: jsPsych.evaluateTimelineVariable('block'),
                trial_in_block: jsPsych.evaluateTimelineVariable('trialInBlock')
            };
        },
        on_finish: function(data) {
            const trialFaces = jsPsych.evaluateTimelineVariable('faces');
            const chosenFace = trialFaces[data.response];
            const outcome = getOutcome(chosenFace);

            totalScore += outcome;
            trialCount++;

            data.chosen_face_id = chosenFace.id;
            data.chosen_face_color = chosenFace.color;
            data.chosen_face_is_good = chosenFace.isGood;
            data.outcome = outcome;
            data.total_score = totalScore;
            // RT is automatically recorded by the plugin in data.rt
        }
    };

    // Feedback trial
    const feedbackTrial = {
        type: HtmlKeyboardResponsePlugin,
        stimulus: function() {
            const lastTrial = jsPsych.data.get().last(1).values()[0];
            const outcome = lastTrial.outcome;
            const feedbackClass = outcome > 0 ? 'positive' : 'negative';
            const feedbackText = outcome > 0 ? `+${outcome}` : outcome;

            return `
                <div class="score-display">Score: ${totalScore}</div>
                <div class="feedback ${feedbackClass}">
                    ${feedbackText}
                </div>
                <p>Press any key to continue</p>
            `;
        },
        trial_duration: 1500,
        data: {
            task: 'feedback'
        },
        on_finish: function() {
            const progress = trialCount / trials.length;
            jsPsych.progressBar.progress = progress;
        }
    };

    // Main experiment procedure
    const trialProcedure = {
        timeline: [choiceTrial, feedbackTrial],
        timeline_variables: trials
    };
    timeline.push(trialProcedure);

    // End of experiment
    const finish = {
        type: HtmlKeyboardResponsePlugin,
        stimulus: function() {
            return `
                <h2>Experiment Complete!</h2>
                <p>Your final score: <strong>${totalScore}</strong></p>
                <p>Thank you for participating.</p>
                <p>Press any key to save your data.</p>
            `;
        },
        post_trial_gap: 500
    };
    timeline.push(finish);

    // Save data to Firebase (only if enabled)
    if (!CONFIG.DISABLE_DATA_SAVING && auth) {
        const saveData = {
            type: HtmlKeyboardResponsePlugin,
            stimulus: "<p>Saving data, please wait...</p>",
            trial_duration: 2000,
            choices: [],
            on_finish: function() {
                if (auth.currentUser) {
                    const tmp = new Uint32Array(1);
                    window.crypto.getRandomValues(tmp);
                    const dbpath = auth.currentUser.uid + '/' + tmp[0];

                    set(ref(database, dbpath), {
                        data: jsPsych.data.get().values(),
                        study: 'social_exposure_theory_phase1',
                        date: Date()
                    });
                }
            }
        };
        timeline.push(saveData);
    }

    // Goodbye
    const endExperiment = {
        type: HtmlKeyboardResponsePlugin,
        stimulus: "<p>Data saved. Thank you for your participation!</p>",
        trial_duration: 2000,
        choices: []
    };
    timeline.push(endExperiment);

    // Run the experiment
    await jsPsych.run(timeline);
}