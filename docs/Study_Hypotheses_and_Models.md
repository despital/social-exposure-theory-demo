# Study Hypotheses and Statistical Models

This document specifies the minimal hypothesis set and corresponding statistical models for testing the **negativity × low exposure** mechanism in the learning task.

---

# H1 — Behavioral Generalization (Phase 2 Approach)

## Hypothesis

After Phase 1 learning, participants will show **lower approach toward novel minority faces** than novel majority faces, and this minority penalty will be **larger under exposure imbalance**.

## Model

Approach_ij = β0 
+ β1 Minority_j
+ β2 Imbalance_i
+ β3 (Minority_j × Imbalance_i)
+ u_i + ε_ij

Where:
- i = participant  
- j = face  
- Minority = 1 (minority), 0 (majority)  
- Imbalance = 1 (low exposure), 0 (balanced)  
- u_i = random intercept  

### Prediction
β3 < 0

---

# H2 — Belief Distortion Beyond Uncertainty (Phase 2 p̂(punish))

## Hypothesis

Participants will estimate **higher punishment probability** for novel minority faces than majority faces, and this difference will be larger under exposure imbalance.

## Model

p̂_ij =
β0
+ β1 Minority_j
+ β2 Imbalance_i
+ β3 (Minority_j × Imbalance_i)
+ u_i + ε_ij

### Prediction
β3 > 0

Optional stronger test (controlling experienced base rate):

p̂_ij =
β0
+ β1 Minority
+ β2 Imbalance
+ β3 (Minority × Imbalance)
+ β4 ExperiencedRate_ig
+ u_i + ε

---

# H3 — Negativity × Low Exposure (Event-Weighting Signature)

## Hypothesis

Punishment outcomes will have **stronger subsequent impact** on minority-group choice than majority-group choice, particularly under low exposure.

## Trial-Level Updating Model (Phase 1)

ChooseGroup_i,t+1 =
β0
+ β1 Valence_it
+ β2 Minority_it
+ β3 Imbalance_i
+ β4 (Valence × Minority)
+ β5 (Valence × Imbalance)
+ β6 (Minority × Imbalance)
+ β7 (Valence × Minority × Imbalance)
+ u_i + ε

Where:
- Valence = −1 (punishment), +1 (reward)

### Prediction
β7 < 0

---

# H4 — Individuation Explains Belief and Policy Bias

## Hypothesis

Poorer individuation of minority bad actors predicts stronger minority belief inflation and avoidance.

Define participant-level difference scores:

Δp_i = mean p̂_minority − mean p̂_majority  
ΔA_i = mean A_minority − mean A_majority  

## Belief Model

Δp_i =
γ0
+ γ1 IndividuationGap_i
+ γ2 Imbalance_i
+ ε_i

### Prediction
γ1 < 0

## Approach Model

ΔA_i =
γ0
+ γ1 IndividuationGap_i
+ γ2 Imbalance_i
+ ε_i

### Prediction
γ1 > 0

---

# Minimal Core Set (If Simplification Is Required)

Retain:

1. Minority × Imbalance interaction on Approach  
2. Minority × Imbalance interaction on p̂(punish)  
3. Valence × Minority × Imbalance interaction  

These are sufficient to test the **negativity × low exposure** mechanism.
