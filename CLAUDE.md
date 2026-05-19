# social-exposure-theory -- Project Constitution
# Updated: 2026-03-03

## Purpose

Online behavioral experiment: approach-avoidance behavior and social learning
in group contexts. Built with jsPsych 8.2. Data collected via Firebase.
Target: ~20-25 minutes per participant.

## Environment

Node.js / npm:
  npm install       # install dependencies
  npm start         # dev server (localhost)
  npm run build     # production build (webpack)

---

## Git Remotes

Two remotes are configured:

  origin  https://github.com/social-ai-uoft/social-exposure-theory   # org repo — documentation only
  demo    https://github.com/despital/social-exposure-theory-demo     # personal repo — live experiment

**Push rule: always push to BOTH remotes.**
  git push origin master
  git push demo master

**Deploying to GitHub Pages (making the experiment live):**
  1. npm run build
  2. git checkout gh-pages
  3. cp dist/*.js dist/*.html dist/*.txt .        # copy updated bundles to root
  4. cp -r dist/stimuli/faces/. stimuli/faces/   # REQUIRED if stimuli changed
  5. git add bundle.js *.bundle.js *.LICENSE.txt index.html stimuli/faces/
  6. git commit -m "Deploy: ..."
  7. git push origin gh-pages
  8. git push demo gh-pages                      # <-- THIS is what makes it live
  9. git checkout master

  NOTE: Step 4 is mandatory whenever face images change. The stimuli/ directory
  in gh-pages is tracked separately from dist/ — webpack copies it to dist/ on
  build, but it does NOT flow to gh-pages automatically.

The experiment is served from despital/social-exposure-theory-demo (gh-pages branch).
The org remote is for documentation and team visibility only — it does NOT serve the live experiment.

---

## Folder Map

```
social-exposure-theory/
|- src/               # jsPsych experiment source (main logic here)
|- scripts/           # Utility and analysis scripts
|- data/              # Collected participant data -- NOT in Claude context
|- stimuli/           # Face images and other assets -- NOT in Claude context
|- tests/             # Experiment logic tests
|- sample_files/      # Example data (safe to read for structure reference)
|- docs/              # Design documentation
|- webpack.config.js  # Build config
|- package.json       # Node dependencies
```

---

## Experiment Structure

- Phase 1: Social Learning -- repeated interactions with feedback
- Phase 2: Partner Choice -- novel group members, no feedback
- Phase 3: Post-Task Rating -- partner ratings and debrief

Conditions assigned via URL parameters (?condition=A, ?condition=B, etc.)
Firebase Realtime Database stores response data keyed by participant ID.

---

## Key Rules

- Never load participant data files into context (data/ is excluded)
- Use sample_files/ to understand data structure without privacy risk
- For any change to experiment logic: state which Phase(s) are affected
  and verify with tests/ before considering complete
- Build artifacts (dist/) are not in git

## Plan-First Rule

State numbered plan before any experiment logic change. See ~/.claude/CLAUDE.md.
