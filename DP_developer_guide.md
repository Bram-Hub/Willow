# Davis-Putnam Developer's Guide

*This feature was implemented as a final project by Jenny Gao, Mason duBoef, and Jody Sunray for Bram van Heuveln's Spring 2023 Computability and Logic course at RPI.*

## Changes to existing functionality

When designing an implementation of Davis-Putnam (DP) supported by Willow, we wanted to utilize as much of the existing functionality as possible. Below are the major changes and additions that were made.

**Note**: old `.willow` files are no longer supported. This is due to DP statements having 2 antecedents (a parent statement and literal branch), changing the structure of the tree.

1. **By default two branches are created**: This feature was not a requirement for our project, but it made our lives easier. Plus, it was requested by Bram. :)

    https://user-images.githubusercontent.com/55996087/235219000-896ab2e9-242e-4622-b0d1-42ff31878bb8.mov

1. **Implementation of the reduction rules for each type of statement**: These rules were used to reduce statements given the truth value of a literal. The reduction rules are as follows.

    | Not       | And         | Or          | Conditional | Biconditional |
    | --------- | ----------- |------------ | ----------- | ------------- |
    | ¬⊤ => ⊥   | ⊤ ∧ P => P | ⊤ ∨ P => ⊤  | ⊤ → P => P  | ⊤ ↔ P => P   |
    | ¬⊥ => ⊤   | ⊥ ∧ P => ⊥ | ⊥ ∨ P => P  | ⊥ → P => ⊤  | ⊥ ↔ P => ¬P  |
    |           | P ∧ ⊤ => P  | P ∨ ⊤ => ⊤  | P → ⊤ => ⊤  | P ↔ ⊤ => P   |
    |           | P ∧ ⊥ => ⊥  | P ∨ ⊥ => P  | P → ⊥ => ¬P | P ↔ ⊥ => ¬P  |
    
    For example, given the statement A ∧ B and the literal B, we can reduce to the atomic statement A. Rules like this were used to verify whether the statement a user has inputted is indeed a valid inference.

2. **Support for contradiction (⊥) and tautology (⊤) symbols**: Since our implementation relies on the use of ⊥ and ⊤, we added support for these symbols by adding them to `parser.ts`. Thus, when a user inputs a ⊥, it is treated as a `Contradiction` statement. Similarly, when a user inputs a ⊤, it is treated as a `Tautology` statement. We also created shortcuts for these symbols; the minus sign (-) is a shortcut for ⊥, and the plus sign (+) is a shortcut for ⊤.

    <img width="943" alt="Screenshot 2023-04-28 at 1 58 26 PM" src="https://user-images.githubusercontent.com/55996087/235220100-d52635d4-8556-4061-9900-af2952e632c9.png">

4. **Support for basic tautological statement (A ∨ ¬A)**: In order to be able to branch on a particular literal, we rely on the use of the basic tautological statement, which is the law of excluded middle. This statement is valid by default since all tautologies are valid, and is only marked with a green check if it has been decomposed into the two branches A and ¬A.

    <img width="945" alt="Screenshot 2023-04-28 at 2 36 32 PM" src="https://user-images.githubusercontent.com/55996087/235227067-161406d1-2b9f-4c64-8473-c640bae6bc12.png">

6. **Functional frontend that supports both DP and truth-tree methods**: We decided that the DP method should be a separate mode on the Willow site, so that by default users interact with the original truth tree method. To achieve this, we created a toggle in the menu bar. When clicked, the toggle sets a state variable `dpMode` to `true` or `false`. The value of this variable controls whether certain code additions will be run or not.

    https://user-images.githubusercontent.com/55996087/235223254-bace0694-cef4-499a-bc56-8436e3d00aff.mov

8. **Create a new version of `modifyDecomposition` to store and update antecedents (called `modifyAntecedentsDP`)**: When a user selects a particular statement and then right clicks on another, the `modifyDecomposition()` function is called to update logical relationships within the tree, specifically a statement's decomposition and antecedents. For DP mode, we modify this function (and call it `modifyAntecedentsDP`). The main additional functionality of this function is to update the selected statement's antecedents, i.e., the statement it is reducing from and the literal it is branching on.

10. **Statement validation for DP (`isDPValid()`, which calls `validateReduction()`)**: A statement is considered a valid inference if it follows from one of the reduction rules listed above. Since validation for DP differs from validation for truth trees, we decided to create a separate function called `isDPValid()`. This function checks whether a statement is valid given its antecedents (i.e., the statement it is reduced from and the branch literal).

    In the image below, the selected statement (highlighted in blue) is valid since it is a correct inference of H ∧ (I → F) given that we have taken the H branch (i.e., H is true).

    <img width="945" alt="Screenshot 2023-04-28 at 2 19 52 PM" src="https://user-images.githubusercontent.com/55996087/235223897-cc9a0272-cab9-4054-889c-613995965b73.png">

12. **Statement decomposition checks for DP (checks that it has two statements in its decomposition, and they are both valid inferences)**: In addition to validating a statement, we also check that it has been reduced correctly and completely. This is similar to the checks being done for the truth tree method, i.e., a statement is only marked with a green check if it is both valid *and* decomposed completely. To verify that a statement has been reduced, we make sure that it has exactly two statements in its decomposition, and every statement in its decomposition is valid.

    In the image below, the selected statement is not only valid but also reduced since both statements in its decomposition (⊤ and ¬I) are valid. Thus, because the selected statement is both valid and decomposed correctly, it is marked with a green check.

    <img width="944" alt="Screenshot 2023-04-28 at 2 23 00 PM" src="https://user-images.githubusercontent.com/55996087/235224495-d4b818bf-20bc-4e4d-a9f7-d30d06a1996d.png">

13. **Support for closed terminator**: We modified the `isClosedTerminatorValid()` function to validate a closed terminal when its antecedent is a contradiction.

    In the image below, the terminator is considered valid since it reduces from a contradiction (⊥).

    <img width="944" alt="Screenshot 2023-04-28 at 2 31 28 PM" src="https://user-images.githubusercontent.com/55996087/235226067-28d01aac-a8d5-42a3-aeec-05b1c5dd9509.png">

14. **Extensive testing of reduction rules (`tests/reductionRules.test.ts`)**: After implementing the reduction rules listed above, we created a test suite that tests each one works as expected since these rules are crucial to the rest of the implementation of the DP method. This test suite can be run using the command `npm run test`, which runs all tests.

16. **Updated tree node highlighting and labeling**: We simply applied the existing color scheme to the new DP functionality, with a couple language changes in the labels. As with Willow's truth tree method, when any statement is selected, there may be both green and red highlighting:

    1. *Statements highlighted in **green** indicate **antecedents*** of the currently selected node. Statements (including non-branch literals) are labeled as "reduces from," and branch literals are labeled as "using."
    2. *Statements highlighted in **red** indicate those that **reduce*** from the currently selected node. There may be zero, one, or two nodes in any given decomposition. Each node in the decomposition will be labeled with the text "reduces to."
    
9. **Updated status bar labeling**: In addition to modifying the tree node labels, we also modified the language in the status bar as well as added new statuses. For example, a tautology has a status to indicate it as such:

    <img width="945" alt="Screenshot 2023-04-28 at 2 36 42 PM" src="https://user-images.githubusercontent.com/55996087/235227206-56fd394e-64fe-4f04-baa7-b1fce3e4ad2f.png">
    
    If a statement is both valid and reduced, it has a status like the one shown below:
    
    <img width="943" alt="Screenshot 2023-04-28 at 2 38 23 PM" src="https://user-images.githubusercontent.com/55996087/235227354-39786cff-5dcf-45c7-bd48-a163029d108b.png">

11. **Support for saving and reopening files that use the DP method**: When testing our implementation on larger examples, it became tedious to have to retype the example each time the application is rerun. To resolve this, we modified the `serialize()` and `fromJSON()` functions to account for any variables we added for DP mode. This allows trees that implement DP to be saved and later reopened.

13. **Visual testing on simple examples and an example from class**: We based a lot of our preliminary tests using a small example as shown below.

    Test tree 1: [simple_open_branch_DP.willow](https://github.com/Bram-Hub/Willow/blob/tautology_dp/test_trees/simple_open_branch_DP.willow)
    
    This example has only open branches, and it's fairly simple, so we did additional tests using an example from homework 4, linked below.
    
    Test tree 2: [closed_branches_DP_hw4.willow](https://github.com/Bram-Hub/Willow/blob/tautology_dp/test_trees/closed_branches_DP_hw4.willow)

## Tasks that still need to be completed

The implementation of DP in Willow is completely usable in its current state. However, there are a few action items that we were not able to get to, and more thorough testing will need to be done to ensure that the feature is production-ready.

1. **Handle unchecked statements that have not been fully reduced**: As shown in the image below, it's possible for a valid tree to have statements that are not marked with a green check (since they have not yet been reduced).

    <img width="944" alt="Screenshot 2023-04-28 at 2 42 47 PM" src="https://user-images.githubusercontent.com/55996087/235228119-56cbf2a5-285d-46f7-a4ac-0c85917e0b68.png">
    
    The tree still evaluates as valid since each branch is terminated, but we didn't think it would be appropriate to check off non-reduced statements. One idea to make the red 'X' appear less alarming is by using a different symbol, such as the yellow warning icon. Another idea is to have two icons per statement: one to check the correctness of the statement, and one to check whether it has been fully reduced.
    
2. **Don't require users to reduce every statement for every branch**: Each time we branch on a literal, we require users to reduce each statement even if the branch literal is irrelevant to that statement. For example, say we have the statement F ∨ G and we are branching on the literal H; this statement does not reduce further given this branch, so it shouldn't be necessary to have to rewrite it (since it is a bit redundant).
    
2. **Make switching between the two modes more clear**: When a user toggles from one mode to the other, their current tree is not going to be compatible with the rules of the new mode. Because of this, there should be an alert to confirm whether the user intended to switch modes, and potentially warn them that they should save their progress. Their tree would then be cleared before switching over to the other mode.

3. **Ensure all statement labels are satisfactory**: As noted above, each statement has green and red labels which indicate their antecedents and decomposition. Additionally, the status bar on the bottom of the screen is updated accordingly. While we did perform substantial visual testing, these labels and the status bar should be double checked for different statements and scenarios to make sure they are correct.

5. **Perform additional testing (bug hunting)**: As with any new feature, it is important to fully test it (and try to break it). Throughout the development of the project, we encountered small bugs in our implementation that we had to fix. It is definitely possible (and very likely) that there are other bugs to be addressed.
