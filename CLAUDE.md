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
