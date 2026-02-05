# TODO - Social Exposure Theory Experiment

### 1. Add Consent Form, Survey, and Debriefing
**Status:** In progress
**Reference:** `experiment_demo.js` (lines 96-130 for consent, 132-214 for demographics)

**Tasks:**
- [ ] Add post-experiment debriefing screen
- [ ] Add post-questionnaire for feedback
  - Technical issues check
  - Open-ended comments

**Developer Skip Logic:**
- [ ] Add `DEBUG_MODE` flag to `config.js`
- [ ] When `DEBUG_MODE: true`:
  - Skip consent form
  - Skip demographics
  - Reduce trials (e.g., 1 exposure per face instead of 3)
  - Skip post-questionnaire
- [ ] Activate via URL parameter: `?debug=true`

---

### 2. Firebase Setup and Testing
**Status:** Not started (currently using demo credentials)

**Tasks:**
- [ ] Create new Firebase project for this experiment
- [ ] Set up Realtime Database
- [ ] Configure authentication (anonymous sign-in)
- [ ] Update Firebase credentials in `src/utils/config.js`
- [ ] Test data saving with sample run
- [ ] Verify data structure in Firebase console
- [ ] Set `DISABLE_DATA_SAVING: false` for production
- [ ] Add error handling for Firebase failures
- [ ] Optional: Add local backup if Firebase fails

**Security considerations:**
- [ ] Set up Firebase security rules
- [ ] Ensure participants can only write to their own data
- [ ] Restrict read access


---
### 4. Stimuli Integration
**Status:** in-progess (2026-02-05)

**Tasks:**
- [ ] Test image loading times
- [ ] Add preloading if needed for performance

---

### 5. Testing & Validation

**Tasks:**
- [ ] Test all 6 condition URLs
- [ ] Verify correct exposure ratios (50/50 and 80/20)
- [ ] Verify stratified assignment (exactly 80/20 good/bad per group)
- [ ] Check data structure and completeness
- [ ] Test with actual face images
- [ ] Cross-browser testing (Chrome, Firefox, Safari)
- [ ] Mobile device testing (if applicable)
- [ ] Prolific integration test

---

### 6. Additional Features

**Nice-to-have improvements:**
- [x] Add fullscreen mode (like in demo)
- [ ] Add attention checks periodically
- [ ] Add break screens every N trials
- [ ] Add practice trials before main experiment
- [ ] Improve feedback animation
- [ ] Add sound effects (optional)
- [ ] Add loading screen while images preload
- [ ] Better mobile responsiveness
- [ ] Add experiment timer/duration estimate

**Estimated time:** Variable based on priorities

---
### 7. Production Deployment

**Tasks:**
- [x] Run production build: `npm run build`
- [x] Test production build locally
- [x] Upload `dist/` to GitHub Pages
- [ ] Generate final condition URLs
- [ ] Document URLs for research team
- [ ] Set up Prolific study
- [ ] Pilot test with 5-10 participants

---

## Backlog / Future Considerations

- [ ] Add data analysis scripts (Python/R)
- [ ] Create data visualization dashboard
- [ ] Document data structure for analysis
- [ ] Add export to CSV functionality
- [ ] Create experimenter dashboard for monitoring
- [ ] Add randomization check tools
- [ ] Performance optimization for large datasets

---

## Completed ✅

- [x] Project setup with jsPsych Builder
- [x] Custom image-multi-choice plugin
- [x] Configuration system with hyperparameters
- [x] Block design trial generation
- [x] Stratified good/bad assignment
- [x] URL parameter condition assignment
- [x] Feedback and scoring system
- [x] Progress bar
- [x] Firebase integration (basic structure)
- [x] Git repository setup
- [x] Webpack build system
- [x] Development documentation
- [x] Added consent screen
- [x] Obtained and modify FaceGen stimuli

---

**Last Updated:** 2026-02-05