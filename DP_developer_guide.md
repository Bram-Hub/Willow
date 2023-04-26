# Davis-Putnam Developer's Guide

*This feature was implemented as a final project by Jenny Gao, Mason duBoef, and Jody Sunray for Bram van Heuveln's Spring 2023 Computability and Logic course at RPI.*

## Changes to existing functionality

When designing an implementation of Davis-Putnam (DP) supported by Willow, we wanted to utilize as much of the existing functionality as possible. Below are the major changes and additions that were made.

1. **By default two branches are created**: This feature was not a requirement for our project, but it made our lives easier. Plus, it was requested by Bram. :)

    https://user-images.githubusercontent.com/55996087/234662990-85eb9160-8ba4-4c81-a45a-d7121f7adbcc.mov


1. **Implementation of the reduction rules for each type of statement**: These rules were used to reduce statements given the truth value of a literal. The reduction rules are as follows.

    | Not       | And         | Or          | Conditional | Biconditional |
    | --------- | ----------- |------------ | ----------- | ------------- |
    | ¬⊤ => ⊥   | ⊤ ∧ P => P | ⊤ ∨ P => ⊤  | ⊤ → P => P  | ⊤ ↔ P => P   |
    | ¬⊥ => ⊤   | ⊥ ∧ P => ⊥ | ⊥ ∨ P => P  | ⊥ → P => ⊤  | ⊥ ↔ P => ¬P  |
    |           | P ∧ ⊤ => P  | P ∨ ⊤ => ⊤  | P → ⊤ => ⊤  | P ↔ ⊤ => P   |
    |           | P ∧ ⊥ => ⊥  | P ∨ ⊥ => P  | P → ⊥ => ¬P | P ↔ ⊥ => ¬P  |
    
    For example, given the statement A ∧ B and the literal B, we can reduce to the atomic statement A. Rules like this were used to verify whether the statement a user has inputted is indeed a valid inference.

2. **Support for contradiction (⊥) and tautology (⊤) symbols**: Since our implementation relies on the use of ⊥ and ⊤, we added support for these symbols by adding them to `parser.ts`. Thus, when a user inputs a ⊥, it is treated as a `Contradiction` statement. Similarly, when a user inputs a ⊤, it is treated as a `Tautology` statement. We also created shortcuts for these symbols; the minus sign (-) is a shortcut for ⊥, and the plus sign (+) is a shortcut for ⊤.

    <img width="944" alt="Screenshot 2023-04-26 at 12 29 47 PM" src="https://user-images.githubusercontent.com/55996087/234641790-b3f1955d-282c-48c5-9a38-cb3453b8fedc.png">

4. **Support for basic tautological statement (A ∨ ¬A)**: In order to be able to branch on a particular literal, we rely on the use of the basic tautological statement, which is the law of excluded middle. This statement is valid by default since all tautologies are valid, and is only marked with a green check if it has been decomposed into two branches A and ¬A.

    <img width="945" alt="Screenshot 2023-04-26 at 12 31 19 PM" src="https://user-images.githubusercontent.com/55996087/234642070-23daacd9-c597-4b24-9baf-b2a662150b88.png">

6. **Functional frontend that supports both DP and truth-tree methods**: We decided that the DP method should be a separate mode on the Willow site, so that by default users interact with the original truth tree method. To achieve this, we created a toggle in the menu bar. When clicked, the toggle sets a state variable `DPMode` to `true` or `false`. The value of this variable controls whether certain code additions will be run or not.

    <img width="947" alt="Screenshot 2023-04-26 at 12 32 01 PM" src="https://user-images.githubusercontent.com/55996087/234642243-2d97c0e4-72c4-4fb9-b5d5-90a56e414893.png">

8. **Create a new version of `modifyDecomposition` to store and update antecedents called `modifyAntecedentsDP`**: When a user selects a particular statement and then right clicks on another, the `modifyDecomposition` function is called to update logical relationships within the tree, specifically a statement's decomposition and antecedents. For DP mode, we modify this function (and call it `modifyAntecedentsDP`). The main additional functionality of this function is to update the selected statement's antecedents, i.e., the statement it is reducing from and the literal it is branching on.

10. **Statement validation for DP (`isDPValid`, which calls `validateReduction`)**: A statement is considered a valid inference if it follows from one of the reduction rules listed above. Since validation for DP differs from validation for truth trees, we decided to create a separate function called `isDPValid()`. This function checks whether a statement is valid given its antecedents (i.e., the statement it is reduced from and the branch literal).

    In the image below, the selected statement (highlighted in blue) is valid since it is a correct inference of H ∧ (I → F) given that we have taken the H branch (i.e., H is true).

    <img width="943" alt="Screenshot 2023-04-26 at 1 42 55 PM" src="https://user-images.githubusercontent.com/55996087/234659503-bd690ee8-9c1a-4fe1-a483-a827b6ef6990.png">

12. **Statement decomposition checks for DP (checks that it has two statements in its decomposition, and they are both valid inferences)**: In addition to validating a statement, we also check that it has been reduced. This is similar to the checks being done for the truth tree method, i.e., a statement is only marked with a green check if it is both valid *and* decomposed completely. To verify that a statement has been reduced, we make sure that it has exactly two statements in its decomposition, and every statement in its decomposition is valid.

    In the image below, the selected statement is not only valid but also reduced since both statements in its decomposition (⊤ and ¬I) are valid. Thus, because the selected statement is both valid and decomposed correctly, it is marked with a green check.

    <img width="945" alt="Screenshot 2023-04-26 at 1 47 13 PM" src="https://user-images.githubusercontent.com/55996087/234660442-996768f7-969a-4b37-aeca-e2a265da7980.png">

13. **Support for closed terminator**: We modified the `isClosedTerminatorValid()` function to validate a closed terminal when its antecedent is a contradiction.

    In the image below, the terminator is considered valid since it reduces from a contradiction (⊥).

    <img width="943" alt="Screenshot 2023-04-26 at 2 16 45 PM" src="https://user-images.githubusercontent.com/55996087/234666728-048283bb-dae8-434d-8cc4-02352c5c09f0.png">

14. **Extensive testing of reduction rules (`tests/reductionRules.test.ts`)**: After implementing the reduction rules listed above, we created a test suite that tests each one works as expected since these rules are crucial to the rest of the implementation of the DP method. This test suite can be run using the command `npm run test`, which runs all tests.

16. **Updated tree node highlighting and labeling**: We simply applied the existing color scheme to the new DP functionality, with a couple language changes in the labels. As with Willow's truth tree method, when any statement is selected, there may be both green and red highlighting:

    1. *Statements highlighted in **green** indicate **antecedents*** of the currently selected node. Non-branch literals are labeled as "reduces from," and branch literals are labeled as "using."
    2. *Statements highlighted in **red** indicate those that **reduce*** from the currently selected node. There may be zero, one, or two nodes in any given decomposition. Each node in the decomposition will be labeled with the text "reduces to."
    
9. **Updated status bar labeling**: In addition to modifying the tree node labels, we also modified the language in the status bar as well as added new statuses. For example, a tautology has a status to indicate it as such:

    <img width="945" alt="Screenshot 2023-04-26 at 2 07 03 PM" src="https://user-images.githubusercontent.com/55996087/234664782-06325497-7f45-4849-8b61-814afb03cd20.png">

11. **Support for saving and reopening files that use the DP method**: When testing our implementation on larger examples, it became tedious to have to retype the example each time the application is rerun. To resolve this, we modified the `serialize()` and `fromJSON()` functions to account for any variables we added for DP mode. This allows trees that implement DP to be saved and later reopened.

13. **Visual testing on simple examples and an example from class**: We based a lot of our preliminary tests using a small example as shown below.

    <img width="944" alt="Screenshot 2023-04-26 at 2 21 01 PM" src="https://user-images.githubusercontent.com/55996087/234667725-e87636d0-8dfb-44bd-bd7c-71b5fc8574c3.png">
    
    This example has only open branches, and it's fairly simple, so we did additional tests using an example from homework 4, as shown below.
    
    <img width="944" alt="Screenshot 2023-04-26 at 2 23 21 PM" src="https://user-images.githubusercontent.com/55996087/234668290-0666b233-f78c-4d57-99dc-8cd0b1dca282.png">
    <img width="944" alt="Screenshot 2023-04-26 at 2 23 39 PM" src="https://user-images.githubusercontent.com/55996087/234668319-af5684a3-772c-4de7-84c2-ffd0d3b647c7.png">
    <img width="941" alt="Screenshot 2023-04-26 at 2 23 47 PM" src="https://user-images.githubusercontent.com/55996087/234668346-8bcf3eab-2089-4b64-b226-5790ee3c4e8c.png">

## Tasks that still need to be completed

The implementation of DP in Willow is completely usable in its current state. However, there are a few action items that we were not able to get to, and more thorough testing will need to be done to ensure that the feature is production-ready.

1. Handle lingering statements that have not been fully decomposed

    <img width="943" alt="Screenshot 2023-04-26 at 1 34 59 PM" src="https://user-images.githubusercontent.com/55996087/234657144-c56b4be0-49cc-46c0-aef2-215da6825f84.png">

3. Ensure all the labels are correct when a statement is selected
4. Perform additional testing (bug hunting)
