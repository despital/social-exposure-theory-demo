/**
 * @title bridge_rating_experiment
 * @description This experiment shows the participants a series of bridge images and asks several questions.
 * @version 1.0.0
 *
 * @assets assets/informed_consent,assets/rating_stimuli
 */

// You can import stylesheets (.scss or .css).
import "../styles/main.scss";
import '@jspsych/plugin-survey/css/survey.css'
import FullscreenPlugin from "@jspsych/plugin-fullscreen";
import HtmlKeyboardResponsePlugin from "@jspsych/plugin-html-keyboard-response";
import htmlButtonResponse from '@jspsych/plugin-html-button-response';
import imageButtonResponse from '@jspsych/plugin-image-button-response';
import survey from '@jspsych/plugin-survey';
import surveyText from '@jspsych/plugin-survey-text';
import ExternalHtmlPlugin from "@jspsych/plugin-external-html";
import PreloadPlugin from "@jspsych/plugin-preload";
import { initJsPsych } from "jspsych";
import { sample_a1, sample_a2, sample_b1, sample_b2, sample_c1, sample_c2, sample_d1, sample_d2, sample_e1, sample_e2 } from "../image_array.js";
import { initializeApp } from "firebase/app";
import { getDatabase, ref, set } from "firebase/database";
import { getAuth, signInAnonymously } from "firebase/auth";

/**
 * This function will be executed by jsPsych Builder and is expected to run the jsPsych experiment
 *
 * @type {import("jspsych-builder").RunFunction}
 */
export async function run({ assetPaths, input = {}, environment, title, version }) {
    const jsPsych = initJsPsych({
        minimum_valid_rt: 100,
        show_progress_bar: true,
        auto_update_progress_bar: false,
        on_finish: function () {
            window.location = "https://app.prolific.co/submissions/complete?cc=C4UR5YXC"
        }
    }
    );

    // capture info from Prolific
    var subject_id = jsPsych.data.getURLVariable('PROLIFIC_PID');
    var study_id = jsPsych.data.getURLVariable('STUDY_ID');
    var session_id = jsPsych.data.getURLVariable('SESSION_ID');

    jsPsych.data.addProperties({
        subject_id: subject_id,
        study_id: study_id,
        session_id: session_id
    });


    const timeline = [];
    // Firebase database init
    const firebaseConfig = {
        apiKey: "AIzaSyDRiXU9n0kSDKaRoMcp02_W4sfd-xrjADQ",
        authDomain: "bwlabsummer2022bridgerating.firebaseapp.com",
        databaseURL: "https://bwlabsummer2022bridgerating-default-rtdb.firebaseio.com",
        projectId: "bwlabsummer2022bridgerating",
        storageBucket: "bwlabsummer2022bridgerating.appspot.com",
        messagingSenderId: "357648218957",
        appId: "1:357648218957:web:1d91c083af04f494dc5504",
        measurementId: "G-79YVWTZZEZ"
    };


    // Initialize Firebase
    const app = initializeApp(firebaseConfig);
    const database = getDatabase(app);
    // login anonymous user
    const auth = getAuth();
    signInAnonymously(auth)
        .catch((error) => {
            const errorCode = error.code;
            const errorMessage = error.message;
        });


    // Welcome screen
    timeline.push({
        type: HtmlKeyboardResponsePlugin,
        stimulus: `
      <p>Welcome to the experiment!<p/>
      <p>You can now press any key to proceed.</p>
    `,

    });

    // Switch to fullscreen
    timeline.push({
        type: FullscreenPlugin,
        fullscreen_mode: true,
    });

    // Consent check
    var consent_screen = {
        type: htmlButtonResponse,
        stimulus: `
    <p>Before the experiment starts, we would like to have your consent.</p> 
    <p>Clicking the button below will direct you to the consent form.<p/>
    <p>Please read the consent form carefully and click <b>"I agree"</b> at the bottom of the form</p>
    <p>if you do decide to participate in this study.</p>
  
  ` ,
        choices: ['Consent form'],
    };


    var check_consent = function (elem) {
        if (document.getElementById('consent_checkbox').checked) {
            return true;
        }
        else {
            alert("If you wish to participate, you must check the box next to the statement 'I agree to participate in this study.'");
            return false;
        }
        return false;
    };

    var consent_form = {
        type: ExternalHtmlPlugin,
        url: "assets/informed_consent/consent_form.html",
        cont_btn: "start",
        check_fn: check_consent,
        data: { disp_type: 'online_consent_form' }

    };

    timeline.push(consent_screen, consent_form);

    // Demographics
    timeline.push({
        type: htmlButtonResponse,
        stimulus: `
      <p>Next, we kindly ask you to provide some demographic information with us.<p/>
    `,
        choices: ["Continue"]

    });

    timeline.push({
        type: survey,
        pages: [
            [
                {
                    type: 'text',
                    prompt: 'What is your age?',
                    name: 'age',
                    required: true
                },
                {
                    type: 'multi-choice',
                    prompt: "What is your gender identity?",
                    name: 'gender',
                    options: ["male", "female", "non-binary", "prefer not to disclose"],
                    required: true
                },
                {
                    type: 'multi-choice',
                    prompt: "Are you left-handed or right-handed?",
                    name: 'handedness',
                    options: ["right-handed", "left-handed", "both"],
                    required: true
                },
                {
                    type: 'multi-choice',
                    prompt: "Are you wearing glasses or contacts or none of them?",
                    name: 'vision',
                    options: ["glasses", "contacts", "none"],
                    required: true

                }
            ],
            [
                {
                    type: 'multi-choice',
                    prompt: "Do you have a background in architecture? .",
                    name: 'art_exp1',
                    options: ["Yes", "No"],
                    required: true

                },
                {
                    type: 'multi-choice',
                    prompt: "Do you have a formal education in architecture?",
                    name: "art_exp2",
                    options: ["Yes", "No"],
                    required: true

                },
                {
                    type: "multi-choice",
                    prompt: "Do you have a background in engineering? ",
                    name: 'eng_exp1',
                    options: ["Yes", "No"],
                    required: true

                },
                {
                    type: 'multi-choice',
                    prompt: "Do you have a formal education in engineering? ",
                    name: 'eng_exp2',
                    options: ["Yes", "No"],
                    required: true

                }
            ]
        ],
        data: {
            task: "demographics_basic"
        },
        button_label_finish: "Continue",
    });

    // Instruction screen
    timeline.push({
        type: HtmlKeyboardResponsePlugin,
        stimulus: `
      <p>In this experiment, you will see a series of bridge image. </p>
      <p>Then, you will be ask to rate the image on <b>aesthetic pleasure</b>, <b>complexity</b>, <b>interest</b>, and <b>perceived safety</b>.</p>
      <p>Please make sure you're responding to each question within three seconds and finish the entire experiment in one sitting. Failure of doing so might result in invalidation of your participation.</p>
      <p>Please indicate your rating by clicking on the scale under each bridge image. The experiment should take about 15 minutes. </p>
      <p>Press any key to begin.</p>
    `,
        post_trial_gap: 100,
        on_start: function () {
            // set progress bar to 0 at the start of experiment
            jsPsych.setProgressBar(0);
        }
    });

    // Rating Trials
    // Specifying image sampling
    var rating_scale = ["Strongly disagree", "Disagree", "Neutral", "Agree", "Strongly agree"];
    var img_unit = {
        sample_a1: sample_a1,
        sample_a2: sample_a2,
        sample_b1: sample_b1,
        sample_b2: sample_b2,
        sample_c1: sample_c1,
        sample_c2: sample_c2,
        sample_d1: sample_d1,
        sample_d2: sample_d2,
        sample_e1: sample_e1,
        sample_e2: sample_e2
    };

    function getRandomProperty(obj) {
        const keys = Object.keys(obj);
        return keys[Math.floor(Math.random() * keys.length)]
    };

    var rating_unit_name = getRandomProperty(img_unit)
    var rating_stimuli_array = img_unit[rating_unit_name]
    jsPsych.data.addProperties({ stimuli_set: rating_unit_name })

    // Start of the rating trial
    var n_trials = 115;
    var trial_number = 0


    var aesthetic_trial = {
        type: imageButtonResponse,
        stimulus: jsPsych.timelineVariable('stimulus'),
        stimulus_width: 800,
        prompt: "<p>I find the design of the bridge to be <strong>aesthetically appealing</strong>.</p>",
        choices: rating_scale,
        data: {
            task: "aesthetic_trial"
        },
        on_finish: function () {
            var curr_progress_bar_value = jsPsych.getProgressBarCompleted();
            jsPsych.setProgressBar(curr_progress_bar_value + (1 / n_trials));
        }
    };

    var complexity_trial = {
        type: imageButtonResponse,
        stimulus: jsPsych.timelineVariable('stimulus'),
        stimulus_width: 800,
        prompt: "<p>I find the design of the bridge to be <strong>complex</strong>.</p>",
        choices: rating_scale,
        data: {
            task: "complexity_trial"
        }
    };

    var interest_trial = {
        type: imageButtonResponse,
        stimulus: jsPsych.timelineVariable('stimulus'),
        stimulus_width: 800,
        prompt: "<p>I find the design of the bridge to be <strong>interesting</strong>.</p>",
        choices: rating_scale,
        data: {
            task: "interest_trial"
        }
    };

    var safety_trial = {
        type: imageButtonResponse,
        stimulus: jsPsych.timelineVariable('stimulus'),
        stimulus_width: 800,
        prompt: "<p>I would feel <strong>safe</strong> crossing this bridge.</p>",
        choices: rating_scale,
        data: {
            task: "safety_trial"
        }
    };

    var break_trial = {
        type: HtmlKeyboardResponsePlugin,
        stimulus: "You've reached a breakpoint. Please take a break. Once you're ready, press any key to resume.",
        data: {
            task: "break"
        }
    };

    var attention_check = {
        type: HtmlKeyboardResponsePlugin,
        stimulus: "Please press the number 3 on your keyboard.",
        data: {
            task: "attention_check",
            correct_response: '3'
        },
        on_finish: function (data) {
            if (jsPsych.pluginAPI.compareKeys(data.response, data.correct_response)) {
                data.correct = true;
            } else {
                data.correct = false;
            }
        }
    };

    var if_node = {
        timeline: [break_trial, attention_check],
        conditional_function: function () {
            trial_number++;
            if (trial_number % 20 == 0) {
                return true;
            } else {
                return false;
            }
        }
    };

    var preload_block = {
        type: PreloadPlugin,
        trials: [aesthetic_trial, complexity_trial, interest_trial, safety_trial],
        show_progress_bar: true,
        message: 'Please wait while the image loads. This may take a few seconds..',
        max_load_time: 60000,
        error_message: "The experiment failed to load. Please contact the reseasrcher.",
        data: {
            task: "preloading"
        }
    };

    var rating_procedure = {
        timeline: [if_node, preload_block, aesthetic_trial, complexity_trial, interest_trial, safety_trial],
        timeline_variables: rating_stimuli_array
    };

    timeline.push(rating_procedure);


    // End of experiment
    var finish = {
        type: HtmlKeyboardResponsePlugin,
        stimulus: "<p> Congratulations! You've completed the entire expeirment. Now, please press any key to the debriefing page.",
        post_trial_gap: 500,
        choices: null
    };

    // Debriefing
    var debriefing = {
        type: HtmlKeyboardResponsePlugin,
        stimulus: `
    <p>Thank you for participating in our bridge image rating experiment.  The purpose of this study was to investigate the aesthetic aspects of various bridges and understand what makes them visually appealing to individuals like yourself. <p/>
    <p>The findings from this research have the potential to contribute to the design of better bridges and assist in environmental impact studies within the engineering field.</p>
    <p>We greatly appreciate your time and contribution to this study.</p>
    <p>If you have any questions or concerns, please feel free to reach out to Dr. Dirk Bernhardt-Walther at bernhardt-walther@psych.utoronto.ca.<\p>
  
  `
    };

    // Post-Questionnaire
    var post_question = {
        type: surveyText,
        questions: [
            {
                prompt: "<p>Please take a moment to reflect on your experience during the experiment and provide us with your feedback.</p>" +
                    " <p>Did all of the images load? Press Y for yes and N for no. </p>", name: 'image_status', required: true
            },
            { prompt: "Did you encounter any other technical issues or difficulties while completing the experiment? If yes, please provide details.", name: 'technical_difficulty' },
            { prompt: "If you have any further suggestions or comments about the experiment or the topic of bridge aesthetics, please share them below.", name: 'comment' }
        ],
        data: {
            task: "post_questions"
        }
    };

    var save_data = {
        type: HtmlKeyboardResponsePlugin,
        stimulus: "<p> Saving data, please stay at this page and wait for further instructions.</p> ",
        post_trial_gap: 2000,
        choices: null,
        trial_duration: 2000,
        on_finish: function () {
            //firebase!
            var tmp = new Uint32Array(1);
            tmp = window.crypto.getRandomValues(tmp);
            var dbpath = auth.currentUser.uid + '/' + tmp;
            set(ref(database, dbpath), {
                data: jsPsych.data.get().values(),
                study: '2023Summer_Bridge_Rating_Main',
                date: Date()
            });
        }
    };



    // Goodbye
    var end_experiment = {
        type: HtmlKeyboardResponsePlugin,
        stimulus: "<p> Thanks for participating in the experiment. Goodbye! </p> ",
        post_trial_gap: 500,
        choices: null,
        trial_duration: 1000
    };


    timeline.push(finish, debriefing, post_question, save_data, end_experiment)

    await jsPsych.run(timeline);

}