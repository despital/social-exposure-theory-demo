# TODO

**Last Updated:** 2026-02-07

---

## Pre-Launch (Priority)

### Firebase Production Setup
- [ ] Verify Firebase Security Rules are active
- [ ] Set `DISABLE_DATA_SAVING: false` in `config.js`
- [ ] Test data saving with pilot participants
- [ ] Set up data backup/monitoring schedule

### Testing & Validation
- [ ] Test all 6 experimental conditions
- [ ] Verify exposure ratios (50/50 and 80/20)
- [ ] Cross-browser testing (Chrome, Firefox, Safari)
- [ ] Mobile device compatibility check
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
- [x] Simulation mode integration
- [x] Webpack build system

**Stimuli:**
- [x] 100 FaceGen faces with colored backgrounds
- [x] Image generation scripts
- [x] Deployment to GitHub Pages

**Documentation:**
- [x] Internal documentation (INTERNAL_DOCS.md)
- [x] Public-facing README
- [x] Data export guides
- [x] Configuration documentation
