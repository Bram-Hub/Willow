/**
 * Saves a JSON file storing the current tree to the client.
 */
function saveFile() {
  const blob = new Blob(
      [JSON.stringify(vm.root.node, null, 4)],
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

function recordBranch(obj, xml_string, index) {
  console.log(obj)
  for(statement of obj.statements) {
    if (statement.str == "×" || statement.str == "") {
      xml_string += "<BranchLine content=\"" + statement.str + "\"index=\"" + index + "\">\n"
      xml_string += "</BranchLine>\n"
    }
    else {
      xml_string += "<BranchLine content=\"" + statement.str + "\"index=\"" + index + "\">\n"
      xml_string += "</BranchLine>\n"
    }
    index += 1
  }

  for(child of obj.children) {
    xml_string += "<Branch>\n"
    ret_val = recordBranch(child, xml_string, index)
    xml_string = ret_val[0]
    index = ret_val[1]
    xml_string += "</Branch>\n"
  }
  return [xml_string, index]
}

function make_index_mapping(obj, map, index) {
  
}

function exportToTFT() {

  //line_to_index = {}
  //make_index_mapping(vm.root, line_to_index, 0)

  console.log("exporting")
  let xml_string = ""
  xml_string += "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"no\"?>\n"
  xml_string += "<Tree>\n"
  xml_string = recordBranch(vm.root.node, xml_string, 0)[0]
  xml_string += "</Tree>\n"

  const blob = new Blob(
    [xml_string],
    {type: "text/plain;charset=utf-8"}
  );
  saveAs(blob, vm.name + ".tft");
}