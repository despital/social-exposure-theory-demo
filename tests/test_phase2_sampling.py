"""
Test: Phase 2 sampling logic
Mirrors generatePhase2Trials() from src/utils/helpers.js and verifies:
  - ALL Phase 1 faces appear as encountered
  - PHASE2_NOVEL_PER_COLOR novel red + novel blue (default 5 + 5)
  - Default total = TOTAL_FACES + 2 * PHASE2_NOVEL_PER_COLOR (= 30)

Output: tests/output/phase2_sampling_<timestamp>.csv
  - One row per Phase 2 trial; human-verifiable by inspection.
  - novel faces have face_id starting with 'n'; encountered are numeric.

Usage:
    python tests/test_phase2_sampling.py             # 100 participants/condition
    python tests/test_phase2_sampling.py --test      # 3 participants/condition, <30s
    python tests/test_phase2_sampling.py --participants 500
"""

import argparse
import csv
import random
import sys
from datetime import datetime
from pathlib import Path

# ---------------------------------------------------------------------------
# Config — mirrors src/utils/config.js
# ---------------------------------------------------------------------------
TOTAL_FACES = 20
TOTAL_NOVEL_FACES = 120
PHASE2_NOVEL_PER_COLOR = 5
PHASE2_TOTAL_TRIALS = TOTAL_FACES + 2 * PHASE2_NOVEL_PER_COLOR  # 30
GOOD_BAD_RATIO = {'red': 0.8, 'blue': 0.8}
FACE_COLOR_SPLIT = {
    'equal':             {'red': 10, 'blue': 10},
    'majority-minority': {'majority': 15, 'minority': 5},
}

# ---------------------------------------------------------------------------
# Simulated helpers — mirrors src/utils/helpers.js
# ---------------------------------------------------------------------------

def generate_faces(rng, condition, majority_group):
    """Mirror of generateFaces()."""
    if condition == 'equal':
        num_red = FACE_COLOR_SPLIT['equal']['red']
        num_blue = FACE_COLOR_SPLIT['equal']['blue']
    else:
        split = FACE_COLOR_SPLIT['majority-minority']
        num_red = split['majority'] if majority_group == 'red' else split['minority']
        num_blue = split['majority'] if majority_group == 'blue' else split['minority']

    ids = list(range(TOTAL_FACES))
    rng.shuffle(ids)
    red_ids = ids[:num_red]
    blue_ids = ids[num_red:num_red + num_blue]

    faces = []
    for fid in red_ids:
        faces.append({'id': fid, 'color': 'red', 'image_path': f'face_{fid:03d}_red.png'})
    for fid in blue_ids:
        faces.append({'id': fid, 'color': 'blue', 'image_path': f'face_{fid:03d}_blue.png'})
    return faces


def assign_good_bad(faces, rng):
    """Mirror of assignGoodBad()."""
    for color in ('red', 'blue'):
        group = [f for f in faces if f['color'] == color]
        rng.shuffle(group)
        num_good = round(len(group) * GOOD_BAD_RATIO[color])
        for i, face in enumerate(group):
            face['is_good'] = i < num_good
    return faces


def generate_novel_faces(rng):
    """Mirror of generateNovelFaces()."""
    ids = list(range(1, TOTAL_NOVEL_FACES + 1))
    rng.shuffle(ids)
    half = TOTAL_NOVEL_FACES // 2
    red_ids = ids[:half]
    blue_ids = ids[half:]

    faces = []
    for fid in red_ids:
        faces.append({'id': f'n{fid:03d}', 'color': 'red', 'image_path': f'face_n{fid:03d}_red.png'})
    for fid in blue_ids:
        faces.append({'id': f'n{fid:03d}', 'color': 'blue', 'image_path': f'face_n{fid:03d}_blue.png'})

    for color in ('red', 'blue'):
        group = [f for f in faces if f['color'] == color]
        rng.shuffle(group)
        num_good = round(len(group) * GOOD_BAD_RATIO[color])
        for i, face in enumerate(group):
            face['is_good'] = i < num_good

    return faces


def generate_phase2_trials(novel_faces, faces, rng):
    """
    Mirror of generatePhase2Trials() — the function under test.
    All Phase 1 faces as encountered + PHASE2_NOVEL_PER_COLOR novel per color.
    """
    n_novel = PHASE2_NOVEL_PER_COLOR

    novel_red = rng.sample([f for f in novel_faces if f['color'] == 'red'], n_novel)
    novel_blue = rng.sample([f for f in novel_faces if f['color'] == 'blue'], n_novel)
    enc_red = [f for f in faces if f['color'] == 'red']
    enc_blue = [f for f in faces if f['color'] == 'blue']

    novel_trials = [
        {'face': f, 'face_source': 'novel', 'phase': 2}
        for f in novel_red + novel_blue
    ]
    enc_trials = [
        {'face': f, 'face_source': 'encountered', 'phase': 2}
        for f in enc_red + enc_blue
    ]

    trials = novel_trials + enc_trials
    rng.shuffle(trials)
    return trials


# ---------------------------------------------------------------------------
# Assertions
# ---------------------------------------------------------------------------

def assert_participant(pid, faces, phase2_trials):
    """
    Run all sampling-contract assertions for one participant.
    Returns (n_checked, failures) where failures is a list of strings.
    """
    phase1_ids = {f['id'] for f in faces}
    n_enc_red = sum(1 for f in faces if f['color'] == 'red')
    n_enc_blue = sum(1 for f in faces if f['color'] == 'blue')
    failures = []
    n_checked = 0

    def check(condition, message):
        nonlocal n_checked
        n_checked += 1
        if not condition:
            failures.append(f'[{pid}] {message}')

    expected_total = len(faces) + 2 * PHASE2_NOVEL_PER_COLOR
    check(expected_total == PHASE2_TOTAL_TRIALS,
          f'Config total mismatch: faces+novel={expected_total}, PHASE2_TOTAL_TRIALS={PHASE2_TOTAL_TRIALS}')

    # 1. Total trial count
    check(len(phase2_trials) == expected_total,
          f'Total trials: expected {expected_total}, got {len(phase2_trials)}')

    novel = [t for t in phase2_trials if t['face_source'] == 'novel']
    encountered = [t for t in phase2_trials if t['face_source'] == 'encountered']

    # 2-3. Source counts
    check(len(novel) == 2 * PHASE2_NOVEL_PER_COLOR,
          f'Novel count: expected {2 * PHASE2_NOVEL_PER_COLOR}, got {len(novel)}')
    check(len(encountered) == len(faces),
          f'Encountered count: expected {len(faces)} (all Phase 1), got {len(encountered)}')

    # 4-7. Per-bucket color counts
    for label, pool, color, expected in [
        ('novel-red', novel, 'red', PHASE2_NOVEL_PER_COLOR),
        ('novel-blue', novel, 'blue', PHASE2_NOVEL_PER_COLOR),
        ('enc-red', encountered, 'red', n_enc_red),
        ('enc-blue', encountered, 'blue', n_enc_blue),
    ]:
        bucket = [t for t in pool if t['face']['color'] == color]
        check(len(bucket) == expected,
              f'{label}: expected {expected}, got {len(bucket)}')

    # 8. No duplicate IDs within novel
    novel_ids = [t['face']['id'] for t in novel]
    check(len(novel_ids) == len(set(novel_ids)),
          'Duplicate novel face IDs')

    # 9. No duplicate IDs within encountered; equals full Phase 1 set
    enc_ids = [t['face']['id'] for t in encountered]
    check(len(enc_ids) == len(set(enc_ids)),
          'Duplicate encountered face IDs')
    check(set(enc_ids) == phase1_ids,
          f'Encountered set != Phase 1 set: missing={phase1_ids - set(enc_ids)}, extra={set(enc_ids) - phase1_ids}')

    # 10. Novel faces must NOT appear in Phase 1 pool
    novel_in_p1 = [t['face']['id'] for t in novel if t['face']['id'] in phase1_ids]
    check(len(novel_in_p1) == 0,
          f'Novel face(s) found in Phase 1 pool: {novel_in_p1}')

    # 11. Encountered faces must all be in Phase 1 pool
    enc_not_in_p1 = [t['face']['id'] for t in encountered if t['face']['id'] not in phase1_ids]
    check(len(enc_not_in_p1) == 0,
          f'Encountered face(s) missing from Phase 1 pool: {enc_not_in_p1}')

    return n_checked, failures


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

CONDITIONS = [
    ('equal', 'red'),
    ('majority-minority', 'red'),
    ('majority-minority', 'blue'),
]

CSV_FIELDS = [
    'participant_id', 'condition', 'majority_group',
    'trial_index', 'face_id', 'face_color', 'face_source',
    'face_is_good', 'image_path',
]


def main():
    parser = argparse.ArgumentParser(description='Test Phase 2 sampling logic')
    parser.add_argument('--participants', type=int, default=100,
                        help='Participants per condition (default: 100)')
    parser.add_argument('--test', action='store_true',
                        help='Quick smoke-test: 3 participants per condition')
    parser.add_argument('--seed', type=int, default=42,
                        help='Base random seed (default: 42)')
    args = parser.parse_args()

    n_per_condition = 3 if args.test else args.participants

    out_dir = Path(__file__).parent / 'output'
    out_dir.mkdir(parents=True, exist_ok=True)
    csv_path = out_dir / f'phase2_sampling_{datetime.now().strftime("%Y%m%d_%H%M%S")}.csv'

    total_participants = 0
    total_assertions = 0
    all_failures = []

    with open(csv_path, 'w', newline='', encoding='utf-8') as f:
        writer = csv.DictWriter(f, fieldnames=CSV_FIELDS)
        writer.writeheader()

        for condition, majority_group in CONDITIONS:
            for i in range(n_per_condition):
                pid = f'SIM_{condition[:3].upper()}_{majority_group[0].upper()}_{i+1:04d}'
                rng = random.Random(args.seed + total_participants)

                faces = generate_faces(rng, condition, majority_group)
                faces = assign_good_bad(faces, rng)
                novel_faces = generate_novel_faces(rng)
                phase2_trials = generate_phase2_trials(novel_faces, faces, rng)

                n_checked, failures = assert_participant(pid, faces, phase2_trials)
                total_assertions += n_checked
                all_failures.extend(failures)

                for idx, trial in enumerate(phase2_trials):
                    writer.writerow({
                        'participant_id': pid,
                        'condition': condition,
                        'majority_group': majority_group,
                        'trial_index': idx + 1,
                        'face_id': trial['face']['id'],
                        'face_color': trial['face']['color'],
                        'face_source': trial['face_source'],
                        'face_is_good': trial['face']['is_good'],
                        'image_path': trial['face']['image_path'],
                    })

                total_participants += 1

    # ---- Summary ----
    n_conditions = len(CONDITIONS)
    print(f'Conditions tested     : {n_conditions}  ({", ".join(f"{c}/{m}" for c, m in CONDITIONS)})')
    print(f'Participants simulated: {total_participants}  ({n_per_condition} per condition)')
    print(f'Assertions checked    : {total_assertions}')

    if not all_failures:
        print('Result                : ALL PASSED')
    else:
        print(f'Result                : FAILED  ({len(all_failures)} failure(s))')
        for line in all_failures:
            print(f'  {line}')
        sys.exit(1)

    print(f'Output CSV            : {csv_path}')


if __name__ == '__main__':
    main()
