# Davis-Putnam Developer's Guide

## Changes to existing functionality

When designing an implementation of Davis-Putnam (DP) supported by Willow, we wanted to utilize as much of the existing functionality as possible. Below are the major changes and additions that were made.

1. **Implementation of the reduction rules for each type of statement:** These rules were used to reduce statements given the truth value of a literal. All of the reduction rules are as follows:

    ¬⊤ ⇒

2. Support for contradiction (⊥) and tautology (⊤) symbols
3. 