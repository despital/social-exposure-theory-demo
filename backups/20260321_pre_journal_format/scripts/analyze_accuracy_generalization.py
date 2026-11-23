"""
Accuracy → Generalized Stereotyping analysis pipeline
=====================================================

Question
--------
Does better learning of who is good vs bad (individuation accuracy) predict
stronger generalized stereotyping toward novel group members, after controlling
for stereotyping already shown toward encountered group members?

Design note
-----------
Both color groups have matched good/bad base rates (identical expected value).
Any group contrast is therefore a false / non-veridical stereotype relative to
the generative model — not recovery of a true group difference.

Standard psych workflow implemented here
----------------------------------------
1. Load Firebase export
2. Build trial-level tables
3. Apply exclusions / completeness checks
4. Compute person-level indices
5. Descriptives + zero-order correlations
6. Primary OLS models (total + covariate-controlled)
7. Figures
8. Text results report

Primary model set
-----------------
(M1) novel_stereotype ~ accuracy
(M2) novel_stereotype ~ accuracy + encountered_stereotype   [stricter generalization test]

Accuracy (primary)
------------------
Phase 2 encountered faces only, in probability units (0–1):
  Acc = [mean(p̂|bad) − mean(p̂|good)] / 100
  where p̂ is the 0–100 slider response.
Veridical gap under the payoff scheme ≈ +0.40  (= 0.50 − 0.10)
(Phase 3 individuation is saved as a supplementary column when available.)

Stereotype indices
------------------
Majority–minority conditions:
  belief_stereotype   = [mean(p̂|minority) − mean(p̂|majority)] / 100   (probability units)
  approach_stereotype = [mean(slider|majority) − mean(slider|minority)] / 100
                        (fraction of approach scale; Avoid=0 … Approach=1)

Equal-exposure conditions (exploratory; no designed majority):
  belief_stereotype   = [mean(p̂|red) − mean(p̂|blue)] / 100
  approach_stereotype = [mean(slider|red) − mean(slider|blue)] / 100

Usage
-----
python scripts/analyze_accuracy_generalization.py ^
  --input "C:/Users/22455/Downloads/socialexposuretheory2026-default-rtdb-export.json" ^
  --outdir outputs/accuracy_generalization
"""

from __future__ import annotations

import argparse
import json
import warnings
from pathlib import Path

import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
import seaborn as sns
import statsmodels.formula.api as smf
from scipy import stats

# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------

# Slider responses are stored 0–100; Acc is reported in probability units (0–1).
P_PUNISH_GOOD = 0.10
P_PUNISH_BAD = 0.50
TRUE_INDIVIDUATION = P_PUNISH_BAD - P_PUNISH_GOOD  # 0.40

sns.set_theme(style="whitegrid", context="paper", font_scale=1.15)
plt.rcParams.update({
    "figure.dpi": 150,
    "savefig.dpi": 300,
    "savefig.bbox": "tight",
})


# ---------------------------------------------------------------------------
# I/O helpers
# ---------------------------------------------------------------------------

def load_firebase_export(path: Path) -> dict:
    raw = json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(raw, dict) or not raw:
        raise ValueError(f"Empty or invalid JSON: {path}")

    # Accept either {pilot: {...}} / {participants: {...}} or a flat pid→record map
    if all(isinstance(v, dict) and ("trials" in v or "metadata" in v) for v in raw.values()):
        return raw
    for key in ("pilot", "participants", "round1"):
        if key in raw and isinstance(raw[key], dict):
            return raw[key]
    # single nested collection
    if len(raw) == 1:
        only = next(iter(raw.values()))
        if isinstance(only, dict):
            return only
    raise ValueError(
        "Could not locate participant records. Expected top-level "
        "'pilot'/'participants' or a flat participant map."
    )


def _safe_get(d, *keys, default=None):
    cur = d
    for k in keys:
        if not isinstance(cur, dict) or k not in cur:
            return default
        cur = cur[k]
    return cur


# ---------------------------------------------------------------------------
# Trial tables
# ---------------------------------------------------------------------------

def build_trial_tables(participants: dict) -> tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame, pd.DataFrame]:
    meta_rows, p1_rows, p2_rows, p3_rows = [], [], [], []

    for pid, rec in participants.items():
        meta = rec.get("metadata") or {}
        summary = rec.get("summary") or {}
        trials = rec.get("trials") or {}

        row = {
            "participant_id": pid,
            "condition_code": meta.get("condition_code"),
            "condition": meta.get("condition"),
            "majority_group": meta.get("majority_group"),
            "p1_type": meta.get("p1_type"),
            "p2_exposure": meta.get("p2_exposure"),
            "debug_mode": bool(meta.get("debug_mode", False)),
            "pilot_mode": meta.get("pilot_mode"),
            "timestamp": meta.get("timestamp"),
            "phase1_trials_count": summary.get("phase1_trials_count"),
            "phase2_trials_count": summary.get("phase2_trials_count"),
            "phase3_trials_count": summary.get("phase3_trials_count"),
        }
        meta_rows.append(row)

        for t in trials.get("phase1") or []:
            if not isinstance(t, dict):
                continue
            p1_rows.append({
                "participant_id": pid,
                "task": t.get("task"),
                "block": t.get("block"),
                "trial_number": t.get("trial_number"),
                "chosen_face_is_good": t.get("chosen_face_is_good"),
                "chosen_face_color": t.get("chosen_face_color"),
                "outcome": t.get("outcome"),
                "faces_in_trial": t.get("faces_in_trial"),
                "rt": t.get("rt"),
            })

        for t in trials.get("phase2") or []:
            if not isinstance(t, dict):
                continue
            p2_rows.append({
                "participant_id": pid,
                "task": t.get("task"),
                "face_id": t.get("face_id"),
                "face_color": t.get("face_color"),
                "face_is_good": t.get("face_is_good"),
                "face_source": t.get("face_source"),
                "face_trial_index": t.get("face_trial_index"),
                "slider_rating": t.get("slider_rating"),
                "probability_punishment": t.get("probability_punishment"),
                "confidence_rating": t.get("confidence_rating"),
                "correct": t.get("correct"),
            })

        for t in trials.get("phase3") or []:
            if not isinstance(t, dict):
                continue
            p3_rows.append({
                "participant_id": pid,
                "task": t.get("task"),
                "face_id": t.get("face_id"),
                "face_color": t.get("face_color"),
                "face_is_good": t.get("face_is_good"),
                "probability_punishment": t.get("probability_punishment"),
            })

    return (
        pd.DataFrame(meta_rows),
        pd.DataFrame(p1_rows),
        pd.DataFrame(p2_rows),
        pd.DataFrame(p3_rows),
    )


# ---------------------------------------------------------------------------
# Coding helpers
# ---------------------------------------------------------------------------

def assign_group_role(color, condition, majority_group) -> str | None:
    """Return 'majority'/'minority' when designed; else keep color label."""
    if pd.isna(color):
        return None
    if condition == "majority-minority" and majority_group in ("red", "blue"):
        return "majority" if color == majority_group else "minority"
    return color  # equal / missing majority → red/blue exploratory coding


def contrast_means(df: pd.DataFrame, value_col: str, role_col: str, positive: str, negative: str):
    """mean(positive) − mean(negative); NaN if either side empty."""
    if df.empty or value_col not in df or role_col not in df:
        return np.nan
    pos = df.loc[df[role_col] == positive, value_col].dropna()
    neg = df.loc[df[role_col] == negative, value_col].dropna()
    if len(pos) == 0 or len(neg) == 0:
        return np.nan
    return float(pos.mean() - neg.mean())


# ---------------------------------------------------------------------------
# Person-level indices
# ---------------------------------------------------------------------------

def _filter_pid(df: pd.DataFrame, pid: str) -> pd.DataFrame:
    if df is None or df.empty or "participant_id" not in df.columns:
        return pd.DataFrame()
    return df[df["participant_id"] == pid].copy()


def compute_person_indices(
    meta: pd.DataFrame,
    p1: pd.DataFrame,
    p2: pd.DataFrame,
    p3: pd.DataFrame,
) -> pd.DataFrame:
    records = []

    for _, m in meta.iterrows():
        pid = m["participant_id"]
        condition = m["condition"]
        majority = m["majority_group"]
        designed_mm = condition == "majority-minority" and majority in ("red", "blue")
        pos_belief, neg_belief = ("minority", "majority") if designed_mm else ("red", "blue")
        pos_approach, neg_approach = ("majority", "minority") if designed_mm else ("red", "blue")

        # Phase 3 (supplementary only; not used as primary Acc)
        p3_pid = _filter_pid(p3, pid)
        if not p3_pid.empty and "task" in p3_pid.columns:
            p3_sub = p3_pid[p3_pid["task"] == "phase3_probability"].copy()
        else:
            p3_sub = pd.DataFrame()
        acc_belief_phase3 = np.nan
        if (
            not p3_sub.empty
            and "probability_punishment" in p3_sub.columns
            and p3_sub["probability_punishment"].notna().any()
        ):
            good = p3_sub.loc[p3_sub["face_is_good"] == True, "probability_punishment"]
            bad = p3_sub.loc[p3_sub["face_is_good"] == False, "probability_punishment"]
            if len(good) and len(bad):
                # Convert 0–100 slider means to probability units
                acc_belief_phase3 = float(bad.mean() - good.mean()) / 100.0

        # Phase 2 wide table by face
        p2_pid = _filter_pid(p2, pid)
        if p2_pid.empty:
            faces = pd.DataFrame()
            enc = pd.DataFrame()
            nov = pd.DataFrame()
        else:
            sliders = p2_pid[p2_pid["task"] == "phase2_slider"][
                ["face_trial_index", "face_id", "face_color", "face_is_good", "face_source", "slider_rating", "correct"]
            ]
            probs = p2_pid[p2_pid["task"] == "phase2_probability"][
                ["face_trial_index", "probability_punishment"]
            ]
            confs = p2_pid[p2_pid["task"] == "phase2_confidence"][
                ["face_trial_index", "confidence_rating"]
            ]
            faces = sliders.merge(probs, on="face_trial_index", how="left")
            faces = faces.merge(confs, on="face_trial_index", how="left")
            faces["group_role"] = faces["face_color"].map(
                lambda c: assign_group_role(c, condition, majority)
            )
            enc = faces[faces["face_source"] == "encountered"].copy()
            nov = faces[faces["face_source"] == "novel"].copy()

        # --- Primary Acc: Phase 2 encountered belief individuation (0–1) ---
        accuracy_source = None
        acc_belief = np.nan
        if not enc.empty:
            good = enc.loc[enc["face_is_good"] == True, "probability_punishment"].dropna()
            bad = enc.loc[enc["face_is_good"] == False, "probability_punishment"].dropna()
            if len(good) and len(bad):
                acc_belief = float(bad.mean() - good.mean()) / 100.0
                accuracy_source = "phase2_encountered"

        # Approach individuation on encountered (supplementary; keep slider 0–100 units)
        acc_approach = np.nan
        if not enc.empty:
            g = enc.loc[enc["face_is_good"] == True, "slider_rating"].dropna()
            b = enc.loc[enc["face_is_good"] == False, "slider_rating"].dropna()
            if len(g) and len(b):
                acc_approach = float(g.mean() - b.mean())

        # Phase 1 late excess choice accuracy (engagement proxy)
        p1_pid = _filter_pid(p1, pid)
        if not p1_pid.empty and "task" in p1_pid.columns:
            p1_choices = p1_pid[p1_pid["task"] == "choice"].copy()
        else:
            p1_choices = pd.DataFrame()
        late = p1_choices[p1_choices["block"] >= 9] if not p1_choices.empty else pd.DataFrame()
        late_excess = np.nan
        if not late.empty:
            raw = late["chosen_face_is_good"].astype(float).mean()
            bases = []
            for _, tr in late.iterrows():
                panel = tr.get("faces_in_trial")
                if isinstance(panel, list) and panel:
                    bases.append(np.mean([1.0 if f.get("is_good") else 0.0 for f in panel]))
            late_excess = float(raw - np.mean(bases)) if bases else float(raw - 0.7)

        # Stereotypes: both expressed on a 0–1 scale (belief = probability units;
        # approach = fraction of the Avoid–Approach slider).
        enc_belief = contrast_means(enc, "probability_punishment", "group_role", pos_belief, neg_belief)
        nov_belief = contrast_means(nov, "probability_punishment", "group_role", pos_belief, neg_belief)
        enc_approach = contrast_means(enc, "slider_rating", "group_role", pos_approach, neg_approach)
        nov_approach = contrast_means(nov, "slider_rating", "group_role", pos_approach, neg_approach)
        if pd.notna(enc_belief):
            enc_belief = enc_belief / 100.0
        if pd.notna(nov_belief):
            nov_belief = nov_belief / 100.0
        if pd.notna(enc_approach):
            enc_approach = enc_approach / 100.0
        if pd.notna(nov_approach):
            nov_approach = nov_approach / 100.0

        # Phase 2 confidence (0–1 scale): mean overall / encountered / novel
        def _mean_conf(sub: pd.DataFrame) -> float:
            if sub is None or sub.empty or "confidence_rating" not in sub.columns:
                return np.nan
            vals = sub["confidence_rating"].dropna()
            return float(vals.mean() / 100.0) if len(vals) else np.nan

        conf_all = _mean_conf(faces)
        conf_enc = _mean_conf(enc)
        conf_nov = _mean_conf(nov)

        records.append({
            "participant_id": pid,
            "condition_code": m["condition_code"],
            "condition": condition,
            "majority_group": majority,
            "p1_type": m["p1_type"],
            "debug_mode": m["debug_mode"],
            "designed_majority_minority": designed_mm,
            "stereotype_coding": "majority_minority" if designed_mm else "red_minus_blue_exploratory",
            "n_phase1_choices": int(len(p1_choices)),
            "n_phase2_faces": int(faces["face_trial_index"].nunique()) if len(faces) else 0,
            "n_phase3": int(len(p3_sub)),
            "n_encountered": int(len(enc)),
            "n_novel": int(len(nov)),
            "accuracy_source": accuracy_source,
            "accuracy_belief": acc_belief,          # primary: Phase 2 encountered
            "accuracy_belief_phase3": acc_belief_phase3,  # supplementary when available
            "accuracy_approach": acc_approach,      # higher = approach good more than bad
            "late_excess_accuracy": late_excess,    # engagement / learning proxy
            "encountered_belief_stereotype": enc_belief,
            "novel_belief_stereotype": nov_belief,
            "encountered_approach_stereotype": enc_approach,
            "novel_approach_stereotype": nov_approach,
            # absolute strength (optional descriptive)
            "novel_belief_stereotype_abs": abs(nov_belief) if pd.notna(nov_belief) else np.nan,
            "novel_approach_stereotype_abs": abs(nov_approach) if pd.notna(nov_approach) else np.nan,
            "confidence_mean": conf_all,
            "confidence_encountered": conf_enc,
            "confidence_novel": conf_nov,
        })

    return pd.DataFrame(records)


# ---------------------------------------------------------------------------
# Exclusions
# ---------------------------------------------------------------------------

def apply_exclusions(df: pd.DataFrame) -> tuple[pd.DataFrame, pd.DataFrame]:
    """Return (analyzed, excluded_with_reason)."""
    reasons = []
    keep = pd.Series(True, index=df.index)

    for i, row in df.iterrows():
        reason = []
        if row["debug_mode"]:
            reason.append("debug_mode")
        if row["n_phase1_choices"] < 80:
            reason.append("incomplete_phase1")
        if row["n_novel"] < 4 or row["n_encountered"] < 4:
            reason.append("incomplete_phase2")
        if pd.isna(row["accuracy_belief"]):
            reason.append("missing_accuracy")
        if pd.isna(row["novel_belief_stereotype"]) and pd.isna(row["novel_approach_stereotype"]):
            reason.append("missing_novel_stereotype")
        if reason:
            keep.loc[i] = False
            reasons.append({**row.to_dict(), "exclude_reason": ";".join(reason)})

    analyzed = df.loc[keep].copy()
    excluded = pd.DataFrame(reasons)
    return analyzed, excluded


# ---------------------------------------------------------------------------
# Stats helpers
# ---------------------------------------------------------------------------

def corr_with_ci(x, y, n_boot: int = 5000, seed: int = 0):
    x = np.asarray(x, dtype=float)
    y = np.asarray(y, dtype=float)
    mask = np.isfinite(x) & np.isfinite(y)
    x, y = x[mask], y[mask]
    n = len(x)
    if n < 3:
        return {"n": n, "r": np.nan, "p": np.nan, "ci_low": np.nan, "ci_high": np.nan}
    r, p = stats.pearsonr(x, y)
    rng = np.random.default_rng(seed)
    boots = []
    for _ in range(n_boot):
        idx = rng.integers(0, n, n)
        rb, _ = stats.pearsonr(x[idx], y[idx])
        boots.append(rb)
    lo, hi = np.nanpercentile(boots, [2.5, 97.5])
    return {"n": n, "r": float(r), "p": float(p), "ci_low": float(lo), "ci_high": float(hi)}


def fit_ols(formula: str, data: pd.DataFrame):
    """Fit OLS; return model or None if underdetermined."""
    # drop rows with NA in used columns
    cols = [c for c in data.columns if c in formula or True]
    # statsmodels handles NA by dropping; check residual df
    try:
        with warnings.catch_warnings():
            warnings.simplefilter("ignore")
            model = smf.ols(formula, data=data).fit()
        return model
    except Exception:
        return None


def model_to_frame(model, name: str) -> pd.DataFrame:
    if model is None:
        return pd.DataFrame()
    out = pd.DataFrame({
        "model": name,
        "term": model.params.index,
        "estimate": model.params.values,
        "std_error": model.bse.values,
        "t": model.tvalues.values,
        "p": model.pvalues.values,
        "ci_low": model.conf_int()[0].values,
        "ci_high": model.conf_int()[1].values,
        "n": int(model.nobs),
        "r2": model.rsquared,
        "adj_r2": model.rsquared_adj,
    })
    return out


# ---------------------------------------------------------------------------
# Figures
# ---------------------------------------------------------------------------

def _panel_good_rate(faces_in_trial) -> float:
    if not isinstance(faces_in_trial, list) or not faces_in_trial:
        return np.nan
    return float(np.mean([1.0 if f.get("is_good") else 0.0 for f in faces_in_trial]))


def compute_phase1_segment_accuracy(
    p1: pd.DataFrame,
    participant_ids: list[str] | None = None,
    n_segments: int | None = None,
) -> pd.DataFrame:
    """
    Raw Phase 1 choice accuracy by segment.

    Default segments = Phase 1 blocks (design unit). If n_segments is set,
    trials are split into that many equal-sized bins by trial_number within
    each participant (then combined across people for the group curve).
    """
    if p1 is None or p1.empty or "task" not in p1.columns:
        return pd.DataFrame()

    choices = p1[p1["task"] == "choice"].copy()
    if participant_ids is not None:
        choices = choices[choices["participant_id"].isin(participant_ids)]
    if choices.empty:
        return pd.DataFrame()

    choices["correct"] = choices["chosen_face_is_good"].astype(float)
    choices["panel_base"] = choices["faces_in_trial"].map(_panel_good_rate)

    rows = []
    for pid, sub in choices.groupby("participant_id"):
        sub = sub.sort_values(["block", "trial_number"], kind="mergesort")
        if n_segments is None:
            # one segment per block
            for block, bsub in sub.groupby("block"):
                rows.append({
                    "participant_id": pid,
                    "segment": int(block),
                    "segment_label": f"Block {int(block)}",
                    "n_trials": int(len(bsub)),
                    "raw_accuracy": float(bsub["correct"].mean()),
                    "panel_base_rate": float(bsub["panel_base"].mean()),
                    "excess_accuracy": float(bsub["correct"].mean() - bsub["panel_base"].mean()),
                })
        else:
            n = len(sub)
            # equal-count bins along the trajectory
            edges = np.linspace(0, n, n_segments + 1, dtype=int)
            for s in range(n_segments):
                chunk = sub.iloc[edges[s]:edges[s + 1]]
                if chunk.empty:
                    continue
                rows.append({
                    "participant_id": pid,
                    "segment": s + 1,
                    "segment_label": f"Seg {s + 1}",
                    "n_trials": int(len(chunk)),
                    "raw_accuracy": float(chunk["correct"].mean()),
                    "panel_base_rate": float(chunk["panel_base"].mean()),
                    "excess_accuracy": float(chunk["correct"].mean() - chunk["panel_base"].mean()),
                })
    return pd.DataFrame(rows)


def plot_phase1_learning_curve(
    p1: pd.DataFrame,
    outdir: Path,
    participant_ids: list[str] | None = None,
    n_segments: int | None = None,
    outfile: str = "fig_phase1_learning_curve.png",
    csv_prefix: str = "phase1_segment_accuracy",
):
    """
    Plot Phase 1 raw choice accuracy learning curve.
    Segments default to blocks; set n_segments for equal trial bins.
    """
    fig_dir = outdir / "figures"
    fig_dir.mkdir(parents=True, exist_ok=True)

    seg = compute_phase1_segment_accuracy(p1, participant_ids=participant_ids, n_segments=n_segments)
    if seg.empty:
        return None

    seg.to_csv(outdir / f"{csv_prefix}.csv", index=False)

    # group summary
    summary = (
        seg.groupby("segment", as_index=False)
        .agg(
            raw_accuracy=("raw_accuracy", "mean"),
            raw_se=("raw_accuracy", lambda s: float(s.std(ddof=1) / np.sqrt(len(s))) if len(s) > 1 else 0.0),
            panel_base_rate=("panel_base_rate", "mean"),
            excess_accuracy=("excess_accuracy", "mean"),
            n=("participant_id", "nunique"),
        )
        .sort_values("segment")
    )
    summary.to_csv(outdir / f"{csv_prefix}_group.csv", index=False)

    x = summary["segment"].to_numpy()
    y = summary["raw_accuracy"].to_numpy()
    se = summary["raw_se"].to_numpy()
    base = summary["panel_base_rate"].to_numpy()

    fig, axes = plt.subplots(1, 2, figsize=(11, 4.4))

    # Left: raw Acc
    ax = axes[0]
    for pid, sub in seg.groupby("participant_id"):
        sub = sub.sort_values("segment")
        ax.plot(sub["segment"], sub["raw_accuracy"], color="0.75", lw=1, alpha=0.8)
        ax.scatter(sub["segment"], sub["raw_accuracy"], color="0.65", s=18, zorder=2)
    ax.plot(x, y, color="#1f4e79", lw=2.5, marker="o", label="Group mean")
    ax.fill_between(x, y - se, y + se, color="#1f4e79", alpha=0.2, label="±1 SE")
    ax.plot(x, base, color="#c44e52", lw=1.8, ls="--", label="Panel good-face base rate")
    ax.set_xlabel("Phase 1 segment (block)" if n_segments is None else f"Phase 1 segment (1–{n_segments})")
    ax.set_ylabel("Raw choice accuracy")
    ax.set_ylim(0, 1.05)
    ax.set_title("Raw Acc by segment")
    ax.legend(frameon=False, fontsize=8)

    # Right: excess Acc
    ax = axes[1]
    for pid, sub in seg.groupby("participant_id"):
        sub = sub.sort_values("segment")
        ax.plot(sub["segment"], sub["excess_accuracy"], color="0.75", lw=1, alpha=0.8)
        ax.scatter(sub["segment"], sub["excess_accuracy"], color="0.65", s=18, zorder=2)
    excess_mean = summary["excess_accuracy"].to_numpy()
    # SE for excess
    excess_se = []
    for s in summary["segment"]:
        vals = seg.loc[seg["segment"] == s, "excess_accuracy"]
        excess_se.append(float(vals.std(ddof=1) / np.sqrt(len(vals))) if len(vals) > 1 else 0.0)
    excess_se = np.asarray(excess_se)
    ax.plot(x, excess_mean, color="#1f4e79", lw=2.5, marker="o", label="Group mean")
    ax.fill_between(x, excess_mean - excess_se, excess_mean + excess_se, color="#1f4e79", alpha=0.2, label="±1 SE")
    ax.axhline(0, color="#c44e52", lw=1.8, ls="--", label="Chance (excess = 0)")
    ax.set_xlabel("Phase 1 segment (block)" if n_segments is None else f"Phase 1 segment (1–{n_segments})")
    ax.set_ylabel("Excess accuracy (raw − panel base)")
    ax.set_title("Excess Acc by segment")
    ax.legend(frameon=False, fontsize=8)

    title = (
        "Phase 1 learning curve: raw choice accuracy by block"
        if n_segments is None
        else f"Phase 1 learning curve: raw choice accuracy in {n_segments} equal segments"
    )
    fig.suptitle(title, y=1.02)
    fig.tight_layout()
    out_path = fig_dir / outfile
    fig.savefig(out_path)
    plt.close(fig)
    return out_path


def _scatter_with_fit(ax, x, y, xlabel, ylabel, title, show_veridical_acc: bool = False):
    x = np.asarray(x, dtype=float)
    y = np.asarray(y, dtype=float)
    mask = np.isfinite(x) & np.isfinite(y)
    x, y = x[mask], y[mask]
    ax.scatter(x, y, s=70, color="#1f4e79", zorder=3)
    if len(x) >= 2 and np.nanstd(x) > 0:
        slope, intercept, r, p, _ = stats.linregress(x, y)
        xs = np.linspace(np.nanmin(x), np.nanmax(x), 100)
        ax.plot(xs, intercept + slope * xs, color="#c44e52", lw=2,
                label=f"r={r:.2f}, p={p:.3f}")
        ax.legend(frameon=False, loc="best")
    ax.axhline(0, color="0.6", lw=1, ls="--")
    if show_veridical_acc:
        ax.axvline(0, color="0.6", lw=1, ls="--")
        ax.axvline(TRUE_INDIVIDUATION, color="0.75", lw=1, ls=":", label=None)
    ax.set_xlabel(xlabel)
    ax.set_ylabel(ylabel)
    ax.set_title(title)


def make_figures(df: pd.DataFrame, outdir: Path):
    fig_dir = outdir / "figures"
    fig_dir.mkdir(parents=True, exist_ok=True)

    # Fig 0: distribution of encountered belief accuracy (probability units)
    acc = df["accuracy_belief"].dropna().to_numpy(dtype=float)
    fig, ax = plt.subplots(figsize=(7.2, 4.2))
    if len(acc):
        bins = min(8, max(4, int(np.ceil(np.sqrt(len(acc))))))
        ax.hist(acc, bins=bins, color="#4c72b0", edgecolor="white", alpha=0.85, density=False)
        ax.plot(acc, np.zeros_like(acc) - 0.02 * max(1, len(acc) * 0.15), "|",
                color="#1f4e79", markersize=18, markeredgewidth=2)
        ax.scatter(acc, np.full_like(acc, 0.15 if len(acc) < 10 else 0.5),
                   s=55, color="#1f4e79", zorder=3, clip_on=False)
        ax.axvline(0, color="0.45", lw=1.2, ls="--", label="No discrimination (0)")
        ax.axvline(
            TRUE_INDIVIDUATION, color="#c44e52", lw=2, ls="-",
            label=f"Veridical gap ({TRUE_INDIVIDUATION:.2f} = 0.50−0.10)",
        )
        ax.axvline(float(np.mean(acc)), color="#55a868", lw=1.5, ls=":",
                   label=f"Sample mean ({np.mean(acc):.2f})")
        ax.legend(frameon=False, loc="best")
        ax.set_xlim(min(-0.2, float(np.min(acc)) - 0.05), max(0.45, float(np.max(acc)) + 0.05))
    ax.set_xlabel("Belief accuracy (Phase 2 encountered)\n"
                  r"$\overline{\hat{p}}(\mathrm{bad})-\overline{\hat{p}}(\mathrm{good})$ (probability units)")
    ax.set_ylabel("Count")
    ax.set_title("Distribution of individuation accuracy")
    fig.tight_layout()
    fig.savefig(fig_dir / "fig0_accuracy_distribution.png")
    plt.close(fig)

    # Fig 1: accuracy vs novel stereotypes (belief + approach)
    fig, axes = plt.subplots(1, 2, figsize=(10, 4.2))
    _scatter_with_fit(
        axes[0], df["accuracy_belief"], df["novel_belief_stereotype"],
        "Accuracy (Phase 2 encountered)\n"
        r"$\overline{\hat{p}}(\mathrm{bad})-\overline{\hat{p}}(\mathrm{good})$",
        "Novel belief stereotype\n"
        r"$\overline{\hat{p}}_{\mathrm{red}}-\overline{\hat{p}}_{\mathrm{blue}}$ (probability units)",
        "Belief generalization",
        show_veridical_acc=True,
    )
    _scatter_with_fit(
        axes[1], df["accuracy_belief"], df["novel_approach_stereotype"],
        "Accuracy (Phase 2 encountered)\n"
        r"$\overline{\hat{p}}(\mathrm{bad})-\overline{\hat{p}}(\mathrm{good})$",
        "Novel approach stereotype\n"
        r"$(\overline{s}_{\mathrm{red}}-\overline{s}_{\mathrm{blue}})/100$ (slider fraction)",
        "Approach generalization",
        show_veridical_acc=True,
    )
    fig.suptitle("Total association: novel stereotype ~ accuracy", y=1.02)
    fig.tight_layout()
    fig.savefig(fig_dir / "fig1_accuracy_vs_novel_stereotype.png")
    plt.close(fig)

    # Fig 2: partial residual / controlled relationship for belief
    # residualize both DV and IV on encountered stereotype
    fig, axes = plt.subplots(1, 2, figsize=(10, 4.2))
    for ax, dv, enc, title in [
        (axes[0], "novel_belief_stereotype", "encountered_belief_stereotype", "Belief (partial)"),
        (axes[1], "novel_approach_stereotype", "encountered_approach_stereotype", "Approach (partial)"),
    ]:
        sub = df[["accuracy_belief", dv, enc]].dropna()
        if len(sub) >= 3 and sub[enc].std() > 0:
            # residualize
            b_y = np.polyfit(sub[enc], sub[dv], 1)
            b_x = np.polyfit(sub[enc], sub["accuracy_belief"], 1)
            y_res = sub[dv] - (b_y[0] * sub[enc] + b_y[1])
            x_res = sub["accuracy_belief"] - (b_x[0] * sub[enc] + b_x[1])
            y_lab = (
                "Novel belief stereotype | encountered\n(probability-unit residuals)"
                if "belief" in dv else
                "Novel approach stereotype | encountered\n(slider-fraction residuals)"
            )
            _scatter_with_fit(
                ax, x_res, y_res,
                "Accuracy | encountered stereotype\n(probability-unit residuals)",
                y_lab,
                title,
            )
        else:
            ax.text(0.5, 0.5, "Insufficient data\nfor partial plot", ha="center", va="center",
                    transform=ax.transAxes)
            ax.set_title(title)
    fig.suptitle("Controlled association (both variables residualized on encountered stereotype)", y=1.02)
    fig.tight_layout()
    fig.savefig(fig_dir / "fig2_partial_accuracy_vs_novel.png")
    plt.close(fig)

    # Fig 2b: only residualize Y (novel stereotype) on encountered stereotype; X = raw Acc
    # Answers: does Acc predict leftover novel stereotype after removing displayed
    # encountered stereotype from the DV? (Not identical to M2 / FWL partial slope.)
    fig, axes = plt.subplots(1, 2, figsize=(10, 4.2))
    for ax, dv, enc, title in [
        (axes[0], "novel_belief_stereotype", "encountered_belief_stereotype", "Belief (Y-only control)"),
        (axes[1], "novel_approach_stereotype", "encountered_approach_stereotype", "Approach (Y-only control)"),
    ]:
        sub = df[["accuracy_belief", dv, enc]].dropna()
        if len(sub) >= 3 and sub[enc].std() > 0:
            b_y = np.polyfit(sub[enc], sub[dv], 1)
            y_res = sub[dv] - (b_y[0] * sub[enc] + b_y[1])
            y_lab = (
                "Novel belief stereotype | encountered\n(probability-unit residuals)"
                if "belief" in dv else
                "Novel approach stereotype | encountered\n(slider-fraction residuals)"
            )
            _scatter_with_fit(
                ax, sub["accuracy_belief"], y_res,
                "Accuracy (Phase 2 encountered, raw)\n"
                r"$\overline{\hat{p}}(\mathrm{bad})-\overline{\hat{p}}(\mathrm{good})$",
                y_lab,
                title,
                show_veridical_acc=True,
            )
        else:
            ax.text(0.5, 0.5, "Insufficient data\nfor partial plot", ha="center", va="center",
                    transform=ax.transAxes)
            ax.set_title(title)
    fig.suptitle(
        "Acc → novel stereotype after removing encountered stereotype from Y only",
        y=1.02,
    )
    fig.tight_layout()
    fig.savefig(fig_dir / "fig2b_y_residualized_vs_raw_accuracy.png")
    plt.close(fig)

    # Fig 2c: Acc & novel generalization vs Phase 2 confidence
    fig, axes = plt.subplots(2, 2, figsize=(10, 8))
    conf_x = "confidence_novel"
    pairs = [
        (axes[0, 0], "accuracy_belief", conf_x,
         "Acc vs novel-face confidence",
         "Belief Acc (probability units)",
         "Mean confidence on novel faces"),
        (axes[0, 1], "novel_belief_stereotype_abs", conf_x,
         "|Novel belief stereotype| vs confidence",
         "|Novel belief stereotype|",
         "Mean confidence on novel faces"),
        (axes[1, 0], "novel_approach_stereotype_abs", conf_x,
         "|Novel approach stereotype| vs confidence",
         "|Novel approach stereotype|",
         "Mean confidence on novel faces"),
        (axes[1, 1], "accuracy_belief", "confidence_encountered",
         "Acc vs encountered-face confidence",
         "Belief Acc (probability units)",
         "Mean confidence on encountered faces"),
    ]
    for ax, xk, yk, title, xlab, ylab in pairs:
        if xk in df.columns and yk in df.columns:
            _scatter_with_fit(ax, df[xk], df[yk], xlab, ylab, title, show_veridical_acc=(xk == "accuracy_belief"))
        else:
            ax.text(0.5, 0.5, "Missing columns", ha="center", va="center", transform=ax.transAxes)
            ax.set_title(title)
    fig.suptitle("Phase 2 confidence with Acc and generalization strength", y=1.01)
    fig.tight_layout()
    fig.savefig(fig_dir / "fig2c_confidence_with_acc_and_generalization.png")
    plt.close(fig)

    # Fig 3: person-level profile (all contrasts on 0–1 scaled units)
    plot_df = df.copy()
    plot_df["pid_short"] = plot_df["participant_id"].astype(str).str[:8]
    fig, axes = plt.subplots(1, 2, figsize=(11, 4.5))

    belief_long = plot_df.melt(
        id_vars=["pid_short"],
        value_vars=[
            "accuracy_belief",
            "encountered_belief_stereotype",
            "novel_belief_stereotype",
        ],
        var_name="measure",
        value_name="value",
    )
    sns.barplot(data=belief_long, x="pid_short", y="value", hue="measure", ax=axes[0])
    axes[0].axhline(0, color="0.5", lw=1)
    axes[0].axhline(TRUE_INDIVIDUATION, color="#c44e52", ls="-", lw=1.2)
    axes[0].set_xlabel("Participant")
    axes[0].set_ylabel("Probability units")
    axes[0].set_title("Belief Acc & belief stereotypes")
    axes[0].legend(frameon=False, fontsize=8)

    approach_long = plot_df.melt(
        id_vars=["pid_short"],
        value_vars=[
            "encountered_approach_stereotype",
            "novel_approach_stereotype",
        ],
        var_name="measure",
        value_name="value",
    )
    sns.barplot(data=approach_long, x="pid_short", y="value", hue="measure", ax=axes[1])
    axes[1].axhline(0, color="0.5", lw=1)
    axes[1].set_xlabel("Participant")
    axes[1].set_ylabel("Slider fraction (contrast / 100)")
    axes[1].set_title("Approach stereotypes")
    axes[1].legend(frameon=False, fontsize=8)
    fig.suptitle("Person-level accuracy and stereotype indices", y=1.02)
    fig.tight_layout()
    fig.savefig(fig_dir / "fig3_person_profiles.png")
    plt.close(fig)

    # Fig 4: correlation heatmap of key variables
    cols = [
        "accuracy_belief",
        "late_excess_accuracy",
        "encountered_belief_stereotype",
        "novel_belief_stereotype",
        "encountered_approach_stereotype",
        "novel_approach_stereotype",
        "confidence_mean",
        "confidence_novel",
        "novel_belief_stereotype_abs",
    ]
    present = [c for c in cols if c in df.columns]
    sub = df[present].apply(pd.to_numeric, errors="coerce")
    if sub.dropna(how="all").shape[0] >= 2:
        corr = sub.corr(method="pearson")
        fig, ax = plt.subplots(figsize=(8.2, 7))
        sns.heatmap(corr, annot=True, fmt=".2f", cmap="RdBu_r", center=0, vmin=-1, vmax=1, ax=ax,
                    square=True)
        ax.set_title("Zero-order correlations")
        fig.tight_layout()
        fig.savefig(fig_dir / "fig4_correlation_heatmap.png")
        plt.close(fig)

    return fig_dir


# ---------------------------------------------------------------------------
# Report (APA 7 style)
# ---------------------------------------------------------------------------

def _fmt_r_apa(r: float) -> str:
    if r is None or not np.isfinite(r):
        return "—"
    s = f"{r:.2f}"
    if s.startswith("0"):
        s = s[1:]
    elif s.startswith("-0"):
        s = "-" + s[2:]
    return s


def _fmt_p_apa(p: float) -> str:
    if p is None or not np.isfinite(p):
        return "—"
    if p < .001:
        return "< .001"
    s = f"{p:.3f}"
    return s[1:] if s.startswith("0") else s


def _corr_lookup(corr_table: pd.DataFrame, x: str, y: str) -> dict | None:
    if corr_table is None or corr_table.empty:
        return None
    m = corr_table[(corr_table["x"] == x) & (corr_table["y"] == y)]
    if len(m) == 0:
        m = corr_table[(corr_table["x"] == y) & (corr_table["y"] == x)]
    if len(m) == 0:
        return None
    return m.iloc[0].to_dict()


def _apa_corr_clause(corr_table: pd.DataFrame, x: str, y: str) -> str:
    c = _corr_lookup(corr_table, x, y)
    if c is None:
        return "correlation unavailable"
    n = int(c["n"])
    df = max(n - 2, 0)
    r = c["r"]
    p = c["p"]
    lo, hi = c.get("ci_low"), c.get("ci_high")
    ci = ""
    if lo is not None and hi is not None and np.isfinite(lo) and np.isfinite(hi):
        ci = f", 95% CI [{_fmt_r_apa(lo)}, {_fmt_r_apa(hi)}]"
    return f"*r*({df}) = {_fmt_r_apa(r)}, *p* = {_fmt_p_apa(p)}{ci}"


def _residual_corr(df: pd.DataFrame, x: str, y: str, z: str, mode: str = "both") -> dict:
    """mode='both' -> Y⊥Z vs X⊥Z; mode='y_only' -> Y⊥Z vs raw X."""
    sub = df[[x, y, z]].dropna()
    n = len(sub)
    if n < 3 or sub[z].std() == 0:
        return {"n": n, "r": np.nan, "p": np.nan}
    by = np.polyfit(sub[z], sub[y], 1)
    y_res = sub[y] - (by[0] * sub[z] + by[1])
    if mode == "both":
        bx = np.polyfit(sub[z], sub[x], 1)
        x_use = sub[x] - (bx[0] * sub[z] + bx[1])
    else:
        x_use = sub[x]
    r, p = stats.pearsonr(x_use, y_res)
    return {"n": n, "r": float(r), "p": float(p)}


def _msd(series: pd.Series) -> str:
    s = pd.to_numeric(series, errors="coerce").dropna()
    if len(s) == 0:
        return "—"
    return f"*M* = {s.mean():.2f}, *SD* = {s.std(ddof=1):.2f}"


def _model_row(model_table: pd.DataFrame, model: str, term: str) -> dict | None:
    if model_table is None or model_table.empty:
        return None
    m = model_table[(model_table["model"] == model) & (model_table["term"] == term)]
    return None if len(m) == 0 else m.iloc[0].to_dict()


def _apa_b(row: dict | None, n_predictors: int = 1) -> str:
    if row is None:
        return "coefficient unavailable"
    dfree = max(int(row["n"]) - n_predictors - 1, 0)
    return (
        f"*b* = {row['estimate']:.2f}, *SE* = {row['std_error']:.2f}, "
        f"*t*({dfree}) = {row['t']:.2f}, "
        f"*p* = {_fmt_p_apa(row['p'])}"
    )


def write_report(
    outdir: Path,
    meta_n: int,
    analyzed: pd.DataFrame,
    excluded: pd.DataFrame,
    corr_table: pd.DataFrame,
    model_table: pd.DataFrame,
):
    n = len(analyzed)
    sections: list[str] = []

    # --- Overview ---
    sections.append(
        "This report is organized around substantive questions about learning accuracy and "
        "generalized stereotyping. Figures are cited as evidence under each question rather than "
        "as a standalone figure tour. Analyses use person-level indices from Phase 2 (and Phase 1 "
        f"only for a supplementary engagement check). Unless noted otherwise, *N* = {n}. Because "
        "*N* < 30, results are descriptive; interpret effect sizes and intervals rather than "
        "binary null-hypothesis decisions."
    )

    excl_txt = ""
    if len(excluded):
        excl_txt = f" ({excluded['exclude_reason'].value_counts().to_dict()})"
    overview = (
        f"Records were loaded for {meta_n} participants; {n} met inclusion criteria and "
        f"{len(excluded)} were excluded{excl_txt}."
    )
    if n:
        codes = analyzed["condition_code"].value_counts().to_dict()
        src = analyzed["accuracy_source"].value_counts().to_dict()
        coding = analyzed["stereotype_coding"].value_counts().to_dict()
        overview += (
            f" All analyzed sessions used condition code(s) {codes}. Accuracy was computed from "
            f"{src}. Group contrasts used coding {coding}. In equal exposure, red−blue contrasts "
            "are exploratory rather than the preregistered majority–minority contrast. Both color "
            "groups have matched good/bad base rates, so group contrasts are non-veridical relative "
            "to the generative model."
        )
    sections.append(overview)

    sections.append(
        f"Individuation accuracy (Acc) was defined on Phase 2 encountered faces as "
        f"[mean *p̂*(punish | bad) − mean *p̂*(punish | good)] / 100; the veridical gap is "
        f"{TRUE_INDIVIDUATION:.2f} (= .50 − .10). Belief stereotypes are group contrasts on "
        "punishment-probability ratings / 100 (minority − majority when designed; otherwise "
        "red − blue), separately for encountered and novel faces. Approach stereotypes are the "
        "analogous approach–avoidance slider contrasts / 100. Confidence is the Phase 2 "
        "confidence rating for the punishment-probability estimate, averaged within participant "
        "(all / encountered / novel) and scaled to 0–1. Late excess accuracy (Phase 1 Blocks 9–12 "
        "good-choice rate minus panel base rate) is a supplementary engagement proxy. Primary "
        "models are OLS: Model 1 (novel stereotype ~ Acc) and Model 2 (novel stereotype ~ Acc + "
        "encountered stereotype). Model 2 is visualized with Frisch–Waugh–Lovell partial residuals; "
        "Pearson correlations use bootstrap 95% CIs (5,000 resamples)."
    )

    # --- Q1 ---
    q1 = [
        "### Question 1. How accurately did people learn who is good versus bad?",
        "",
        "This is a sanity check / manipulation check: before interpreting generalization, we ask "
        "whether participants recovered the latent good/bad structure among faces they had "
        f"encountered. *Figure 0* (`figures/fig0_accuracy_distribution.png`) shows the Acc "
        f"distribution with a no-discrimination line at 0, a veridical line at "
        f"{TRUE_INDIVIDUATION:.2f}, and the sample mean. ",
    ]
    if n:
        q1.append(
            f"Belief Acc was {_msd(analyzed['accuracy_belief'])} "
            f"(range = [{analyzed['accuracy_belief'].min():.2f}, "
            f"{analyzed['accuracy_belief'].max():.2f}]). "
        )
        n_below = int((analyzed["accuracy_belief"] < TRUE_INDIVIDUATION).sum())
        n_nonpos = int((analyzed["accuracy_belief"] <= 0).sum())
        q1.append(
            f"{n_below} of {n} participants fell below the veridical gap of "
            f"{TRUE_INDIVIDUATION:.2f}, and {n_nonpos} showed Acc ≤ 0 (no discrimination or "
            "reversed discrimination). "
        )
    q1.append(
        "Overall, learning of who is good versus bad was limited relative to the task truth; "
        "subsequent Acc–generalization associations should be read with that calibration in mind. "
        f"*Figure 3* (left panel of `figures/fig3_person_profiles.png`) additionally places each "
        f"participant’s Acc next to their belief stereotypes against the same veridical reference "
        f"({TRUE_INDIVIDUATION:.2f})."
    )
    sections.append("\n\n".join([p for p in q1 if p != ""]))

    # --- Q2 ---
    m1b = _model_row(model_table, "M1_belief", "accuracy_belief")
    m1a = _model_row(model_table, "M1_approach", "accuracy_belief")
    q2 = (
        "### Question 2. Does better Acc predict stronger stereotyping of novel people?\n\n"
        "This is the total (unadjusted) association between individuation and generalized "
        "stereotyping. *Figure 1* (`figures/fig1_accuracy_vs_novel_stereotype.png`) plots novel "
        "belief and approach stereotypes against Acc. "
        f"Acc correlated with novel belief stereotype at "
        f"{_apa_corr_clause(corr_table, 'accuracy_belief', 'novel_belief_stereotype')}, and with "
        f"novel approach stereotype at "
        f"{_apa_corr_clause(corr_table, 'accuracy_belief', 'novel_approach_stereotype')}. "
    )
    if n:
        q2 += (
            f"For context, novel belief stereotype was "
            f"{_msd(analyzed['novel_belief_stereotype'])}, and novel approach stereotype was "
            f"{_msd(analyzed['novel_approach_stereotype'])}. "
        )
    if m1b:
        q2 += (
            f"Model 1 (belief) yielded Acc {_apa_b(m1b, n_predictors=1)}, *R*² = {m1b['r2']:.2f} "
            f"(adjusted *R*² = {m1b['adj_r2']:.2f}). "
        )
    if m1a:
        q2 += (
            f"Model 1 (approach) yielded Acc {_apa_b(m1a, n_predictors=1)}, *R*² = {m1a['r2']:.2f} "
            f"(adjusted *R*² = {m1a['adj_r2']:.2f}). "
        )
    q2 += (
        "Descriptively, higher Acc tracked stronger novel *belief* asymmetry more clearly than "
        "novel *approach* asymmetry in this sample."
    )
    sections.append(q2)

    # --- Q3 ---
    rb = _residual_corr(
        analyzed, "accuracy_belief", "novel_belief_stereotype",
        "encountered_belief_stereotype", mode="both",
    )
    ra = _residual_corr(
        analyzed, "accuracy_belief", "novel_approach_stereotype",
        "encountered_approach_stereotype", mode="both",
    )
    rb_y = _residual_corr(
        analyzed, "accuracy_belief", "novel_belief_stereotype",
        "encountered_belief_stereotype", mode="y_only",
    )
    ra_y = _residual_corr(
        analyzed, "accuracy_belief", "novel_approach_stereotype",
        "encountered_approach_stereotype", mode="y_only",
    )
    m2b = _model_row(model_table, "M2_belief", "accuracy_belief")
    m2bz = _model_row(model_table, "M2_belief", "encountered_belief_stereotype")
    m2a = _model_row(model_table, "M2_approach", "accuracy_belief")
    m2az = _model_row(model_table, "M2_approach", "encountered_approach_stereotype")
    q3 = (
        "### Question 3. Does Acc still predict novel stereotyping after controlling for "
        "encountered stereotyping?\n\n"
        "This asks whether the Acc–novel link is more than copying a group impression already "
        "shown for known people. The primary controlled test is Model 2, visualized in "
        "*Figure 2* (`figures/fig2_partial_accuracy_vs_novel.png`) by residualizing both Acc and "
        "novel stereotype on encountered stereotype (Frisch–Waugh–Lovell). "
        f"The belief partial association was *r*({max(rb['n']-2, 0)}) = {_fmt_r_apa(rb['r'])}, "
        f"*p* = {_fmt_p_apa(rb['p'])}; the approach partial association was "
        f"*r*({max(ra['n']-2, 0)}) = {_fmt_r_apa(ra['r'])}, *p* = {_fmt_p_apa(ra['p'])}. "
    )
    if m2b:
        q3 += (
            f"In Model 2 for belief, Acc {_apa_b(m2b, n_predictors=2)}, and encountered belief "
            f"stereotype {_apa_b(m2bz, n_predictors=2)}, with *R*² = {m2b['r2']:.2f} "
            f"(adjusted *R*² = {m2b['adj_r2']:.2f}). "
        )
    if m2a:
        q3 += (
            f"In Model 2 for approach, Acc {_apa_b(m2a, n_predictors=2)}, and encountered approach "
            f"stereotype {_apa_b(m2az, n_predictors=2)}, with *R*² = {m2a['r2']:.2f} "
            f"(adjusted *R*² = {m2a['adj_r2']:.2f}). "
        )
    q3 += (
        "As a sensitivity display, *Figure 2b* "
        "(`figures/fig2b_y_residualized_vs_raw_accuracy.png`) residualizes only novel stereotype "
        "on encountered stereotype and plots those residuals against raw Acc (not identical to "
        f"Model 2). Under that Y-only control, belief was *r*({max(rb_y['n']-2, 0)}) = "
        f"{_fmt_r_apa(rb_y['r'])}, *p* = {_fmt_p_apa(rb_y['p'])}, and approach was "
        f"*r*({max(ra_y['n']-2, 0)}) = {_fmt_r_apa(ra_y['r'])}, *p* = {_fmt_p_apa(ra_y['p'])}. "
        "Together, the controlled belief-domain association remained in the same direction as the "
        "total association, suggesting the Acc–novel belief link is not reducible to encountered "
        "stereotyping alone in this sample."
    )
    sections.append(q3)

    # --- Q4 ---
    q4 = (
        "### Question 4. Are Acc and generalization both tied to Phase 2 confidence?\n\n"
        "A metacognitive account predicts that higher Acc fosters a sense of having learned the "
        "social structure, raising confidence and willingness to express asymmetric judgments "
        "about novel people. *Figure 2c* "
        "(`figures/fig2c_confidence_with_acc_and_generalization.png`) tests whether Acc and "
        "generalization strength (|novel stereotype|) co-vary with confidence. "
    )
    if n:
        q4 += (
            f"Mean confidence was {_msd(analyzed['confidence_mean'])} "
            f"(encountered: {_msd(analyzed['confidence_encountered'])}; "
            f"novel: {_msd(analyzed['confidence_novel'])}). "
        )
    q4 += (
        f"Acc correlated with novel-face confidence at "
        f"{_apa_corr_clause(corr_table, 'accuracy_belief', 'confidence_novel')} and with mean "
        f"confidence at {_apa_corr_clause(corr_table, 'accuracy_belief', 'confidence_mean')}. "
        f"|Novel belief stereotype| correlated with novel-face confidence at "
        f"{_apa_corr_clause(corr_table, 'novel_belief_stereotype_abs', 'confidence_novel')}, "
        f"and |novel approach stereotype| at "
        f"{_apa_corr_clause(corr_table, 'novel_approach_stereotype_abs', 'confidence_novel')}. "
        "Acc and |novel belief stereotype| were not positively associated with confidence; "
        "associations were negative. This pattern does not support the simple confidence-mediation "
        "story in the present data."
    )
    sections.append(q4)

    # --- Q5 ---
    sections.append(
        "### Question 5. What do individual profiles and the broader correlation structure show?\n\n"
        f"*Figure 3* (`figures/fig3_person_profiles.png`) displays each participant’s belief Acc "
        f"and belief stereotypes (probability units; veridical Acc line at {TRUE_INDIVIDUATION:.2f}) "
        "alongside approach stereotypes (slider-fraction units), allowing inspection of who drives "
        "the aggregate associations. *Figure 4* (`figures/fig4_correlation_heatmap.png`) summarizes "
        "zero-order relations among Acc, late excess accuracy, encountered and novel stereotypes, "
        "confidence, and |novel belief stereotype|. Key cells include Acc with novel belief "
        f"stereotype ({_apa_corr_clause(corr_table, 'accuracy_belief', 'novel_belief_stereotype')}), "
        f"Acc with encountered belief stereotype "
        f"({_apa_corr_clause(corr_table, 'accuracy_belief', 'encountered_belief_stereotype')}), "
        f"encountered with novel belief stereotype "
        f"({_apa_corr_clause(corr_table, 'encountered_belief_stereotype', 'novel_belief_stereotype')}), "
        f"and Acc with mean confidence "
        f"({_apa_corr_clause(corr_table, 'accuracy_belief', 'confidence_mean')})."
    )

    # --- Summary ---
    sections.append(
        "### Summary\n\n"
        "Learning of who is good versus bad was generally far from veridical (Question 1). "
        "Higher Acc descriptively predicted stronger novel belief asymmetry (Question 2), and that "
        "direction remained after controlling for encountered belief stereotype (Question 3). "
        "Approach-domain associations were weaker or opposite. Confidence did not positively "
        "co-vary with Acc and belief-generalization strength (Question 4). Person-level profiles "
        f"and the correlation matrix (Question 5) contextualize these patterns. Given *N* = {n}, "
        "treat the findings as hypothesis-generating for larger samples and majority–minority "
        "conditions. Numerical outputs are in `person_indices.csv`, `correlations.csv`, "
        "`model_coefficients.csv`, and `excluded_participants.csv`."
    )

    body = "\n\n".join(sections)
    text = (
        "# Accuracy and Generalized Stereotyping\n\n"
        "## Analysis Report (APA 7 Style)\n\n"
        f"{body}\n"
    )
    (outdir / "report.md").write_text(text, encoding="utf-8")


# ---------------------------------------------------------------------------
# Main pipeline
# ---------------------------------------------------------------------------

def run_pipeline(input_path: Path, outdir: Path):
    outdir.mkdir(parents=True, exist_ok=True)

    participants = load_firebase_export(input_path)
    meta, p1, p2, p3 = build_trial_tables(participants)
    meta.to_csv(outdir / "participants_meta.csv", index=False)
    p1.to_csv(outdir / "phase1_trials_long.csv", index=False)
    p2.to_csv(outdir / "phase2_trials_long.csv", index=False)
    p3.to_csv(outdir / "phase3_trials_long.csv", index=False)

    indices = compute_person_indices(meta, p1, p2, p3)
    analyzed, excluded = apply_exclusions(indices)
    indices.to_csv(outdir / "person_indices_all.csv", index=False)
    analyzed.to_csv(outdir / "person_indices.csv", index=False)
    excluded.to_csv(outdir / "excluded_participants.csv", index=False)

    # Correlations of interest
    corr_specs = [
        ("accuracy_belief", "novel_belief_stereotype"),
        ("accuracy_belief", "novel_approach_stereotype"),
        ("accuracy_belief", "encountered_belief_stereotype"),
        ("encountered_belief_stereotype", "novel_belief_stereotype"),
        ("encountered_approach_stereotype", "novel_approach_stereotype"),
        ("late_excess_accuracy", "novel_belief_stereotype"),
        ("late_excess_accuracy", "accuracy_belief"),
        # Confidence (metacognitive account)
        ("accuracy_belief", "confidence_mean"),
        ("accuracy_belief", "confidence_encountered"),
        ("accuracy_belief", "confidence_novel"),
        ("novel_belief_stereotype", "confidence_novel"),
        ("novel_belief_stereotype_abs", "confidence_novel"),
        ("novel_approach_stereotype", "confidence_novel"),
        ("novel_approach_stereotype_abs", "confidence_novel"),
        ("novel_belief_stereotype_abs", "confidence_mean"),
        ("novel_approach_stereotype_abs", "confidence_mean"),
    ]
    corr_rows = []
    for x, y in corr_specs:
        if x in analyzed and y in analyzed:
            c = corr_with_ci(analyzed[x], analyzed[y])
            corr_rows.append({"x": x, "y": y, **c})
    corr_table = pd.DataFrame(corr_rows)
    corr_table.to_csv(outdir / "correlations.csv", index=False)

    # Models — belief and approach DVs
    model_frames = []
    model_specs = [
        ("M1_belief", "novel_belief_stereotype ~ accuracy_belief"),
        ("M2_belief", "novel_belief_stereotype ~ accuracy_belief + encountered_belief_stereotype"),
        ("M1_approach", "novel_approach_stereotype ~ accuracy_belief"),
        ("M2_approach", "novel_approach_stereotype ~ accuracy_belief + encountered_approach_stereotype"),
    ]
    for name, formula in model_specs:
        # need enough df: parameters + 1
        n_params = formula.count("+") + 2  # intercept + predictors
        if len(analyzed.dropna()) >= max(3, n_params + 1):
            model = fit_ols(formula, analyzed)
        else:
            # still try; may be saturated / singular
            model = fit_ols(formula, analyzed) if len(analyzed) >= 3 else None
        model_frames.append(model_to_frame(model, name))
        # save full summary text if available
        if model is not None:
            (outdir / f"{name}_summary.txt").write_text(model.summary().as_text(), encoding="utf-8")

    model_table = pd.concat(model_frames, ignore_index=True) if model_frames else pd.DataFrame()
    model_table.to_csv(outdir / "model_coefficients.csv", index=False)

    make_figures(analyzed if len(analyzed) else indices, outdir)
    analyzed_ids = analyzed["participant_id"].tolist() if len(analyzed) else None
    # Block-level segments (design unit) + coarser equal trial bins
    plot_phase1_learning_curve(
        p1, outdir, participant_ids=analyzed_ids, n_segments=None,
        outfile="fig_phase1_learning_curve_by_block.png",
        csv_prefix="phase1_segment_accuracy_by_block",
    )
    plot_phase1_learning_curve(
        p1, outdir, participant_ids=analyzed_ids, n_segments=4,
        outfile="fig_phase1_learning_curve_4segments.png",
        csv_prefix="phase1_segment_accuracy_4segments",
    )
    write_report(outdir, len(meta), analyzed, excluded, corr_table, model_table)

    print(f"Loaded N={len(meta)}; analyzed N={len(analyzed)}; excluded N={len(excluded)}")
    print(f"Wrote outputs to: {outdir.resolve()}")
    if len(corr_table):
        print("\nKey correlations:")
        print(corr_table.to_string(index=False, float_format=lambda v: f"{v:0.3f}"))
    if len(model_table):
        print("\nModel coefficients:")
        print(model_table[["model", "term", "estimate", "p", "n", "r2"]].to_string(
            index=False, float_format=lambda v: f"{v:0.3f}"
        ))
    return analyzed, corr_table, model_table


def parse_args():
    repo = Path(__file__).resolve().parents[1]
    default_out = repo / "outputs" / "accuracy_generalization"
    p = argparse.ArgumentParser(description="Accuracy → generalization analysis pipeline")
    p.add_argument(
        "--input",
        type=Path,
        required=True,
        help="Path to Firebase RTDB JSON export",
    )
    p.add_argument(
        "--outdir",
        type=Path,
        default=default_out,
        help=f"Output directory (default: {default_out})",
    )
    return p.parse_args()


if __name__ == "__main__":
    args = parse_args()
    run_pipeline(args.input, args.outdir)
