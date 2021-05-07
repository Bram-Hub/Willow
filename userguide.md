# User's Guide


## What is Willow and what are truth trees?
Willow is a web-based application for creating and validating truth trees. Truth trees build upon the [short truth table method](https://homepages.hass.rpi.edu/heuveb/Teaching/Logic/CompLogic/Web/Presentations/TF-ShortTruthTable.pdf). They work in the same way except when there are no forced truth assignments, the tree branches into two sub-trees. [You may read more about truth trees here.](https://homepages.hass.rpi.edu/heuveb/Teaching/Logic/CompLogic/Web/Presentations/TF-Trees.pdf)

## Opening Willow
### Creating a new tree:
- **Option 1:** Open Willow in a new tab [https://willow.bram-hub.com](https://willow.bram-hub.com)
- **Option 2:** Click `File>New`

### Saving an existing tree:
- **Option 1:** Click `File>Save` this will save the truth tree with the existing file name.
- **Option 2:** Click `File>Save as...` this will allow you to choose file name before saving.

### Opening a tree:
- Click `File>Open` browse until you find the `.willow` file you wish to open. **Note that this will clear your current tree**

## Creating a truth tree
### Syntax:
Willow tries to be flexible with syntax but there are a few rules you must follow for Willow to correctly parse your truth tree.

#### Symbols:
Everyone has their own preferred [logical symbols](https://en.wikipedia.org/wiki/List_of_logic_symbols). Willow is smart and allows you to use a number of different options. You may use or even mix and match any of the following options.

Symbol|Options
---|---
[Negation](https://en.wikipedia.org/wiki/Negation)|`not` `¬` `!` `~`
[Disjunction](https://en.wikipedia.org/wiki/Logical_disjunction)|`or` `∨` `\|`
[Conjunction](https://en.wikipedia.org/wiki/Logical_conjunction)|`and` `∧` `&`
[Implication](https://en.wikipedia.org/wiki/Material_conditional)|`implies` `only if` `→` `$` `->`
[Equivalence](https://en.wikipedia.org/wiki/If_and_only_if)|`iff` `equiv` `↔` `%` `<->`
[Universal Quantifier](https://en.wikipedia.org/wiki/Universal_quantification)|`forall` `∀`
[Existential Quantifier](https://en.wikipedia.org/wiki/Existential_quantification)|`exists` `∃`
Open Branch|`◯`
Closed Branch|`×`

Also note that variables and function symbols must be lowercase. For example `forall x` is valid but `forall X` is invalid.

#### Predicates and Propositions:
Predicates and propositions must be capitalized.

For example, writing `A` is valid, however `a` is invalid.

In addition, writing `P(x)` is valid, however `p(x)` is invalid.

#### Valid Examples:
`¬((A ∨ B) ∧ (C → D)) ↔ E`

`~((A | B) & (C $ D)) % E`

`not ((A or B) and (C implies D)) iff E`

`¬((A | B) and (C -> D)) equiv E`

`∀x ∃y (P(x) ∧ Q(y))`

### Statements:
Statements are [First-order logic](https://en.wikipedia.org/wiki/First-order_logic) expressions in textboxes. To the left of each statement is a symbol representing one of three possibilities. A green check mark signifies your statement is a logical consequence and is correctly decomposed within the tree. A red "X" signifies an issue with that statement; hovering your mouse over this "X" will give you more information regarding the issue. A yellow triangle signifies that the statement itself is not recognized by the First-order logic expression parser*. In addition to these symbols, the currently selected statement is highlighted blue, its decomposition is highlighted red, and its logical "parent" is highlighted green.

*If you believe you wrote a valid FOL statement but it is not recognized, please contact a developer.

![Example Statement](https://user-images.githubusercontent.com/18558130/115157194-e3d54000-a055-11eb-9cfa-e5b7f54ab010.png)


#### Adding statements
To add a node, click on a valid statement in the truth tree. To add a new statement below the currently selected statement click `Edit>Add statement after` or press `ctrl+a`(default). To add one above click `Edit>Add statement before` or press `ctrl+b`(default).

![Peek 2021-04-18 15-19](https://user-images.githubusercontent.com/18558130/115157868-87741f80-a059-11eb-999a-4564d629cdd1.gif)



#### Branching
To split the truth tree into two branches, click on a statement. Then click `Edit>Create branch` or press `ctrl+shift+b`(default).

![Peek 2021-04-18 15-20](https://user-images.githubusercontent.com/18558130/115157884-98bd2c00-a059-11eb-97bf-b905e134b061.gif)



#### Deleting a statement
To remove a statement, click on a statement. Then click `Edit>Delete statement` or press `ctrl+d`(default).

![Peek 2021-04-18 15-21](https://user-images.githubusercontent.com/18558130/115157912-b7232780-a059-11eb-9cc6-48379a449cc2.gif)



#### Deleting a branch
To remove a branch, click on any statement within a branch. Then click `Edit>Delete branch` or press `ctrl+shift+d`(default).

![Peek 2021-04-18 15-21](https://user-images.githubusercontent.com/18558130/115157952-d0c46f00-a059-11eb-8995-8d648745e0d4.gif)


### Premise:
To add a [premise](https://en.wikipedia.org/wiki/Premise), click on a valid statement in the truth tree and then click `Edit>Toggle premise` or press `ctrl+p`(default)

A premise is denoted by the word `Premise` to the right of the input text box

A correctly decomposed premise will be indicated by a green checkmark to the left of the input text box

![Peek 2021-04-18 15-22](https://user-images.githubusercontent.com/18558130/115157972-eafe4d00-a059-11eb-95f5-ce72507d848e.gif)



### Decomposition:
1. To decompose a premise/statement first add the correct branches/statements that it decomposes into. You can read more about [valid decomposition rules here](https://homepages.hass.rpi.edu/heuveb/Teaching/Logic/CompLogic/Web/Presentations/TF-Trees.pdf#%5B%7B%22num%22%3A27%2C%22gen%22%3A0%7D%2C%7B%22name%22%3A%22Fit%22%7D%5D)
1. You now have 2 options

a) If you would like to decompose the current statement, right click all the statements below it in the tree that it decomposes into. These statements will turn red and will say `decomposes into`.

 ![Peek 2021-04-18 15-07](https://user-images.githubusercontent.com/18558130/115157543-e6d13000-a057-11eb-9f15-18d61265d7fa.gif)


 b) If you would like to select the statements that the current statements are the logical consequence of, right click all the statements above it in the tree that it was decomposed from. These statements will turn green and will say `logical consequence of`.

![Peek 2021-04-18 15-09](https://user-images.githubusercontent.com/18558130/115157592-154f0b00-a058-11eb-83ef-786e28c8b5dc.gif)


Assuming you did it correctly, your statement should now have a green check mark to the right of the input text box.

### Validating a tree:
A truth tree is only complete when it has been fully decomposed. There are 2 ways to fully decompose a truth tree. A truth tree that has any branch that terminates with an open statement (`◯`) is fully decomposed. Otherwise a truth tree will be fully decomposed when all branches terminate with a closed statement (`×`).

You may check the truth tree is valid by clicking `Evaluate>Check correctness`

![Peek 2021-04-18 15-13](https://user-images.githubusercontent.com/18558130/115157703-b047e500-a058-11eb-8c7e-cb896b71e7b4.gif)


## UI tips
### Collapsing a branch
As your truth tree grows, it may make it hard to follow what is going on. Willow allows you to collapse branches to hide them from the screen. Do not worry, a collapsed branch will still be used when Willow is evaluating your tree, these branches are just hidden from the user.

- Hiding a branch: Click the downward facing chevron next to the first statement in any branch.
- Unhiding a branch: Click the rightward facing chevron next to the first statement in a hidden branch

![Peek 2021-04-18 15-14](https://user-images.githubusercontent.com/18558130/115157723-d9687580-a058-11eb-8ce9-17bb2c11eee9.gif)


### Keyboard shortcuts
Willow has a number of keyboard shortcuts to help you when making a truth tree. You can modify any of the shotcuts by clicking `Options>Shortcuts`

The default list of shortcuts are as follows:

Symbol|Options
---|---
Toggle premise|`ctrl+p`
Add statement before|`ctrl+b`
Add statement after|`ctrl+a`
Create branch|`ctrl+shift+b`
Delete statement|`ctrl+d`
Delete branch|`ctrl+shift+d`



### Theme
Willow has 2 themes, a dark mode and a light mode. To toggle betweent the two themes, click `Options>Toggle Theme`

![Peek 2021-04-18 15-17](https://user-images.githubusercontent.com/18558130/115157800-3106e100-a059-11eb-8731-28f24d9cb1b2.gif)
