# TODO

**Last Updated:** 2026-02-08

---
## Development
- [ ] Discuss phase 2 design points again
- [x] Re-code URL parameters to encrypt it (encoded as `?c=<CODE>`, 18 condition codes)
- [ ] Obtain consent form (requested to check with lab manager)
- [x] Remove informedness from URL parameters as this was not a manipulated variable in Study 1 and modify conditions accordingly.
## Major Design Change (High Priority)
- Phase 2: Show one novel face never shown before in the experiment and ask participants whether they'd like to approach/avoid this person using a slider design.
  - [ ] Confirm trial numbers
  - [ ] Generate additional faces
  - [ ] Confirm group association status (What are the conditions) 
- [x] Create a control condition (encoded as P1 Type = Control in condition codes, e.g., `ECE`, `RCB`, etc.)
  - [x] Phase 1: show all four reward values associated with each face (feedback screen shows all 4 outcomes)
  - [x] Phase 2: no change compared to the other conditions
- [ ] Confirm if phase 3 is needed (additional data, but might eat away experiment time)

## Pre-Launch (Priority)

### Firebase Production Setup
- [ ] Test data saving with pilot participants
- [ ] Set up data backup/monitoring schedule

### Testing & Validation
- [ ] Verify exposure ratios (50/50 and 80/20)
- [ ] Prolific integration test

### Study Launch
- [ ] Generate final condition URLs for Prolific
- [ ] Document URLs and conditions for team
- [ ] Pilot test with 5-10 participants
- [ ] Review pilot data for issues
- [ ] Launch full data collection

---

## Future Enhancements (Optional)

### Experiment Features
- [ ] Attention checks
- [ ] Practice trials before Phase 1
- [ ] Image preloading optimization
- [ ] Mobile responsiveness improvements

### Data & Analysis
- [ ] Data analysis scripts (Python/R)
- [ ] Data visualization dashboard
- [ ] Experimenter monitoring dashboard
- [ ] Automated data quality checks

---

## Completed ✅

**Core Experiment:**
- [x] Phase 1: Social Learning (300 trials)
- [x] Phase 2: Partner Choice (25 trials)
- [x] Phase 3: Post-Task Rating (~200 trials)
- [x] Custom image-multi-choice plugin
- [x] Block design and stratified assignment
- [x] Progress bar across all phases
- [x] Break screen between Phase 1 & 2

**Data Collection:**
- [x] Firebase integration
- [x] Condition assignment via URL
- [x] CSV export scripts (Python & R)
- [x] Comprehensive data structure

**Survey Components:**
- [x] Informed consent form
- [x] 4-page demographics survey
- [x] Technical check survey
- [x] User feedback survey
- [x] Debriefing screen

**Development Tools:**
- [x] Debug mode with reduced trials
- [x] Section jumping system
- [x] Auto-click debug mode (replaced simulation mode)
- [x] Webpack build system

**Stimuli:**
- [x] 100 FaceGen faces with colored backgrounds
- [x] Image generation scripts
- [x] Deployment to GitHub Pages

**Condition Encoding & Design:**
- [x] 3×2×3 between-subjects design (18 conditions)
- [x] Encoded URL parameters (`?c=<CODE>`)
- [x] Condition codebook in config.js
- [x] Removed informedness (not a manipulated variable)
- [x] Experiment design document (EXPERIMENT_DESIGN.md)

**Documentation:**
- [x] Internal documentation (INTERNAL_DOCS.md)
- [x] Public-facing README
- [x] Data export guides
- [x] Configuration documentation

**Firebase:**
- [x] Verify Firebase Security Rules are active
- [x] Set `DISABLE_DATA_SAVING: false` in `config.js`