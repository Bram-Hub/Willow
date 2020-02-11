function addBranch(event) {
  console.log("[DEBUG] add branch");
}

function deleteBranch(event) {
  console.log("[DEBUG] delete branch");
}

const shortcuts = [
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
];

document.onkeydown = function(event) {
  for (const shortcut of shortcuts) {
    if (shortcut.ctrl === event.ctrlKey &&
        shortcut.shift === event.shiftKey &&
        shortcut.key.charCodeAt(0) === event.which) {
      shortcut.callback(event);
      event.preventDefault();
      event.stopPropagation();
    }
  }
}