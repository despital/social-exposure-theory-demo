// Main entry point for the experiment
// Detects URL parameter to switch between demo and full version

// Check if demo mode is requested via URL parameter
const urlParams = new URLSearchParams(window.location.search);
const isDemoMode = urlParams.get('demo') === 'true';

// Import the appropriate experiment version
let experimentModule;
if (isDemoMode) {
    console.log('🎬 Running DEMO version (5+5 trials)');
    experimentModule = import('./experiment_demo.js');
} else {
    console.log('🔬 Running FULL version');
    experimentModule = import('./experiment.js');
}

// Run the experiment when the module is loaded
experimentModule.then(module => {
    module.run({
        assetPaths: {},
        input: {},
        environment: 'development',
        title: isDemoMode ? 'Social Exposure Theory - DEMO' : 'Social Exposure Theory Experiment',
        version: isDemoMode ? '1.0.0-demo' : '1.0.0'
    });
});