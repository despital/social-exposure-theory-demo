# Presentation Narrative — Aim, Methods, and Analysis Agreement

> **Purpose:** Spoken through-line for the analysis-agreement meeting. Use this as the story; use [Presentation_Outline_Analysis_Agreement.md](Presentation_Outline_Analysis_Agreement.md) as the slide map.  
> **Audience:** Lab / collaborators  
> **Suggested length:** ~15–20 min + discussion  
> **Last updated:** 2026-11-23

---

We’re not here to decide what the data mean yet. We’re here to agree on **what would count as evidence** for the claim, and therefore how we analyze and plot.

The claim is this: **uncertainty in social interactions shapes how much people generalize from people they’ve met to new people in the same group — even after we account for the attitudes they’ve already formed toward the people they encountered.**

That last clause matters. Without it, “generalization” can just be “they already dislike that group, and they keep disliking new members.” We’re after something stronger: generalization beyond already-formed attitudes toward known targets.

There are two ways uncertainty could work. One is **calibrated caution**: sparse experience makes people careful, without distorting what they believe. The other is **uncertainty-modulated negativity**: sparse experience amplifies bad outcomes, so beliefs themselves get inflated. Those accounts pull apart only if we separately measure approach, beliefs, and confidence.

So we built a task that can speak to that. In **Phase 1**, people repeatedly choose among faces and get probabilistic reward or punishment. Exposure can be balanced or imbalanced across color groups; both groups have the **same** good/bad base rates, so any color bias is not recovering a true group difference. In **Phase 2**, they rate both **encountered** and **novel** faces on approach, punishment probability, and confidence. Encountered vs. novel is what lets us separate “attitudes already formed” from “generalization to new people.”

But before any of that theory is interpretable, we have a methods gate: **can people actually learn these faces over time to a satisfying level?** If they can’t distinguish good from bad individuals, later Acc–generalization links don’t test the theory — they just reflect a broken learning task. So our first step is to show rising Phase 1 accuracy and Phase 2 Acc above zero (ideally toward the veridical gap of ~0.40).

That gate is also the start of the evidence chain.

**E0 — Can people learn these faces at all?**  
If yes, we see learning curves rise and Acc not piled at zero.  
People can learn — but not equally well. Acc varies.  
**So the next question:** does that variation matter for how they treat *new* group members? Do better learners show more bias about novel faces?

**E1 — Do better learners show more bias about new faces?**  
If the hypothesis is on track, Acc should positively relate to novel belief and/or approach bias (Model M1; Fig 2).  
That would be interesting — but ambiguous. Better learners might simply have formed stronger group attitudes toward people they *already met*, and those same attitudes reappear for novel faces. Then E1 only means “good learners stereotype more in general,” not “they generalize beyond what they already feel.”  
**So the next question:** does Acc still predict novel-face bias once we hold constant attitudes toward encountered faces?

**E2 — Is that link more than already-formed attitudes toward known faces?**  
This is the aim-critical test (Model M2; Fig 3): `novel_stereotype ~ Acc + encountered_stereotype`. If Acc still predicts novel bias after that control, we have generalization beyond encountered attitudes. If it doesn’t, E1 was mostly carried by attitudes already formed.  
If E2 holds, we’ve got the generalization claim.  
**But we still haven’t located uncertainty.** Acc is how well people individuated; it isn’t a direct report of felt uncertainty.  
**So the next question:** does confidence move with Acc and/or generalization strength the way our account predicts?

**E3 — Does confidence track Acc and generalization as predicted?**  
If uncertainty is in the story, confidence should co-vary with learning quality and generalization strength in the expected direction — and, read with belief vs. approach, help tell calibrated caution from belief distortion (Fig 4).

Put together: people learn (**E0**) → better learning relates to novel bias (**E1**) → that link isn’t just encountered attitudes (**E2**) → confidence supplies the uncertainty signature (**E3**). That is the evidence package we want to lock — including which figures attach to which claim, what counts as “satisfying learning,” and what is primary vs. exploratory.

Then we freeze those decisions, re-run the pipeline, and write the results memo in that same E0→E3 order.
