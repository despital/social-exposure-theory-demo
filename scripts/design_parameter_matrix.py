#!/usr/bin/env python3
"""
Phase 1 Design Parameter Matrix
================================
Plots the parameter space of TOTAL_FACES × EXPOSURES_PER_FACE for Phase 1.

Each cell shows total Phase 1 trials and estimated duration.
Row labels include the minority-group good/bad ratio deviation (majority-minority
condition only) in colour-coded text below each N label.
Column headers (in the bar chart below) show E, E[int], and P(≥1).

Saves figure to: docs/design_parameter_matrix.png

Dependencies: numpy, matplotlib
"""

import numpy as np
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
from matplotlib.colors import Normalize
from matplotlib.gridspec import GridSpec

# ── Experiment constants ──────────────────────────────────────────────────────
FACES_PER_TRIAL = 4      # faces per trial panel
SEC_PER_TRIAL   = 5      # seconds per trial  (decision ~3 s + feedback 1 s + gap ~1 s)
MINORITY_RATIO  = 0.20   # minority color-group share in majority-minority condition
GOOD_RATIO      = 0.70   # target good-face fraction within each color group

# Named configurations to highlight
CONFIGS = {
    "Current (N=100, E=12)":  {"N": 100, "E": 12, "marker": "★", "ec": "#1a1a1a"},
    "Proposed (N=40, E=12)":  {"N":  40, "E": 12, "marker": "●", "ec": "#2c7bb6"},
}

# ── Parameter space ───────────────────────────────────────────────────────────
face_options     = [20, 40, 60, 80, 100]
exposure_options = [4, 6, 8, 10, 12, 16, 20]

n_rows = len(face_options)
n_cols = len(exposure_options)

# ── Helper functions ──────────────────────────────────────────────────────────

def total_trials(n, e):
    return (n * e) // FACES_PER_TRIAL

def duration_min(n, e):
    return total_trials(n, e) * SEC_PER_TRIAL / 60.0

def e_interactions(e):
    """Expected clicks on a given face = E / FACES_PER_TRIAL."""
    return e / FACES_PER_TRIAL

def p_at_least_one(e):
    """P(participant clicks a given face ≥ 1 time across all appearances)."""
    return 1.0 - (1.0 - 1.0 / FACES_PER_TRIAL) ** e

def minority_deviation(n):
    """
    Deviation (pp) of rounded minority good-face count from GOOD_RATIO.
    Returns None when the 80/20 split doesn't yield an integer minority count.
    """
    minority = n * MINORITY_RATIO
    if minority != int(minority):
        return None
    good_exact   = minority * GOOD_RATIO
    good_rounded = round(good_exact)
    actual_ratio = good_rounded / minority
    return (actual_ratio - GOOD_RATIO) * 100

# ── Build grids ───────────────────────────────────────────────────────────────
trials_grid   = np.array([[total_trials(n, e)  for e in exposure_options]
                           for n in face_options], dtype=float)
duration_grid = np.array([[duration_min(n, e)  for e in exposure_options]
                           for n in face_options], dtype=float)
p1_values     = np.array([p_at_least_one(e) * 100 for e in exposure_options])

# ── Figure layout ─────────────────────────────────────────────────────────────
fig = plt.figure(figsize=(16, 9.5))

# Title
fig.suptitle(
    "Phase 1 Design Parameter Space — Total Faces (N) × Exposures per Face (E)",
    fontsize=13, fontweight='bold', y=0.99,
)

gs = GridSpec(
    2, 2,
    figure=fig,
    height_ratios=[5, 1.3],
    width_ratios=[13.5, 0.35],
    hspace=0.06,
    wspace=0.03,
    left=0.22,   # wide left margin for custom row labels
    right=0.95,
    top=0.95,
    bottom=0.06,
)

ax_main = fig.add_subplot(gs[0, 0])
ax_bar  = fig.add_subplot(gs[1, 0])
ax_cb   = fig.add_subplot(gs[0, 1])

# ── Main heatmap ──────────────────────────────────────────────────────────────
cmap = plt.cm.YlOrRd
norm = Normalize(vmin=0, vmax=duration_grid.max() * 1.05)

im = ax_main.imshow(
    duration_grid, cmap=cmap, norm=norm, aspect='auto',
    extent=[-0.5, n_cols - 0.5, n_rows - 0.5, -0.5],
)

# White grid lines between cells
for x in np.arange(-0.5, n_cols, 1):
    ax_main.axvline(x, color='white', lw=0.9, zorder=2)
for y in np.arange(-0.5, n_rows, 1):
    ax_main.axhline(y, color='white', lw=0.9, zorder=2)

ax_main.set_xlim(-0.5, n_cols - 0.5)
ax_main.set_ylim(n_rows - 0.5, -0.5)

# No built-in x or y ticks on the main axes — we draw custom labels instead
ax_main.tick_params(bottom=False, labelbottom=False, left=False, labelleft=False)
ax_main.set_ylabel("Total Phase 1 Faces (N)", fontsize=11, labelpad=68)

# ── Custom row labels (N value + minority deviation) ─────────────────────────
for i, n in enumerate(face_options):
    dev = minority_deviation(n)

    # ── N label (bold, left-aligned)
    ax_main.text(
        -0.58, i, f"N = {n}",
        ha='right', va='bottom',
        fontsize=11, fontweight='bold', color='#1a1a1a',
        clip_on=False,
    )

    # ── Minority good-face rate sub-label (smaller, coloured)
    # Shows the actual good-face proportion achievable in the minority group
    # (majority-minority condition only; target = 70%).
    if dev is None:
        dev_txt = "80/20 split not possible"
        dev_col = '#cc0000'
    else:
        actual_pct = GOOD_RATIO * 100 + dev          # e.g. 70 + 5 = 75 %
        if abs(dev) < 0.01:
            dev_txt = f"minority good-rate: {actual_pct:.0f}%  ✓"
            dev_col = '#27ae60'
        else:
            sign    = '+' if dev > 0 else ''
            dev_txt = f"minority good-rate: {actual_pct:.0f}% ({sign}{dev:.1f} pp)"
            dev_col = '#e67e22' if abs(dev) <= 2 else '#c0392b'

    # y + 0.32 places the sub-label just below (y-axis is inverted: +y = down)
    ax_main.text(
        -0.58, i + 0.32, dev_txt,
        ha='right', va='top',
        fontsize=7.5, color=dev_col, style='italic',
        clip_on=False,
    )

# ── Cell annotations ──────────────────────────────────────────────────────────
for i, n in enumerate(face_options):
    for j, e in enumerate(exposure_options):
        t = int(trials_grid[i, j])
        d = duration_grid[i, j]

        txt_color = 'white' if norm(d) > 0.55 else '#1a1a1a'
        weight    = 'normal'

        config_hit = None
        for cfg_name, cfg in CONFIGS.items():
            if n == cfg["N"] and e == cfg["E"]:
                config_hit = (cfg_name, cfg)
                weight = 'bold'
                break

        ax_main.text(
            j, i, f"{t} trials\n≈{d:.0f} min",
            ha='center', va='center',
            fontsize=8.5, color=txt_color, fontweight=weight,
            linespacing=1.5, zorder=3,
        )

        if config_hit:
            cfg_name, cfg = config_hit
            ax_main.add_patch(plt.Rectangle(
                (j - 0.48, i - 0.48), 0.96, 0.96,
                linewidth=2.8, edgecolor=cfg["ec"],
                facecolor='none', zorder=5,
            ))
            ax_main.text(
                j + 0.45, i - 0.44, cfg["marker"],
                ha='right', va='top',
                fontsize=12, color=cfg["ec"], fontweight='bold', zorder=6,
            )

# ── P(≥1) bar chart ───────────────────────────────────────────────────────────
bar_colors = [
    '#2ecc71' if p >= 95 else ('#f39c12' if p >= 85 else '#e74c3c')
    for p in p1_values
]
ax_bar.bar(range(n_cols), p1_values, color=bar_colors, width=0.72, zorder=2)
ax_bar.axhline(95, color='#27ae60', ls='--', lw=1.2, alpha=0.85, zorder=3)
ax_bar.axhline(85, color='#e67e22', ls='--', lw=1.2, alpha=0.85, zorder=3)
ax_bar.text(n_cols - 0.5, 95.5, "95%", fontsize=7, color='#27ae60', ha='right', va='bottom')
ax_bar.text(n_cols - 0.5, 85.5, "85%", fontsize=7, color='#e67e22', ha='right', va='bottom')

for j, p in enumerate(p1_values):
    ax_bar.text(j, p + 1, f"{p:.0f}%",
                ha='center', va='bottom', fontsize=8, fontweight='bold')

ax_bar.set_xlim(-0.5, n_cols - 0.5)
ax_bar.set_ylim(50, 108)
ax_bar.set_yticks([60, 75, 85, 95])
ax_bar.set_yticklabels(["60%", "75%", "85%", "95%"], fontsize=7.5)
ax_bar.set_ylabel("P(≥1)\n[%]", fontsize=9, labelpad=4)
ax_bar.grid(axis='y', alpha=0.25, zorder=0)
ax_bar.tick_params(axis='x', length=0)

# Bar chart x-axis: E, E[int], P(≥1) per column
ax_bar.set_xticks(range(n_cols))
ax_bar.set_xticklabels(
    [f"E = {e}\nE[int] = {e_interactions(e):.1f}" for e in exposure_options],
    fontsize=9,
)
ax_bar.set_xlabel("Exposures per Face (E)", fontsize=9.5, labelpad=8)

ax_bar.set_title("P(≥1): probability of interacting with a given face at least once",
                 fontsize=8.5, loc='left', pad=5, color='#333333')

# ── Colorbar ──────────────────────────────────────────────────────────────────
cb = plt.colorbar(im, cax=ax_cb)
ax_cb.set_ylabel("Estimated Duration (min)", fontsize=8, labelpad=6)

# ── Legend ────────────────────────────────────────────────────────────────────
legend_handles = [
    mpatches.Patch(facecolor='none', edgecolor=cfg["ec"], linewidth=2.5,
                   label=f'{cfg["marker"]}  {name}')
    for name, cfg in CONFIGS.items()
]
ax_main.legend(
    handles=legend_handles, loc='lower right',
    fontsize=8.5, framealpha=0.88, edgecolor='#bbbbbb',
)

# ── Save ─────────────────────────────────────────────────────────────────────
out_path = "docs/design_parameter_matrix.png"
plt.savefig(out_path, dpi=150, bbox_inches='tight')
print(f"Saved: {out_path}")
plt.show()
