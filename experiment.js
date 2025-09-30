// Initialize jsPsych
const jsPsych = initJsPsych({
    on_finish: function() {
        jsPsych.data.displayData();
    }
});

// Create timeline
let timeline = [];

// Welcome screen
const welcome = {
    type: jsPsychHtmlKeyboardResponse,
    stimulus: `
        <h1>Welcome to the Social Exposure Theory Experiment</h1>
        <p>Press any key to begin.</p>
    `
};
timeline.push(welcome);

// Run the experiment
jsPsych.run(timeline);
