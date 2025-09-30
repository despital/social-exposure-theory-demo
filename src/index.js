// Main entry point for the experiment
import { run } from './experiment.js';

// Run the experiment when the page loads
// Pass the jsPsych Builder expected parameters
run({
    assetPaths: {},
    input: {},
    environment: 'development',
    title: 'Social Exposure Theory Experiment',
    version: '1.0.0'
});