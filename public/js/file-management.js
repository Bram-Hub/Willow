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

function recordBranch(obj, xml_string, index, ref_line_map, ref_branch_map, branch_arr) {
  for (const statement of obj.statements) {
    if (statement.str === "×") {
      xml_string += "<Terminator close=\"true\" index=\"" + index + "\">\n";
      xml_string += "</Terminator>\n";
    } else if (statement.str == "◯") {
      xml_string += "<Terminator close=\"open\" index=\"" + index + "\">\n";
      xml_string += "</Terminator>\n";
    } else {
      if (statement.references.length === 0) {
        xml_string += "<BranchLine content=\"" + statement.str + "\" index=\"" + index + "\"/>\n";
      } else {
        xml_string += "<BranchLine content=\"" + statement.str + "\" index=\"" + index + "\">\n";
        let branches_used = [];
        for (const ref of statement.references) {
          const ref_obj = JSON.parse(ref);
          const branches = ref_obj["branches"];
          let branches_minus_last = [];
          if (branches.length > 0) {
            branches_minus_last = branches.slice(0, -1);
          } else {
            branches_minus_last = "null";
          }
          let branch_ref = branches_minus_last.toString();
          if (!branches_used.includes(branch_ref) && branch_arr.length != branches.length) {
            xml_string += "<Decomposition branchIndex=\"" + ref_branch_map[branch_ref.toString()] + "\"/>\n";
            branches_used.push(branch_ref);
          }
          xml_string += "<Decomposition lineIndex=\"" + ref_line_map[ref] + "\"/>\n";
        }
        xml_string += "</BranchLine>\n";
      } 
    }
    index += 1;
  }

  let i = 0;
  for (const child of obj.children) {
    const new_branch_arr = [...branch_arr];
    new_branch_arr.push(i);
    xml_string += "<Branch index=\"" + ref_branch_map[new_branch_arr.toString()] + "\">\n";
    ret_val = recordBranch(child, xml_string, index, ref_line_map, ref_branch_map, new_branch_arr);
    xml_string = ret_val[0];
    index = ret_val[1];
    xml_string += "</Branch>\n";
    i += 1;
  }
  return [xml_string, index];
}

function make_index_mapping(obj, map, index, branch_arr) {
  let i = 0;
  for (const statement of obj.statements) {
    const map_obj = {};
    map_obj["branches"] = branch_arr;
    map_obj["offset"] = i;
    map_obj_str = JSON.stringify(map_obj);
    map[map_obj_str] = index;
    index += 1;
    i += 1;
  }

  i = 0;
  for (const child of obj.children) {
    const new_branch_arr = [...branch_arr];
    new_branch_arr.push(i);
    index = make_index_mapping(child, map, index, new_branch_arr);
    i += 1;
  }
  return index;
}

function make_branch_mapping(obj, map, index, branch_arr) {
  map[branch_arr.toString()] = index;
  index += 1;
  let i = 0;
  for (const child of obj.children) {
    const new_branch_arr = [...branch_arr];
    new_branch_arr.push(i);
    index = make_branch_mapping(child, map, index, new_branch_arr);
    i += 1;
  }
  return index;
}

function exportToTFT() {
  const ref_to_index = {};
  make_index_mapping(vm.root.node, ref_to_index, 0, []);

  const arr_to_branch = {};
  make_branch_mapping(vm.root.node, arr_to_branch, 0, []);

  let xml_string = "";
  xml_string += "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"no\"?>\n";
  xml_string += "<Tree>\n";
  xml_string += "<Branch>\n";
  xml_string = recordBranch(vm.root.node, xml_string, 0, ref_to_index, arr_to_branch, [])[0];
  xml_string += "</Branch>\n";
  xml_string += "</Tree>\n";

  const blob = new Blob([xml_string], {type: "text/plain;charset=utf-8"});
  saveAs(blob, vm.name + ".tft");
}