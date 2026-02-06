/**
 * @title Social Exposure Theory Experiment
 * @description This experiment investigates how individuals make social choices based on exposure to different groups.
 * @version 1.0.0
 */

// Import styles
import "./styles/main.scss";
import "jspsych/css/jspsych.css";
import "@jspsych/plugin-survey/css/survey.css";

// Import jsPsych and plugins
import { initJsPsych } from "jspsych";
import HtmlKeyboardResponsePlugin from "@jspsych/plugin-html-keyboard-response";
import HtmlButtonResponsePlugin from "@jspsych/plugin-html-button-response";
import ExternalHtmlPlugin from "@jspsych/plugin-external-html";
import survey from '@jspsych/plugin-survey';
import ImageMultiChoicePlugin from "./plugins/plugin-image-multi-choice.js";

// Import Firebase
import { initializeApp } from "firebase/app";
import { getDatabase, ref, set } from "firebase/database";
import { getAuth, signInAnonymously } from "firebase/auth";

// Import utilities
import { CONFIG } from "./utils/config.js";
import { generateFaces, assignGoodBad, generateTrials, getOutcome, getURLParams, generatePhase2Trials, generatePhase3Trials } from "./utils/helpers.js";

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

    // Check for debug mode
    const debugMode = jsPsych.data.getURLVariable('debug') === 'true';
    const simulateMode = jsPsych.data.getURLVariable('simulate'); // 'data', 'visual', or null
    const sectionParam = jsPsych.data.getURLVariable('section') || 'all'; // Which section(s) to show

    // Determine which sections to include
    const sectionsToShow = debugMode && CONFIG.DEBUG_SECTIONS[sectionParam]
        ? CONFIG.DEBUG_SECTIONS[sectionParam]
        : ['consent', 'demographics', 'phase1', 'phase2', 'phase3']; // Default: show all

    // Helper function to check if a section should be shown
    const shouldShowSection = (section) => sectionsToShow.includes(section);

    console.log('Debug mode:', debugMode ? 'ENABLED' : 'disabled');
    if (debugMode) {
        console.log('Section:', sectionParam, '-> Showing:', sectionsToShow);
    }
    if (simulateMode) {
        console.log('Simulation mode:', simulateMode);
    }

    // Add experiment properties to all data
    jsPsych.data.addProperties({
        participant_id: urlParams.participantId,
        study_id: urlParams.studyId,
        session_id: urlParams.sessionId,
        condition: urlParams.condition,
        majority_group: urlParams.majorityGroup,
        informed: urlParams.informed,
        debug_mode: debugMode
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
    // If debug mode, override exposures to 1 instead of 3
    const originalExposures = CONFIG.EXPOSURES_PER_FACE;
    if (debugMode && CONFIG.DEBUG_MODE.REDUCE_PHASE1_TRIALS) {
        CONFIG.EXPOSURES_PER_FACE = 1;
        console.log('Debug mode: Reduced Phase 1 to 1 exposure per face');
    }
    const trials = generateTrials(faces, urlParams, jsPsych);
    CONFIG.EXPOSURES_PER_FACE = originalExposures; // Restore original value

    // Track score
    let totalScore = 0;
    let trialCount = 0;

    // Generate Phase 2 trials (needed even if Phase 2 is skipped, for Phase 3)
    const originalPhase2Trials = CONFIG.PHASE2_TRIALS_PER_COMPOSITION;
    if (debugMode && CONFIG.DEBUG_MODE.REDUCE_PHASE2_TRIALS) {
        CONFIG.PHASE2_TRIALS_PER_COMPOSITION = 1;
        console.log('Debug mode: Reduced Phase 2 to 1 trial per composition');
    }
    const phase2Trials = generatePhase2Trials(faces, jsPsych);
    CONFIG.PHASE2_TRIALS_PER_COMPOSITION = originalPhase2Trials; // Restore original value

    let phase2Score = 0;
    let phase2TrialCount = 0;

    console.log('Experiment initialized:', {
        condition: urlParams.condition,
        majorityGroup: urlParams.majorityGroup,
        informed: urlParams.informed,
        participantId: urlParams.participantId,
        phase1Trials: trials.length,
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
            <h1>Welcome to the Social Exposure Theory Experiment</h1>
            <p>Press any key to begin.</p>
        `
    };
    timeline.push(welcome);

    // ========================================================================
    // CONSENT FORM
    // ========================================================================

    if (shouldShowSection('consent')) {
        // Consent intro
        const consentIntro = {
            type: HtmlButtonResponsePlugin,
            stimulus: `
                <h2>Informed Consent</h2>
                <p>Before we begin, please read and agree to the informed consent form.</p>
                <p>This study involves viewing faces and making decisions about who to interact with.</p>
                <p>The experiment will take approximately 20-25 minutes.</p>
            `,
            choices: ['View Consent Form'],
            data: {
                task: 'consent_intro'
            }
        };
        timeline.push(consentIntro);

        // Consent form with validation
        function checkConsent() {
            if (document.getElementById('consent_checkbox').checked) {
                return true;
            } else {
                alert("Please check the box to indicate that you consent to participate.");
                return false;
            }
        }

        const consentForm = {
            type: ExternalHtmlPlugin,
            url: 'assets/informed_consent/consent_form.html',
            cont_btn: 'start',
            check_fn: checkConsent,
            data: {
                task: 'consent_form'
            }
        };
        timeline.push(consentForm);
    } else {
        console.log('Debug mode: Skipped consent form');
    }

    // ========================================================================
    // DEMOGRAPHICS SURVEY
    // ========================================================================

    if (shouldShowSection('demographics')) {
        const demographicsIntro = {
            type: HtmlButtonResponsePlugin,
            stimulus: `
                <h2>Background Information</h2>
                <p>Before starting the main experiment, we'd like to collect some background information.</p>
                <p>This will take about 2-3 minutes.</p>
            `,
            choices: ['Continue'],
            data: {
                task: 'demographics_intro'
            }
        };
        timeline.push(demographicsIntro);

        // Demographics survey - Single multi-page survey
        const demographicsSurvey = {
            type: survey,
            survey_json: {
                showQuestionNumbers: true,
                completeText: 'Continue to Experiment',
                pageNextText: 'Next',
                pagePrevText: 'Back',
                pages: [
                    {
                        name: 'page1',
                        elements: [
                            {
                                type: 'text',
                                title: 'What is your age?',
                                name: 'age',
                                isRequired: true,
                                inputType: 'number',
                                min: 18,
                                max: 100
                            },
                            {
                                type: 'radiogroup',
                                title: 'What is your gender?',
                                name: 'gender',
                                isRequired: true,
                                choices: ['Female', 'Male', 'Non-binary', 'Prefer not to disclose']
                            },
                            {
                                type: 'checkbox',
                                title: 'What is your race/ethnicity? (Select all that apply)',
                                name: 'ethnicity',
                                isRequired: true,
                                choices: [
                                    'American Indian or Alaska Native',
                                    'Asian',
                                    'Black or African American',
                                    'Hispanic or Latino',
                                    'Native Hawaiian or Pacific Islander',
                                    'White',
                                    'Other',
                                    'Prefer not to disclose'
                                ]
                            }
                        ]
                    },
                    {
                        name: 'page2',
                        elements: [
                            {
                                type: 'radiogroup',
                                title: 'What is your highest level of education?',
                                name: 'education',
                                isRequired: true,
                                choices: [
                                    'Less than high school',
                                    'High school graduate',
                                    'Some college',
                                    'Associate degree',
                                    "Bachelor's degree",
                                    "Master's degree",
                                    'Doctoral degree',
                                    'Professional degree (JD, MD, etc.)'
                                ]
                            },
                            {
                                type: 'rating',
                                title: 'Please rate your socioeconomic status on the scale below:',
                                name: 'ses_ladder',
                                isRequired: true,
                                rateMin: 1,
                                rateMax: 10,
                                minRateDescription: '1 (Lowest)',
                                maxRateDescription: '10 (Highest)'
                            },

                            {
                                type: 'rating',
                                title: 'Political orientation:',
                                name: 'political_orientation',
                                isRequired: true,
                                rateMin: 1,
                                rateMax: 7,
                                minRateDescription: '1 (Very Liberal)',
                                maxRateDescription: '7 (Very Conservative)'
                            }
                        ]
                    },
                    {
                        name: 'page3',
                        elements: [
                            {
                                type: 'radiogroup',
                                title: 'Do you wear glasses or contact lenses?',
                                name: 'vision_correction',
                                isRequired: true,
                                choices: ['Glasses', 'Contact lenses', 'Both', 'None']
                            },
                            {
                                type: 'radiogroup',
                                title: 'Are you color blind or have difficulty distinguishing between red and blue?',
                                name: 'color_blind',
                                isRequired: true,
                                choices: ['Yes', 'No', 'Not sure']
                            }
                        ]
                    }
                ]
            },
            data: {
                task: 'demographics'
            }
        };
        timeline.push(demographicsSurvey);
    } else {
        console.log('Debug mode: Skipped demographics survey');
    }

    // ========================================================================
    // PHASE 1: MAIN EXPERIMENT INSTRUCTIONS
    // ========================================================================

    if (shouldShowSection('phase1')) {
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
            // Phase 1 takes up 60% of the progress bar (0.0 to 0.6)
            const progress = (trialCount / trials.length) * 0.6;
            jsPsych.progressBar.progress = progress;
        }
    };

    // Main experiment procedure
    const trialProcedure = {
        timeline: [choiceTrial, feedbackTrial],
        timeline_variables: trials
    };
    timeline.push(trialProcedure);

        // ========================================================================
        // PHASE 1 COMPLETE - TRANSITION TO PHASE 2
        // ========================================================================

        const phase1Complete = {
            type: HtmlKeyboardResponsePlugin,
            stimulus: function() {
                return `
                    <h2>Phase 1 Complete!</h2>
                    <p>Your Phase 1 score: <strong>${totalScore}</strong></p>
                    <p>Great job! You've finished the first part of the experiment.</p>
                    <p>Press any key to continue.</p>
                `;
            },
            post_trial_gap: 500,
            data: {
                task: 'phase1_complete',
                phase1_score: totalScore
            }
        };
        timeline.push(phase1Complete);
    } else {
        console.log('Debug mode: Skipped Phase 1');
    }

    // Big break before Phase 2
    if (shouldShowSection('phase2')) {
        const phase2BreakScreen = {
        type: HtmlKeyboardResponsePlugin,
        stimulus: function() {
            return `
                <div id="break-container">
                    <h2>Break Time!</h2>
                    <p>You've completed Phase 1 of the experiment.</p>
                    <p>Please take a break before continuing to Phase 2.</p>
                    <p>The experiment will continue in:</p>
                    <div id="countdown-timer" style="font-size: 48px; font-weight: bold; margin: 30px 0;">60</div>
                    <p style="color: #666;">Or press the <strong>spacebar</strong> to continue immediately</p>
                </div>
            `;
        },
        choices: [' '],
        trial_duration: 60000,
        on_load: function() {
            let timeLeft = 60;
            const timerElement = document.getElementById('countdown-timer');

            const countdown = setInterval(() => {
                timeLeft--;
                if (timerElement) {
                    timerElement.textContent = timeLeft;
                }
                if (timeLeft <= 0) {
                    clearInterval(countdown);
                }
            }, 1000);

            this.countdownInterval = countdown;
        },
        on_finish: function() {
            if (this.countdownInterval) {
                clearInterval(this.countdownInterval);
            }
        },
        data: {
            task: 'phase2_break'
        }
    };
    timeline.push(phase2BreakScreen);

    // Phase 2 Instructions
    const phase2Instructions = {
        type: HtmlKeyboardResponsePlugin,
        stimulus: `
            <div style="max-width: 800px; margin: auto; text-align: left;">
                <h2>Phase 2 Instructions</h2>
                <p>In this phase, you will see <strong>4 new faces</strong> on each trial.</p>
                <p>Your task is to choose <strong>one person</strong> you would like to interact with by clicking on their face.</p>
                <p><strong>Note:</strong> You will NOT receive immediate feedback after each choice.</p>
                <p>At the end of this phase, you will see your total score for Phase 2.</p>
                <p>Press any key to start Phase 2.</p>
            </div>
        `,
        data: {
            task: 'phase2_instructions'
        }
    };
    timeline.push(phase2Instructions);

    // ========================================================================
    // PHASE 2: PARTNER CHOICE TASK
    // ========================================================================

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
        prompt: `<p>Choose a person you would like to interact with:</p>`,
        image_width: 200,
        image_height: 200,
        grid_columns: 2,
        gap: 20,
        data: function() {
            return {
                task: 'phase2_choice',
                phase: 2,
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
            phase2TrialCount++;

            data.chosen_face_id = chosenFace.id;
            data.chosen_face_color = chosenFace.color;
            data.chosen_face_is_good = chosenFace.isGood;
            data.outcome = outcome;
            data.phase2_score = phase2Score;

            // Update progress bar
            // Phase 1 ends at 0.6, Phase 2 occupies 0.6 to 0.7 (10% of total bar)
            const phase2Progress = phase2TrialCount / phase2Trials.length;
            jsPsych.progressBar.progress = 0.6 + (phase2Progress * 0.1);
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
                    <p>Your total combined score: <strong>${totalScore + phase2Score}</strong></p>
                    <p>Thank you for completing both phases!</p>
                    <p>Press any key to continue.</p>
                `;
            },
            post_trial_gap: 500,
            data: {
                task: 'phase2_summary',
                phase2_score: phase2Score,
                total_combined_score: totalScore + phase2Score
            }
        };
        timeline.push(phase2Summary);
    } else {
        console.log('Debug mode: Skipped Phase 2');
    }

    // ========================================================================
    // PHASE 3: POST-TASK RATING
    // ========================================================================

    if (shouldShowSection('phase3')) {
        // Phase 3 Instructions
        const phase3Instructions = {
        type: HtmlKeyboardResponsePlugin,
        stimulus: `
            <div style="max-width: 800px; margin: auto; text-align: left;">
                <h2>Phase 3 Instructions</h2>
                <p>In this final phase, we will show you the faces you encountered during the experiment.</p>
                <p>For each face, we will ask you two questions:</p>
                <ol>
                    <li>Whether you think this person is <strong>good</strong> or <strong>bad</strong></li>
                    <li>How <strong>confident</strong> you are in your judgment</li>
                </ol>
                <p>There are no right or wrong answers - we're interested in your impressions.</p>
                <p>Press any key to start Phase 3.</p>
            </div>
        `,
        data: {
            task: 'phase3_instructions'
        }
    };
    timeline.push(phase3Instructions);

    // Generate Phase 3 trials
    const phase3Trials = generatePhase3Trials(trials, phase2Trials, faces, jsPsych);
    let phase3TrialCount = 0;

    console.log('Phase 3 initialized:', {
        totalTrials: phase3Trials.length,
        uniqueFaces: phase3Trials.length / 2
    });

    // Store the last good/bad response for use in confidence trial
    let lastGoodBadResponse = null;

    // Phase 3 Good/Bad Trial
    const phase3GoodBadTrial = {
        type: HtmlButtonResponsePlugin,
        stimulus: function() {
            const face = jsPsych.evaluateTimelineVariable('face');
            return `
                <div style="text-align: center;">
                    <img src="${face.imagePath}"
                         style="width: 300px; height: 300px; border: 10px solid ${face.color}; border-radius: 10px; margin-bottom: 30px;">
                    <h3 style="margin-top: 20px;">Do you think this person is good or bad?</h3>
                </div>
            `;
        },
        choices: ['Bad', 'Good'],
        button_html: (choice) => `<button class="jspsych-btn" style="font-size: 18px; padding: 15px 40px; margin: 10px;">${choice}</button>`,
        data: function() {
            return {
                task: 'phase3_goodbad',
                phase: 3,
                face_id: jsPsych.evaluateTimelineVariable('face').id,
                face_color: jsPsych.evaluateTimelineVariable('face').color,
                face_is_good: jsPsych.evaluateTimelineVariable('face').isGood
            };
        },
        on_finish: function(data) {
            // Store response (0 = Bad, 1 = Good)
            data.rating = data.response === 0 ? 'bad' : 'good';
            lastGoodBadResponse = data.rating;

            phase3TrialCount++;

            // Update progress bar
            // Phase 1 ends at 0.6, Phase 2 ends at 0.7, Phase 3 occupies 0.7 to 1.0 (30% of total bar)
            const phase3Progress = phase3TrialCount / phase3Trials.length;
            jsPsych.progressBar.progress = 0.7 + (phase3Progress * 0.3);
        }
    };

    // Phase 3 Confidence Trial
    const phase3ConfidenceTrial = {
        type: HtmlButtonResponsePlugin,
        stimulus: function() {
            const face = jsPsych.evaluateTimelineVariable('face');
            return `
                <div style="text-align: center;">
                    <img src="${face.imagePath}"
                         style="width: 300px; height: 300px; border: 10px solid ${face.color}; border-radius: 10px; margin-bottom: 30px;">
                    <h3 style="margin-top: 20px;">How confident are you that your choice is correct?</h3>
                </div>
            `;
        },
        choices: [
            'Very unconfident',
            'Unconfident',
            'Slightly unconfident',
            'Slightly confident',
            'Confident',
            'Very confident'
        ],
        button_html: (choice) => `<button class="jspsych-btn" style="font-size: 16px; padding: 12px 20px; margin: 5px; min-width: 180px;">${choice}</button>`,
        data: function() {
            return {
                task: 'phase3_confidence',
                phase: 3,
                face_id: jsPsych.evaluateTimelineVariable('face').id,
                face_color: jsPsych.evaluateTimelineVariable('face').color,
                face_is_good: jsPsych.evaluateTimelineVariable('face').isGood,
                previous_goodbad_rating: lastGoodBadResponse
            };
        },
        on_finish: function(data) {
            // Store confidence level (0-5 maps to 1-6)
            data.confidence_level = data.response + 1;
            data.confidence_label = [
                'Very unconfident',
                'Unconfident',
                'Slightly unconfident',
                'Slightly confident',
                'Confident',
                'Very confident'
            ][data.response];

            phase3TrialCount++;

            // Update progress bar
            // Phase 1 ends at 0.6, Phase 2 ends at 0.7, Phase 3 occupies 0.7 to 1.0 (30% of total bar)
            const phase3Progress = phase3TrialCount / phase3Trials.length;
            jsPsych.progressBar.progress = 0.7 + (phase3Progress * 0.3);
        }
    };

    // Phase 3 timeline - conditional rendering based on trial type
    const phase3Timeline = {
        timeline: [
            {
                timeline: [phase3GoodBadTrial],
                conditional_function: function() {
                    return jsPsych.evaluateTimelineVariable('trialType') === 'goodbad';
                }
            },
            {
                timeline: [phase3ConfidenceTrial],
                conditional_function: function() {
                    return jsPsych.evaluateTimelineVariable('trialType') === 'confidence';
                }
            }
        ],
        timeline_variables: phase3Trials
    };
    timeline.push(phase3Timeline);

        // Phase 3 Complete
        const phase3Complete = {
            type: HtmlKeyboardResponsePlugin,
            stimulus: `
                <h2>Phase 3 Complete!</h2>
                <p>Thank you for providing your ratings.</p>
                <p>You have completed all phases of the experiment.</p>
                <p>Press any key to continue.</p>
            `,
            post_trial_gap: 500,
            data: {
                task: 'phase3_complete'
            }
        };
        timeline.push(phase3Complete);
    } else {
        console.log('Debug mode: Skipped Phase 3');
    }

    // ========================================================================
    // END OF EXPERIMENT
    // ========================================================================

    const finish = {
        type: HtmlKeyboardResponsePlugin,
        stimulus: function() {
            return `
                <h2>Experiment Complete!</h2>
                <p>Phase 1 score: <strong>${totalScore}</strong></p>
                <p>Phase 2 score: <strong>${phase2Score}</strong></p>
                <p>Total combined score: <strong>${totalScore + phase2Score}</strong></p>
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
    // Support simulation mode for development testing
    if (simulateMode) {
        // Use jsPsych.simulate() for automated testing
        // Mode can be 'data-only' (default) or 'visual'
        const mode = simulateMode === 'visual' ? 'visual' : 'data-only';
        console.log(`Running in SIMULATION mode: ${mode}`);
        await jsPsych.simulate(timeline, mode);
    } else if (debugMode && CONFIG.DEBUG_MODE.ENABLE_SIMULATION) {
        // Auto-enable visual simulation if configured
        console.log('Debug mode: Auto-enabling visual simulation');
        await jsPsych.simulate(timeline, 'visual');
    } else {
        // Normal experiment execution
        await jsPsych.run(timeline);
    }
}