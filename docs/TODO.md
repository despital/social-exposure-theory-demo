# TODO - Social Exposure Theory Experiment

## Priority 1: Essential Additions

### 1. Add Consent Form, Survey, and Debriefing
**Status:** Not started
**Reference:** `experiment_demo.js` (lines 96-130 for consent, 132-214 for demographics)

**Tasks:**
- [ ] Create `assets/informed_consent/` directory
- [ ] Add consent form HTML file (retrieve PDF version from lab)
- [ ] Implement consent screen with checkbox validation
- [ ] Add demographics survey using `@jspsych/plugin-survey`
  - Age, gender, handedness, vision
  - Relevant background questions
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

**Estimated time:** 3-4 hours

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

**Estimated time:** 2-3 hours

---

## Priority 2: Phase 2 Planning

### 3. Phase 2 Design Discussion
**Status:** Pending requirements

**Placeholder for future discussion:**
- What is the task structure for Phase 2?
- Does it build on Phase 1 data?
- New stimuli needed?
- Different trial types?

**Document requirements here once discussed.**

---

## Priority 3: Enhancements & Polish

### 4. Stimuli Integration
**Status:** Awaiting GAN-generated faces

**Tasks:**
- [ ] Acquire 100 GAN-generated face images
- [ ] Process images (resize, format, add colored backgrounds)
- [ ] Organize into `stimuli/` folder:
  - `red_face_000.jpg` through `red_face_049.jpg`
  - `blue_face_000.jpg` through `blue_face_049.jpg`
- [ ] Test image loading times
- [ ] Add preloading if needed for performance

**Estimated time:** 2-3 hours (once images available)

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

**Estimated time:** 4-5 hours

---

### 6. Additional Features

**Nice-to-have improvements:**
- [ ] Add fullscreen mode (like in demo)
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

## Priority 4: Deployment

### 7. Production Deployment

**Tasks:**
- [ ] Run production build: `npm run build`
- [ ] Test production build locally
- [ ] Upload `dist/` to GitHub Pages
- [ ] Configure custom domain (if needed)
- [ ] Generate final condition URLs
- [ ] Document URLs for research team
- [ ] Set up Prolific study
- [ ] Pilot test with 5-10 participants

**Estimated time:** 2-3 hours

---

## Backlog / Future Considerations

- [ ] Add data analysis scripts (Python/R)
- [ ] Create data visualization dashboard
- [ ] Document data structure for analysis
- [ ] Add export to CSV functionality
- [ ] Create experimenter dashboard for monitoring
- [ ] Add randomization check tools
- [ ] Performance optimization for large datasets
- [ ] Internationalization (if needed)

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

---

**Last Updated:** 2025-09-30