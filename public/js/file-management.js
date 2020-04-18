/**
 * Saves a JSON file storing the current tree to the client.
 */
function save() {
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
function open() {
  // TODO

  const input = document.createElement("input");
  input.type = "file";

  input.onchange = event => { 
    const file = event.target.files[0];
    const reader = new FileReader();
    reader.readAsText(file, "UTF-8");

    reader.onload = readerEvent => {
      const content = readerEvent.target.result;
      console.log(content);
    }
  }

  input.click();
}