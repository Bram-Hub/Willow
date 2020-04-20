/**
 * Saves a JSON file storing the current tree to the client.
 */
function saveFile() {
  var blob = new Blob(
      [JSON.stringify(vm.root.node)],
      {type: "text/plain;charset=utf-8"}
  );
  saveAs(blob, vm.name + ".json");
}

/**
 * Opens a file browser, which will eventually load the tree.
 */
function openFile() {
  if (!confirm(
      "Opening a file will overwrite the current tree. Are you sure?"
  )) {
    return;
  }
  $("#open-file").click();
}

/**
 * Loads the selected file to the tree.
 */
function loadFile(event) {
  // retrieve the file reference
  const file = event.target.files[0]; 

  // setting up the reader
  const reader = new FileReader();
  reader.readAsText(file, "UTF-8");

  // load content when reader is done reading the file
  reader.onload = function(readerEvent) {
    let filename = file.name;
    if (filename.endsWith(".json")) {
      filename = filename.substring(0, filename.length - 5);
    }
    vm.name = filename;

    const content = readerEvent.target.result;
    const nodeObj = JSON.parse(content);
    vm.root.node = TreeNode.fromObject(nodeObj);
  }
}