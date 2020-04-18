/**
 * Saves a JSON file storing the current tree to the client.
 */
function saveFile() {
  const filename = prompt("Enter the file name:")
  var blob = new Blob(
      [JSON.stringify(vm.root)],
      {type: "text/plain;charset=utf-8"}
  );
  saveAs(blob, filename + ".json");
}

/**
 * Opens a JSON file containing a tree.
 */
function openFile() {
  if (!confirm(
      "Opening a file will overwrite the current tree. Are you sure?"
  )) {
    return;
  }

  $("#open-file").click();

  // TODO: load file
}