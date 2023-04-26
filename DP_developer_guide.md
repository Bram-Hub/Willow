# Davis-Putnam Developer's Guide

## Changes to existing functionality

When designing an implementation of Davis-Putnam (DP) supported by Willow, we wanted to utilize as much of the existing functionality as possible. Below are the major changes and additions that were made.

1. **Implementation of the reduction rules for each type of statement:** These rules were used to reduce statements given the truth value of a literal. The reduction rules are as follows.

    | Not       | And         | Or          | Conditional | Biconditional |
    | --------- | ----------- |------------ | ----------- | ------------- |
    | ¬⊤ => ⊥   | ⊤ ∧ P => P | ⊤ ∨ P => ⊤  | ⊤ → P => P  | ⊤ ↔ P => P   |
    | ¬⊥ => ⊤   | ⊥ ∧ P => ⊥ | ⊥ ∨ P => P  | ⊥ → P => ⊤  | ⊥ ↔ P => ¬P  |
    |           | P ∧ ⊤ => P  | P ∨ ⊤ => ⊤  | P → ⊤ => ⊤  | P ↔ ⊤ => P   |
    |           | P ∧ ⊥ => ⊥  | P ∨ ⊥ => P  | P → ⊥ => ¬P | P ↔ ⊥ => ¬P  |
    
    For example, given the statement A ∧ B and the literal B, we can reduce to the atomic statement A. Rules like this were used to verify whether the statement a user has inputted is indeed a valid inference.

2. Support for contradiction (⊥) and tautology (⊤) symbols
3. Support for basic tautological statement (A ∨ ¬A)
4. Functional frontend to that supports both DP and truth-tree methods
5. Create a new version of `modifyDecomposition` to store and update antecedents called `modifyAntecedentsDP`
6. Statement validation for DP (`isDPValid`, which calls `validateReduction`)
7. Statement decomposition checks for DP (checks that it has two statements in its decomposition, and they are both valid inferences)
8. Extensive testing of reduction rules (`tests/reductionRules.test.ts`)
9. Updated tree node highlighting and labeling: We simply applied the existing color scheme to the new DP functionality, with a couple language changes in the labels. As with Willow's truth-tree, when any statement is selected, there may be both red and green highlighting:

    1. Statements highlighted in *green* indicate *antecedents* of the currently selected node. Non-branch literals are labeled as "reduces from," and branch literals are labeled as "using." This behavior is still not perfect, specifically when deciding when display either of these labels, as we had some difficulty marking statements as branch literals.
    2. Statements highlighted in *red* indicate those that *reduce* from the currently selected node. There may be zero, one, or two nodes in any given decomposition. Each node in the decomposition will be labeled with the text "reduces to."
    
9. Updated status bar labeling
10. Support for saving and reopening files that use the DP method
11. Visual testing on simple examples and an example from class

## Tasks that still need to be completed

The implementation of DP in Willow is completely usable in its current state. However, there are a few action items that we were not able to get to, and more thorough testing will need to be done to ensure that the feature is production-ready.

1. Handle lingering statements that have not been fully decomposed
2. Ensure all the labels are correct when a statement is selected
3. Perform additional testing
