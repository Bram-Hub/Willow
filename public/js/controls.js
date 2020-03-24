/**
 * Focuses on a statement within a tree, with its position given by branch indices
 * and an offset.
 * 
 * @param {Number[]} branches the branch indices
 * @param {Number} offset the offset within the node
 */
function focusStatement(branches, offset) {
  // use setTimeout to focus the element after Vue.js is able to react to any
  // changes
  setTimeout(() => $(
      `.statement[branches="${JSON.stringify(branches)}"][offset="${offset}"]`
  ).focus(), 0);
}

/**
 * Focuses on the first statement in the entire tree.
 */
function focusFirstStatement() {
  setTimeout(() => $(".statement").first().focus(), 0);
}

/**
 * Focuses on the last statement in the entire tree.
 */
function focusLastStatement() {
  setTimeout(() => $(".statement").last().focus(), 0);
}

/**
 * Focuses the statement above the focused statement, or does nothing if no
 * statement is focused.
 */
function moveUp() {
  if ($(document.activeElement).is(".statement")) {
    const statements = $(".statement");
    // search through all statements on the page except for the first, since we
    // cannot move up from the first one
    for (let i = 1; i < statements.length; ++i) {
      if (statements.get(i) === document.activeElement) {
        // if this statement matches the focused statement, then focus the
        // statement before this one
        statements.get(i - 1).focus();
        return;
      }
    }
  }
}

/**
 * Focuses the statement below the focused statement, or does nothing if no
 * statement is focused.
 */
function moveDown() {
  if ($(document.activeElement).is(".statement")) {
    const statements = $(".statement");
    // search through all statements of the page except for the last, since we
    // cannot move down from the last one
    for (let i = 0; i < statements.length - 1; ++i) {
      if (statements.get(i) === document.activeElement) {
        // if this statement matches the focused statement, then focus the
        // statement after this one
        statements.get(i + 1).focus();
        return;
      }
    }
  }
}

/**
 * Adds a blank statement before the focused statement, or to the beginning of the
 * tree if no statement is focused.
 */
function addStatementBefore() {
  const el = $(document.activeElement);
  if (el.is(".statement")) {
    const branches = JSON.parse(el.attr("branches"));
    const offset = parseInt(el.attr("offset"));

    // append and focus a statement before the focused statement (use element
    // attributes to determine position)
    vm.root.child(branches).statements.splice(offset, 0, {str: ""});
    focusStatement(branches, offset);
  } else {
    // prepend and focus a statement to the root node of the tree
    vm.root.statements.unshift({str: ""});
    focusFirstStatement();
  }
}

/**
 * Adds a blank statement after the focused statement, or to the end of the tree
 * if no statement is focused.
 */
function addStatementAfter() {
  const el = $(document.activeElement);
  if (el.is(".statement")) {
    const branches = JSON.parse(el.attr("branches"));
    const offset = parseInt(el.attr("offset")) + 1;

    // append and focus a statement after the focused statement (use element
    // attributes to determine position)
    vm.root.child(branches).statements.splice(offset, 0, {str: ""});
    focusStatement(branches, offset);
  } else {
    // append and focus a statement to the last node of the tree
    vm.root.lastLeaf.statements.push({str: ""});
    focusLastStatement();
  }
}

/**
 * Deletes the focused statement, or the last statement if no statement is
 * focused.
 */
function deleteStatement() {
  const el = $(document.activeElement);
  if (el.is(".statement")) {
    const branches = JSON.parse(el.attr("branches"));
    const offset = parseInt(el.attr("offset"));

    // get the array of statements for the node containing the focused statement
    const statements = vm.root.child(branches).statements;
    if (statements.length <= 1) {
      // do not remove the statement if it is the only statement in the node
      alert("You cannot delete the only statement in a branch.");
      return;
    }

    // remove the statement and focus the one before it
    statements.splice(offset, 1);
    focusStatement(branches, Math.max(0, offset - 1));
  } else {
    // get the array of statements for the last node in the tree
    const statements = vm.root.lastLeaf.statements;
    if (statements.length <= 1) {
      // do not remove the last statement if it is the only statement in the node
      alert("You cannot delete the only statement in a branch.");
      return;
    }
    // remove the last statement and focus the one before it (now last)
    statements.pop();
    focusLastStatement();
  }
}

/**
 * Adds a branch to the node containing the focused statement, or to the end of
 * the tree if no statement is focused.
 */
function addBranch() {
  const el = $(document.activeElement);
  if (el.is(".statement")) {
    const branches = JSON.parse(el.attr("branches"));
    const children = vm.root.child(branches).children;

    // append a branch to the node containing the focused statement, and focus its
    // first statement
    children.push(new TreeNode([""]));
    focusStatement([...branches, children.length - 1], 0);
  } else {
    // append a branch to the last node of the tree, and focus its first statement
    vm.root.lastLeaf.children.push(new TreeNode([""]));
    focusLastStatement();
  }
}

/**
 * Deletes the branch containing the focused statement, or the last branch if no
 * statement is focused.
 */
function deleteBranch() {
  // get the element within the branch to be deleted
  let el = $(document.activeElement);
  if (!el.is(".statement")) {
    el = $(".statement").last();
  }

  // get the branch indices for the element
  const branches = JSON.parse(el.attr("branches"));
  if (branches.length === 0) {
    // do not remove the branch if it is the root branch (has no branch indices)
    alert("You cannot delete the root branch.");
    return;
  }

  const branchIdx = branches.pop();
  const parent = vm.root.child(branches);
  // remove the branch from its parent node, and focus the last statement of the
  // parent node (preceding the deleted branch)
  parent.children.splice(branchIdx, 1);
  focusStatement(branches, parent.statements.length - 1);
}

/**
 * Focuses on the parent branch of the one currently focused, or does nothing if
 * no statements are focused.
 */
function endBranch() {
  const el = $(document.activeElement);
  if (el.is(".statement")) {
    // get the parent node with respect to the focused statement
    const branches = JSON.parse(el.attr("branches"));
    if (branches.length === 0) {
      // if the focused statement is within the root branch, do nothing since we
      // cannot "end" the root branch
      return;
    }
    branches.pop();
    const parent = vm.root.child(branches);

    // focus the last statement of the parent branch
    focusStatement(branches, parent.statements.length - 1);
  }
}

const shortcuts = [
  {
    callback: moveUp,
    key: 38,
  },
  {
    callback: moveDown,
    key: 40,
  },
  {
    callback: addStatementBefore,
    ctrl: true,
    key: "B",
  },
  {
    callback: addStatementAfter,
    ctrl: true,
    key: "A",
  },
  {
    callback: deleteStatement,
    ctrl: true,
    key: "D",
  },
  {
    callback: addBranch,
    ctrl: true,
    shift: true,
    key: "B",
  },
  {
    callback: deleteBranch,
    ctrl: true,
    shift: true,
    key: "D",
  },
  {
    callback: endBranch,
    ctrl: true,
    key: "E",
  },
];

document.onkeydown = function(event) {
  for (const shortcut of shortcuts) {
    // get the key code for this shortcut (a string or integer may be provided)
    let key = shortcut.key;
    if (typeof key === "string" || key instanceof String) {
      key = key.charCodeAt(0);
    }

    // ctrl and shift are false by default
    if ((shortcut.ctrl || false) === event.ctrlKey &&
        (shortcut.shift || false) === event.shiftKey &&
        key === event.which) {
      // if the shortcut is activated, then execute its callback and stop default
      // behavior (defined by browser)
      shortcut.callback(event);
      event.preventDefault();
      event.stopPropagation();
    }
  }
}
