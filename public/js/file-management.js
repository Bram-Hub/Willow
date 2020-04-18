/**
 * Saves a JSON file storing the current tree to the client.
 */
function saveFile() {
  var blob = new Blob(
      [JSON.stringify(vm.root)],
      {type: "text/plain;charset=utf-8"}
  );
  saveAs(blob, vm.name + ".json");
}

function convertToTreeNode(obj) {
  var treenode = new TreeNode();
  treenode.statements = obj.statements;
  for(var child of obj.children) {
    treenode.children.push(convertToTreeNode(child));
  }
  return treenode;
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
  document.getElementById("open-file").onchange = e => {
    // getting a hold of the file reference
    var file = e.target.files[0]; 

    // setting up the reader
    var reader = new FileReader();
    reader.readAsText(file,'UTF-8');

    // here we tell the reader what to do when it's done reading...
    reader.onload = readerEvent => {
      var content = readerEvent.target.result; // this is the content!
      var obj = JSON.parse(content);
      vm.root = convertToTreeNode(obj);
      console.log(vm.root);
    }
  }
  $("#open-file").click();
}