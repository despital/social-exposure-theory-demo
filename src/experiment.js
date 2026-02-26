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
import HtmlSliderResponsePlugin from "@jspsych/plugin-html-slider-response";
import ExternalHtmlPlugin from "@jspsych/plugin-external-html";
import survey from '@jspsych/plugin-survey';
import ImageMultiChoicePlugin from "./plugins/plugin-image-multi-choice.js";

// Import Firebase
import { initializeApp } from "firebase/app";
import { getDatabase, ref, set } from "firebase/database";
import { getAuth, signInAnonymously } from "firebase/auth";

// Import utilities
import { CONFIG } from "./utils/config.js";
import { generateFaces, assignGoodBad, generateTrials, getOutcome, getURLParams, generateNovelFaces, generatePhase2Trials, generatePhase3Trials } from "./utils/helpers.js";

// Import country and language data
import countries from 'i18n-iso-countries';
import en from 'i18n-iso-countries/langs/en.json';
import ISO6391 from 'iso-639-1';

// Initialize country data
countries.registerLocale(en);

/**
 * This function will be executed by jsPsych Builder and is expected to run the jsPsych experiment
 */
export async function run({ assetPaths, input = {}, environment, title, version }) {
    // Initialize jsPsych
    const jsPsych = initJsPsych({
        show_progress_bar: true,
        auto_update_progress_bar: false,
        on_finish: function() {
        }
    });

    // Get URL parameters for condition assignment
    const urlParams = getURLParams(jsPsych);

    // Check for debug mode
    const debugMode = jsPsych.data.getURLVariable('debug') === 'true';
    const sectionParam = jsPsych.data.getURLVariable('section') || 'all'; // Which section(s) to show

    // Determine which sections to include
    let sectionsToShow = debugMode && CONFIG.DEBUG_SECTIONS[sectionParam]
        ? CONFIG.DEBUG_SECTIONS[sectionParam]
        : ['consent', 'demographics', 'phase1', 'phase2', 'phase3', 'endsurvey']; // Default: show all

    // Apply debug mode skip flags
    if (debugMode) {
        if (CONFIG.DEBUG_MODE.SKIP_CONSENT) sectionsToShow = sectionsToShow.filter(s => s !== 'consent');
        if (CONFIG.DEBUG_MODE.SKIP_DEMOGRAPHICS) sectionsToShow = sectionsToShow.filter(s => s !== 'demographics');
    }

    // Helper function to check if a section should be shown
    const shouldShowSection = (section) => sectionsToShow.includes(section);

    console.log('Debug mode:', debugMode ? 'ENABLED' : 'disabled');
    if (debugMode) {
        console.log('Section:', sectionParam, '-> Showing:', sectionsToShow);
    }
    // Add experiment properties to all data
    jsPsych.data.addProperties({
        participant_id: urlParams.participantId,
        study_id: urlParams.studyId,
        session_id: urlParams.sessionId,
        condition_code: urlParams.conditionCode,
        condition: urlParams.condition,
        majority_group: urlParams.majorityGroup,
        p1_type: urlParams.p1Type,
        p2_exposure: urlParams.p2Exposure,
        debug_mode: debugMode
    });

    // Initialize Firebase (optional - disabled in development)
    let app, database, auth;
    if (!CONFIG.DISABLE_DATA_SAVING) {
        app = initializeApp(CONFIG.FIREBASE_CONFIG);
        database = getDatabase(app);
        auth = getAuth();

        // Wait for anonymous authentication to complete
        try {
            await signInAnonymously(auth);
            console.log("Firebase authentication successful");
        } catch (error) {
            console.error("Firebase authentication error:", error);
        }
    } else {
        console.log("Firebase data saving is DISABLED (development mode)");
    }

    // Generate faces and assign good/bad
    let faces = generateFaces(jsPsych, urlParams);
    faces = assignGoodBad(faces, jsPsych);

    // If debug mode, use only a subset of faces for faster testing
    if (debugMode && CONFIG.DEBUG_MODE.REDUCE_PHASE1_TRIALS) {
        const redFaces = faces.filter(f => f.color === 'red').slice(0, 10);
        const blueFaces = faces.filter(f => f.color === 'blue').slice(0, 10);
        faces = [...redFaces, ...blueFaces];
        console.log('Debug mode: Reduced to 20 faces (10 red, 10 blue)');
    }

    // Generate trials using block design
    // If debug mode, override exposures to 1 instead of 3
    const originalExposures = CONFIG.EXPOSURES_PER_FACE;
    if (debugMode && CONFIG.DEBUG_MODE.REDUCE_PHASE1_TRIALS) {
        CONFIG.EXPOSURES_PER_FACE = 1;
        console.log('Debug mode: Reduced Phase 1 to 1 exposure per face');
    }
    const trials = generateTrials(faces, jsPsych);
    CONFIG.EXPOSURES_PER_FACE = originalExposures; // Restore original value

    // Track score
    let totalScore = 0;
    let trialCount = 0;

    // Generate novel faces for Phase 2
    const novelFaces = generateNovelFaces(jsPsych);

    // Generate Phase 2 trials (single-face slider design using novel faces)
    const originalPhase2Total = CONFIG.PHASE2_TOTAL_TRIALS;
    if (debugMode && CONFIG.DEBUG_MODE.REDUCE_PHASE2_TRIALS) {
        CONFIG.PHASE2_TOTAL_TRIALS = 6; // 3 red + 3 blue in debug
        console.log('Debug mode: Reduced Phase 2 to ' + CONFIG.PHASE2_TOTAL_TRIALS + ' trials');
    }
    const phase2Trials = generatePhase2Trials(novelFaces, urlParams, jsPsych);
    CONFIG.PHASE2_TOTAL_TRIALS = originalPhase2Total; // Restore original value

    let phase2Score = 0;
    let phase2TrialCount = 0;

    console.log('Experiment initialized:', {
        conditionCode: urlParams.conditionCode,
        condition: urlParams.condition,
        majorityGroup: urlParams.majorityGroup,
        p1Type: urlParams.p1Type,
        p2Exposure: urlParams.p2Exposure,
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
                <p>Please note that you're free to leave at any point of the experiment even if you have agreed to the consent form.</p>
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
        // Generate comprehensive country and language lists
        const allCountries = [...Object.values(countries.getNames('en')).sort(), 'Prefer not to say'];
        const allLanguages = ISO6391.getAllNames().sort();

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
                                title: 'How old are you?',
                                name: 'age',
                                isRequired: true,
                                inputType: 'number',
                                min: 18,
                                max: 100
                            },
                            {
                                type: 'radiogroup',
                                title: 'How would you describe your gender identity?',
                                name: 'gender',
                                isRequired: true,
                                choices: ['Woman', 'Man', 'Non-binary', 'Prefer not to disclose']
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
                                    'Professional degree (JD, MD, etc.)',
                                    'Prefer not to disclose'
                                ]
                            },
                            {
                                type: 'rating',
                                title: 'Where would you place yourself on this scale, relative to other people in society?',
                                description: 'Please think of the following scale as representing where people stand in society. At the top are people who are best off — those who have the most money, education, and most respected jobs. At the bottom are people who are worst off — those who have the least money, education, and least respected jobs or no job.',
                                name: 'ses_ladder',
                                isRequired: true,
                                rateMin: 1,
                                rateMax: 10,
                                minRateDescription: '1 (Bottom)',
                                maxRateDescription: '10 (Top)'
                            },

                            {
                                type: 'rating',
                                title: 'How would you describe your political orientation?',
                                name: 'political_orientation',
                                isRequired: true,
                                rateMin: 1,
                                rateMax: 7,
                                minRateDescription: '1 (Very Conservative)',
                                maxRateDescription: '7 (Very Liberal)'
                            }
                        ]
                    },
                    {
                        name: 'page3',
                        elements: [
                            {
                                type: 'radiogroup',
                                title: 'What is your current employment status?',
                                name: 'occupation',
                                isRequired: true,
                                choices: [
                                    'Student',
                                    'Employed',
                                    'Self-employed',
                                    'Unemployed',
                                    'Retired',
                                    'Other / prefer not to say'
                                ]
                            },
                            {
                                type: 'dropdown',
                                title: 'What is your primary language?',
                                name: 'primary_language',
                                isRequired: true,
                                choices: allLanguages,
                                placeholder: 'Select or search for your language...'
                            },
                            {
                                type: 'radiogroup',
                                title: 'How would you rate your English proficiency?',
                                name: 'english_proficiency',
                                isRequired: true,
                                choices: [
                                    'Native speaker',
                                    'Fluent',
                                    'Proficient',
                                    'Intermediate',
                                    'Basic',
                                    'Prefer not to say'
                                ]
                            },
                            {
                                type: 'dropdown',
                                title: 'Where are you currently located?',
                                name: 'geographic_location',
                                isRequired: true,
                                choices: allCountries,
                                placeholder: 'Select or search for your country...'
                            }
                        ]
                    },
                    {
                        name: 'page4',
                        elements: [
                            {
                                type: 'radiogroup',
                                title: 'Do you wear glasses or contact lenses?',
                                name: 'vision_correction',
                                isRequired: true,
                                choices: ['Glasses', 'Contact lenses', 'None']
                            },
                            {
                                type: 'radiogroup',
                                title: 'Are you color blind or have difficulty distinguishing between red and blue?',
                                name: 'color_blind',
                                isRequired: true,
                                choices: ['Yes', 'No', 'Not sure']
                            },
                            {
                                type: 'radiogroup',
                                title: 'What type of device are you using to complete this experiment?',
                                name: 'device_type',
                                isRequired: true,
                                choices: [
                                    'Desktop computer / Laptop',
                                    'Tablet',
                                    'Smartphone',
                                    'Other'
                                ]
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
        // Instructions (differ between experimental and control)
        const instructionText = urlParams.p1Type === 'control'
            ? `<div style="max-width: 800px; margin: auto; text-align: left;">
                <h2>Instructions</h2>
                <p>In this experiment, you will see <strong>4 faces</strong> on each trial.</p>
                <p>Your task is to choose <strong>one person</strong> to interact with by clicking on their face.</p>
                <p>After your choice, the reward values for <strong>all four people</strong> will be revealed.</p>
                <p>Each person can give you either a <strong>reward (+1)</strong> or a <strong>punishment (-5)</strong>.</p>
                <p><strong>Your goal is to maximize your total score.</strong></p>
                <p>Press any key to start the experiment.</p>
            </div>`
            : `<div style="max-width: 800px; margin: auto; text-align: left;">
                <h2>Instructions</h2>
                <p>In this experiment, you will see <strong>4 faces</strong> on each trial.</p>
                <p>Your task is to choose <strong>one person</strong> to interact with by clicking on their face.</p>
                <p>After your choice, you will receive either a <strong>reward (+1)</strong> or a <strong>punishment (-5)</strong>.</p>
                <p><strong>Your goal is to maximize your total score.</strong></p>
                <p>Press any key to start the experiment.</p>
            </div>`;

        const instructions = {
        type: HtmlKeyboardResponsePlugin,
        stimulus: instructionText,
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
                <p>Choose a person to interact with by clicking on a face:</p>
            `;
        },
        image_width: 200,
        image_height: 200,
        grid_columns: 2,
        gap: 20,
        data: function() {
            const trialFaces = jsPsych.evaluateTimelineVariable('faces');
            return {
                task: 'choice',
                phase: 1,
                block: jsPsych.evaluateTimelineVariable('block'),
                trial_in_block: jsPsych.evaluateTimelineVariable('trialInBlock'),
                // Panel composition: all 4 faces shown this trial (needed for RL modeling
                // and within-trial minority proportion analyses)
                faces_in_trial: trialFaces.map(f => ({ id: f.id, color: f.color, is_good: f.isGood }))
            };
        },
        on_finish: function(data) {
            const trialFaces = jsPsych.evaluateTimelineVariable('faces');
            const chosenFace = trialFaces[data.response];
            const outcome = getOutcome(chosenFace);

            totalScore += outcome;
            trialCount++;

            data.trial_number = trialCount;  // global 1-indexed trial counter across Phase 1
            data.chosen_face_id = chosenFace.id;
            data.chosen_face_color = chosenFace.color;
            data.chosen_face_is_good = chosenFace.isGood;
            data.outcome = outcome;
            data.total_score = totalScore;
            // RT is automatically recorded by the plugin in data.rt

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
        }
    };

    // Feedback trial
    const feedbackTrial = {
        type: HtmlKeyboardResponsePlugin,
        stimulus: function() {
            const lastTrial = jsPsych.data.get().last(1).values()[0];
            const outcome = lastTrial.outcome;

            if (urlParams.p1Type === 'control') {
                // Control: show all 4 faces with their outcomes
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
                // Experimental: single outcome
                const feedbackClass = outcome > 0 ? 'positive' : 'negative';
                const feedbackText = outcome > 0 ? `+${outcome}` : outcome;
                return `
                    <div class="feedback ${feedbackClass}">
                        ${feedbackText}
                    </div>
                `;
            }
        },
        choices: "NO_KEYS",  // Disable keyboard responses
        trial_duration: 1000,  // Auto-advance after 1 second
        data: {
            task: 'feedback',
            phase: 1
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
        // Store countdown interval in outer scope to avoid scope issues
        let breakCountdownInterval = null;

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

            breakCountdownInterval = setInterval(() => {
                timeLeft--;
                if (timerElement) {
                    timerElement.textContent = timeLeft;
                }
                if (timeLeft <= 0) {
                    clearInterval(breakCountdownInterval);
                }
            }, 1000);
        },
        on_finish: function() {
            if (breakCountdownInterval) {
                clearInterval(breakCountdownInterval);
                breakCountdownInterval = null;
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
                <p>In this phase, you will see <strong>new faces</strong> one at a time.</p>
                <p>For each face, you will answer <strong>three questions</strong>:</p>
                <ol style="text-align: left; line-height: 2;">
                    <li>How willing are you to <strong>approach</strong> or <strong>avoid</strong> this person?</li>
                    <li>What is the <strong>probability</strong> that this person will give you a punishment?</li>
                    <li>How <strong>confident</strong> are you in your punishment probability estimate?</li>
                </ol>
                <p><strong>Note:</strong> You will NOT receive feedback after each rating.</p>
                <p>Press any key to start Phase 2.</p>
            </div>
        `,
        data: {
            task: 'phase2_instructions'
        }
    };
    timeline.push(phase2Instructions);

    // ========================================================================
    // PHASE 2: APPROACH-AVOIDANCE SLIDER TASK (NOVEL FACES)
    // ========================================================================

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

            // Scoring based on slider position relative to face's good/bad status:
            //   Good face: approach (>50) = correct, avoid (<50) = incorrect
            //   Bad face:  avoid (<50) = correct, approach (>50) = incorrect
            //   Exactly 50 = neutral (0 points)
            const rating = data.slider_rating;
            let outcome;
            if (rating === 50) {
                outcome = 0;
                data.correct = null; // neutral
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

            // Remove clutter fields auto-added by jsPsych
            delete data.stimulus;
            delete data.slider_start;
            delete data.plugin_version;
            delete data.response;     // duplicate of slider_rating
            delete data.trial_type;   // redundant with task
        }
    };

    // Phase 2 — punishment probability trial (same question as Phase 3)
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

    // Phase 2 — confidence trial (confidence in the punishment probability estimate)
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
            // Phase 1 ends at 0.6, Phase 2 occupies 0.6 to 0.7 (10% of total bar)
            jsPsych.progressBar.progress = 0.6 + (phase2TrialCount / phase2Trials.length) * 0.1;

            delete data.stimulus;
            delete data.slider_start;
            delete data.plugin_version;
            delete data.response;
            delete data.trial_type;
        }
    };

    // Phase 2 timeline — three questions per novel face
    const phase2Timeline = {
        timeline: [phase2SliderTrial, phase2ProbabilityTrial, phase2ConfidenceTrial],
        timeline_variables: phase2Trials
    };
    timeline.push(phase2Timeline);

        // Phase 2 Summary
        const phase2Summary = {
            type: HtmlKeyboardResponsePlugin,
            stimulus: `
                <h2>Phase 2 Complete!</h2>
                <p>Thank you for completing your ratings!</p>
                <p>Press any key to continue.</p>
            `,
            post_trial_gap: 500,
            data: {
                task: 'phase2_summary'
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
                <p>For each face, you will answer <strong>one question</strong>:</p>
                <ol style="text-align: left; line-height: 2;">
                    <li>What is the <strong>probability</strong> that this person will give you a punishment?</li>
                </ol>
                <p>The slider starts at 50%. You must move it before you can continue.</p>
                <p>There are no right or wrong answers — we're interested in your impressions.</p>
                <p>Press any key to start Phase 3.</p>
            </div>
        `,
        data: {
            task: 'phase3_instructions'
        }
    };
    timeline.push(phase3Instructions);

    // Generate Phase 3 trials (Phase 1 faces only — novel faces from Phase 2 are excluded)
    let phase3Trials = generatePhase3Trials(trials, faces, jsPsych);

    // In debug mode, reduce to 5 faces (5 trials)
    if (debugMode && CONFIG.DEBUG_MODE.REDUCE_PHASE3_TRIALS) {
        const maxFaces = 5;
        phase3Trials = phase3Trials.slice(0, maxFaces);
        console.log('Debug mode: Reduced Phase 3 to ' + phase3Trials.length + ' trials');
    }

    let phase3TrialCount = 0;

    console.log('Phase 3 initialized:', {
        totalTrials: phase3Trials.length
    });

    // Phase 3 Probability Trial
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

            // Phase 1 ends at 0.6, Phase 2 ends at 0.7, Phase 3 occupies 0.7 to 1.0 (30% of total bar)
            const phase3Progress = phase3TrialCount / phase3Trials.length;
            jsPsych.progressBar.progress = 0.7 + (phase3Progress * 0.3);
        }
    };

    // Phase 3 timeline - one probability slider trial per face
    const phase3Timeline = {
        timeline: [phase3ProbabilityTrial],
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

    // ========================================================================
    // END OF EXPERIMENT SECTION
    // ========================================================================

    if (shouldShowSection('endsurvey')) {
        // 1. Congratulations Screen
        const congratulations = {
            type: HtmlButtonResponsePlugin,
            stimulus: `
                <h1>Congratulations!</h1>
                <p>You have successfully completed the experiment.</p>
                <p>Before we finish, we have a few final questions for you.</p>
            `,
            choices: ['Continue'],
            data: {
                task: 'endsurvey_congratulations'
            }
        };
        timeline.push(congratulations);

        // 2. Debriefing Screen
        const debriefing = {
            type: HtmlButtonResponsePlugin,
            stimulus: `
                <div style="max-width: 800px; margin: auto; text-align: left;">
                    <h2>About This Study</h2>
                    <p>Thank you for your participation in this experiment!</p>
                    <p><strong>Purpose:</strong> This study investigates how people form impressions and make decisions about social partners. We are particularly interested in how exposure to different individuals affects approach-avoidance behavior and whether group membership influences these decisions.</p>
                    <p><strong>What you did:</strong></p>
                    <ul>
                        <li><strong>Phase 1:</strong> You learned which individuals tend to give rewards versus punishments through direct experience.</li>
                        <li><strong>Phase 2:</strong> You made choices about novel individuals, allowing us to see how your learning generalized.</li>
                        <li><strong>Phase 3:</strong> You estimated the probability of punishment for each face, helping us understand your explicit learning.</li>
                    </ul>
                    <p><strong>Background colors:</strong> The red and blue backgrounds represented different social groups. We varied the composition of these groups to study social learning and decision-making.</p>
                    <p>Your responses will help us better understand the psychological mechanisms underlying social interaction and group dynamics.</p>
                </div>
            `,
            choices: ['Continue'],
            data: {
                task: 'endsurvey_debriefing'
            }
        };
        timeline.push(debriefing);

        // 3. Technical Check Survey (with conditional logic)
        const technicalCheck = {
            type: survey,
            survey_json: {
                showQuestionNumbers: false,
                completeText: 'Continue',
                pages: [
                    {
                        name: 'technical_page',
                        elements: [
                            {
                                type: 'radiogroup',
                                title: 'Did all images load properly during the experiment?',
                                name: 'images_loaded',
                                isRequired: true,
                                choices: ['Yes, all images loaded', 'No, some images did not load', 'Not sure']
                            },
                            {
                                type: 'radiogroup',
                                title: 'Did you encounter any other technical difficulties during the experiment?',
                                name: 'technical_difficulties',
                                isRequired: true,
                                choices: ['Yes', 'No']
                            },
                            {
                                type: 'comment',
                                title: 'Please describe the technical difficulties you encountered:',
                                name: 'technical_difficulties_details',
                                visibleIf: '{technical_difficulties} = "Yes"',
                                isRequired: false,
                                rows: 4
                            }
                        ]
                    }
                ]
            },
            data: {
                task: 'endsurvey_technical_check'
            }
        };
        timeline.push(technicalCheck);

        // 4. User Feedback Survey
        const userFeedback = {
            type: survey,
            survey_json: {
                showQuestionNumbers: false,
                completeText: 'Continue',
                pages: [
                    {
                        name: 'feedback_page',
                        elements: [
                            {
                                type: 'rating',
                                title: 'How clear was the design of the experiment? Did you understand what you were supposed to do?',
                                name: 'clarity_rating',
                                isRequired: true,
                                rateMin: 0,
                                rateMax: 5,
                                minRateDescription: '0 (Very unclear)',
                                maxRateDescription: '5 (Very clear)'
                            },
                            {
                                // Which phase(s) was confusing? — shown whenever rating is not perfect
                                type: 'checkbox',
                                title: 'Which phase(s) did you find most confusing? (select all that apply)',
                                name: 'confusion_phase',
                                isRequired: false,
                                visibleIf: '{clarity_rating} <= 3',
                                choices: [
                                    { value: 'phase1', text: 'Phase 1 — the learning task (choosing faces, receiving reward/punishment)' },
                                    { value: 'phase2', text: 'Phase 2 — rating new faces with sliders' },
                                    { value: 'phase3', text: 'Phase 3 — estimating punishment probability for previously seen faces' },
                                    { value: 'none',   text: 'None — I understood all phases' }
                                ]
                            },
                            {
                                // Phase 1 drill-down: specific confusing aspects (multi-select + Other)
                                type: 'checkbox',
                                title: 'What specifically made Phase 1 confusing? (select all that apply)',
                                name: 'confusion_phase1_details',
                                isRequired: false,
                                visibleIf: '{confusion_phase} contains "phase1"',
                                choices: [
                                    { value: 'too_many_faces',    text: 'Too many faces to keep track of' },
                                    { value: 'group_distinction', text: 'Not enough distinction between the red and blue group members' },
                                    { value: 'goodbad_distinction', text: 'Not enough distinction between good and bad people (rewards and punishments felt too similar)' },
                                    { value: 'instructions',      text: 'The instructions were unclear' }
                                ],
                                hasOther: true,
                                otherText: 'Other (please describe)'
                            },
                            {
                                // Phase 2 / 3 open text — shown when Phase 2 or 3 was confusing
                                type: 'comment',
                                title: 'What specifically was confusing about the phase(s) you selected?',
                                name: 'confusion_other_phases',
                                isRequired: false,
                                visibleIf: '{confusion_phase} contains "phase2" or {confusion_phase} contains "phase3"',
                                rows: 3,
                                placeholder: 'Please describe what was unclear...'
                            },
                            {
                                type: 'radiogroup',
                                title: 'How would you describe the length of the experiment?',
                                name: 'length_rating',
                                isRequired: true,
                                choices: [
                                    'Much too short',
                                    'Somewhat too short',
                                    'Just right',
                                    'Somewhat too long',
                                    'Much too long'
                                ]
                            },
                            {
                                type: 'comment',
                                title: 'Do you have any suggestions for improving the experiment design?',
                                name: 'suggestions',
                                isRequired: false,
                                rows: 5,
                                placeholder: 'Please share any thoughts on how we could improve the experiment...'
                            }
                        ]
                    }
                ]
            },
            data: {
                task: 'endsurvey_user_feedback'
            }
        };
        timeline.push(userFeedback);

        // 5. Final Thank You Screen with Scores
        const finalThankYou = {
            type: HtmlButtonResponsePlugin,
            stimulus: function() {
                return `
                    <div style="max-width: 600px; margin: auto;">
                        <h1>Thank You!</h1>
                        <p>Your participation is greatly appreciated.</p>
                        <h3>Your Performance:</h3>
                        <div style="background-color: #f0f0f0; padding: 20px; border-radius: 10px; margin: 20px 0;">
                            <p style="font-size: 18px; margin: 10px 0;">Phase 1 Score: <strong>${totalScore}</strong> points</p>
                            <p style="font-size: 18px; margin: 10px 0;">Phase 2 Score: <strong>${phase2Score}</strong> points</p>
                            <p style="font-size: 22px; margin: 10px 0;">Total: <strong>${totalScore + phase2Score}</strong> points</p>
                            <p style="font-size: 22px; margin: 10px 0; color: #2e7d32;">Bonus: <strong>$${((totalScore + phase2Score) * CONFIG.POINTS_TO_DOLLARS).toFixed(2)}</strong></p>
                        </div>
                        <p>Your data will be saved in the next step.</p>
                    </div>
                `;
            },
            choices: ['Save Data'],
            data: {
                task: 'endsurvey_final_thank_you'
            }
        };
        timeline.push(finalThankYou);
    } else {
        console.log('Debug mode: Skipped end-of-experiment surveys');

        // Simplified finish screen when surveys are skipped
        const finish = {
            type: HtmlKeyboardResponsePlugin,
            stimulus: function() {
                return `
                    <h2>Experiment Complete!</h2>
                    <p>Phase 1 score: <strong>${totalScore}</strong> points</p>
                    <p>Phase 2 score: <strong>${phase2Score}</strong> points</p>
                    <p>Total: <strong>${totalScore + phase2Score}</strong> points</p>
                    <p>Bonus: <strong>$${((totalScore + phase2Score) * CONFIG.POINTS_TO_DOLLARS).toFixed(2)}</strong></p>
                    <p>Thank you for participating.</p>
                    <p>Press any key to save your data.</p>
                `;
            },
            post_trial_gap: 500
        };
        timeline.push(finish);
    }

    // Save data to Firebase (only if enabled)
    if (!CONFIG.DISABLE_DATA_SAVING && auth) {
        const saveData = {
            type: HtmlKeyboardResponsePlugin,
            stimulus: "<p>Saving data, please wait...</p>",
            trial_duration: 2000,
            choices: [],
            on_finish: function() {
                if (auth.currentUser) {
                    console.log("Authenticated user detected, preparing to save data...");

                    // Generate internal ID (fallback if Prolific ID missing)
                    const internalId = new Uint32Array(1);
                    window.crypto.getRandomValues(internalId);

                    // Use Prolific ID if available, otherwise use internal ID
                    const participantKey = urlParams.participantId || `internal_${internalId[0]}`;

                    // Get all trial data
                    const allData = jsPsych.data.get().values();

                    // Separate data by task type
                    const phase1Data = allData.filter(d => d.phase === 1);
                    const phase2Data = allData.filter(d => d.phase === 2);
                    const phase3Data = allData.filter(d => d.phase === 3);
                    const demographicsData = allData.find(d => d.task === 'demographics');
                    const technicalCheckData = allData.find(d => d.task === 'endsurvey_technical_check');
                    const userFeedbackData = allData.find(d => d.task === 'endsurvey_user_feedback');

                    // Build structured data object
                    const structuredData = {
                        metadata: {
                            internal_id: `internal_${internalId[0]}`,
                            prolific_pid: urlParams.participantId || null,
                            study_id: urlParams.studyId || null,
                            session_id: urlParams.sessionId || null,
                            condition_code: urlParams.conditionCode,
                            condition: urlParams.condition,
                            majority_group: urlParams.majorityGroup,
                            p1_type: urlParams.p1Type,
                            p2_exposure: urlParams.p2Exposure,
                            pilot_mode: CONFIG.PILOT_MODE,
                            timestamp: new Date().toISOString(),
                            date_readable: new Date().toLocaleString(),
                            debug_mode: debugMode
                        },
                        demographics: demographicsData ? demographicsData.response : null,
                        summary: {
                            phase1_score: totalScore,
                            phase2_score: phase2Score,
                            total_score: totalScore + phase2Score,
                            phase1_trials_count: phase1Data.length,
                            phase2_trials_count: phase2Data.length,
                            phase3_trials_count: phase3Data.length
                        },
                        trials: {
                            phase1: phase1Data,
                            phase2: phase2Data,
                            phase3: phase3Data
                        },
                        surveys: {
                            technical_check: technicalCheckData ? technicalCheckData.response : null,
                            user_feedback: userFeedbackData ? userFeedbackData.response : null
                        }
                    };

                    // Save to Firebase with participant ID as key
                    const dbpath = `participants/${participantKey}`;

                    set(ref(database, dbpath), structuredData)
                        .then(() => {
                            console.log('✅ Data saved successfully to Firebase:', dbpath);
                        })
                        .catch((error) => {
                            console.error('❌ Error saving data to Firebase:', error);
                            alert('Error saving data: ' + error.message);
                        });
                } else {
                    console.error('❌ Cannot save data: User not authenticated');
                    alert('Error: Not authenticated. Data could not be saved.');
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

    // Auto-click mechanism for debug testing
    // Activates via ?debug=true&autoclick=true or CONFIG.DEBUG_MODE.ENABLE_AUTOCLICK
    // Automatically clicks through trials by detecting clickable elements in the DOM
    const autoclickParam = jsPsych.data.getURLVariable('autoclick') === 'true';
    if (debugMode && (autoclickParam || CONFIG.DEBUG_MODE.ENABLE_AUTOCLICK)) {
        const AUTOCLICK_DELAY = 100; // ms before auto-clicking each trial
        let autoclickPending = false;

        const observer = new MutationObserver(() => {
            if (autoclickPending) return;
            autoclickPending = true;

            setTimeout(() => {
                autoclickPending = false;

                // Custom plugin: click a face option
                const imageChoice = document.querySelector('.image-multi-choice-option');
                if (imageChoice) { imageChoice.click(); return; }

                // Button response plugin: click a button
                const button = document.querySelector('.jspsych-btn');
                if (button) { button.click(); return; }

                // Keyboard response plugin: dispatch a keypress
                const keyboardStimulus = document.querySelector('#jspsych-html-keyboard-response-stimulus');
                if (keyboardStimulus) {
                    document.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }));
                    document.dispatchEvent(new KeyboardEvent('keyup', { key: ' ', bubbles: true }));
                }
            }, AUTOCLICK_DELAY);
        });

        observer.observe(document.body, { childList: true, subtree: true });
        console.log('Debug mode: Auto-click ENABLED (delay: ' + AUTOCLICK_DELAY + 'ms)');
    }

    // Run the experiment
    await jsPsych.run(timeline);
}