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
5. Minor language changes to tree node labels and status bar
6. Statement validation for DP
7. Statement decomposition checks for DP
8. Testing for the reduction rules

## Tasks that still need to be completed

The implementation of DP in Willow is completely usable in its current state. However, there are a few action items that we were not able to get to, and more thorough testing will need to be done to ensure that the feature is production-ready.

1. Handle lingering statements that have not been fully decomposed
