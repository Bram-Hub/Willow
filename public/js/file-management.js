/**
 * Saves a JSON file storing the current tree to the client.
 */
function saveFile() {
  const blob = new Blob(
      [JSON.stringify(vm.root.node, null, 4)],
      {type: "text/plain;charset=utf-8"}
  );
  saveAs(blob, vm.name + ".willow");
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
 * Opens a file browser, which will eventually load the tree.
 */
function openImportFile() {
  if (!confirm(
      "Opening a file will overwrite the current tree. Are you sure?"
  )) {
    return;
  }
  $("#open-import-file").click();
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
    if (filename.endsWith(".willow")) {
      filename = filename.substring(0, filename.length - 7);
    }
    vm.name = filename;

    const content = readerEvent.target.result;
    const nodeObj = JSON.parse(content);
    vm.root.node = TreeNode.fromObject(nodeObj);
  }
}

function recordPremises(xml_string, ref_line_map, ref_branch_map) {
  let index = 0;
  for (const statement of vm.root.node.statements) {
    if (!statement.premise) {
      index += 1;
      continue;
    }
    if (statement.str === "×") {
      xml_string += "<Terminator close=\"true\" index=\"" + index + "\">\n";
      for(const ref of statement.references) {
        xml_string += "<Decomposition lineIndex=\"" + ref_line_map[ref] + "\"/>\n";
      }
      xml_string += "</Terminator>\n";
    } else if (statement.str === "◯") {
      xml_string += "<Terminator close=\"open\" index=\"" + index + "\">\n";
      for(const ref of statement.references) {
        xml_string += "<Decomposition lineIndex=\"" + ref_line_map[ref] + "\"/>\n";
      }
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
          if (!branches_used.includes(branch_ref) && 0 != branches.length) {
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
  return xml_string;
}

function recordBranch(obj, xml_string, index, ref_line_map, ref_branch_map, branch_arr) {
  for (const statement of obj.statements) {
    if (statement.premise) {
      index += 1;
      continue;
    }
    if (statement.str === "×") {
      xml_string += "<Terminator close=\"true\" index=\"" + index + "\">\n";
      for(const ref of statement.references) {
        xml_string += "<Decomposition lineIndex=\"" + ref_line_map[ref] + "\"/>\n";
      }
      xml_string += "</Terminator>\n";
    } else if (statement.str == "◯") {
      xml_string += "<Terminator close=\"open\" index=\"" + index + "\">\n";
      for(const ref of statement.references) {
        xml_string += "<Decomposition lineIndex=\"" + ref_line_map[ref] + "\"/>\n";
      }
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
    const map_obj_str = JSON.stringify(map_obj);
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
  xml_string = recordPremises(xml_string, ref_to_index, arr_to_branch);
  xml_string += "<Branch>\n";
  xml_string = recordBranch(vm.root.node, xml_string, 0, ref_to_index, arr_to_branch, [])[0];
  xml_string += "</Branch>\n";
  xml_string += "</Tree>\n";

  const blob = new Blob([xml_string], {type: "text/plain;charset=utf-8"});
  saveAs(blob, vm.name + ".tft");
}

function handle_branch(node, map, index, branch_arr) {
  let branch_index = 0
  let offset = 0
  for (const child of node.children) {
    if ((child.tagName === "BranchLine" || child.tagName === "Terminator")) {
      map[index] = "{\"branches\":[" + branch_arr.toString() + "],\"offset\":" + offset + "}"
      index += 1
      offset += 1
    }
    else if (child.tagName === "Branch") {
      const branch_arr_copy = [...branch_arr]
      branch_arr_copy.push(branch_index)
      index = handle_branch(child, map, index, branch_arr_copy, false)
      branch_index += 1
    }
  }
  return index
}

function make_line_to_ref_mapping(xmlDoc, map){
  let dom_root = xmlDoc.querySelector("Tree");
  let index = 0
  for (const child of dom_root.children) {
    if (child.tagName === "BranchLine" || child.tagName === "Terminator") {
      map[index] = "{\"branches\":[],\"offset\":" + index + "}"
      index += 1
    }
    if (child.tagName === "Branch") {
      let branch_index = 0;
      for (const grandchild of child.children) {
        if (grandchild.tagName === "BranchLine" || grandchild.tagName === "Terminator") {
          map[index] = "{\"branches\":[],\"offset\":" + index + "}"
          index += 1
        }
        if (grandchild.tagName === "Branch") {
          index = handle_branch(grandchild, map, index, [branch_index])
          branch_index += 1
        }
      }
    }
  }
} 

function parseBranch(node, line_map) {
  let branch_node = new TreeNode();
  for (child of node.children) {
    if (child.tagName === "BranchLine") {
      let statement = {}
      statement.str = child.getAttribute("content");
      statement.premise = false
      statement.references = []
      for (const grandchild of child.children) {
        if (grandchild.tagName === "Decomposition") {
          if (grandchild.hasAttribute("branchIndex")) {
            continue;
          }
          let line_index = parseInt(grandchild.getAttribute("lineIndex"))
          let ref = line_map[line_index]
          statement.references.push(ref)
        }
      }
      branch_node.statements.push(statement)
    }
    else if (child.tagName === "Terminator") {
      let statement = {}
      statement.premise = false
      statement.references = []
      if (child.getAttribute("close") === "true") {
        statement.str = "×"
      }
      else {
        statement.str = "◯"
      }
      for (const grandchild of child.children) {
        if (grandchild.tagName === "Decomposition") {
          if (grandchild.hasAttribute("branchIndex")) {
            continue;
          }
          let line_index = parseInt(grandchild.getAttribute("lineIndex"))
          let ref = line_map[line_index]
          statement.references.push(ref)
        }
      }
      branch_node.statements.push(statement)
    }
    else if (child.tagName === "Branch") {
      branch_node.children.push(parseBranch(child, line_map))
    }
  }
  return branch_node;
}

function parseTFT(content) {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(content,"text/xml");
  let dom_root = xmlDoc.querySelector("Tree");
  
  let line_map = {}
  make_line_to_ref_mapping(xmlDoc, line_map);

  let tree_root = new TreeNode();
  for (const child of dom_root.children) {
    if (child.tagName === "BranchLine") {
      let statement = {}
      statement.str = child.getAttribute("content");
      statement.premise = true
      statement.references = []
      for (const grandchild of child.children) {
        if (grandchild.tagName === "Decomposition") {
          if (grandchild.hasAttribute("branchIndex")) {
            continue;
          }
          let line_index = parseInt(grandchild.getAttribute("lineIndex"))
          let ref = line_map[line_index]
          statement.references.push(ref)
        }
      }
      tree_root.statements.push(statement)
    }
    else if (child.tagName === "Branch") {
      for (const deep_child of child.children) {
        if (deep_child.tagName === "BranchLine") {
          let statement = {}
          statement.str = deep_child.getAttribute("content");
          statement.premise = false
          statement.references = []
          for (const grandchild of deep_child.children) {
            if (grandchild.tagName === "Decomposition") {
              if (grandchild.hasAttribute("branchIndex")) {
                continue;
              }
              let line_index = parseInt(grandchild.getAttribute("lineIndex"))
              let ref = line_map[line_index]
              statement.references.push(ref)
            }
          }
          tree_root.statements.push(statement)
        }
        else if (deep_child.tagName === "Terminator") {
          let statement = {}
          statement.premise = false
          statement.references = []
          if (deep_child.getAttribute("close") === "true") {
            statement.str = "×"
          }
          else {
            statement.str = "◯"
          }
          for (const grandchild of child.children) {
            if (grandchild.tagName === "Decomposition") {
              if (grandchild.hasAttribute("branchIndex")) {
                continue;
              }
              let line_index = parseInt(grandchild.getAttribute("lineIndex"))
              let ref = line_map[line_index]
              statement.references.push(ref)
            }
          }
          tree_root.statements.push(statement)
        }
        else if (deep_child.tagName === "Branch") {
          tree_root.children.push(parseBranch(deep_child, line_map))
        }
      }
    }
  }
  vm.root.node = tree_root;
}

function loadImportFile(event) {
  // retrieve the file reference
  const file = event.target.files[0]; 

  // setting up the reader
  const reader = new FileReader();
  reader.readAsText(file, "UTF-8");

  // load content when reader is done reading the file
  reader.onload = function(readerEvent) {
    let filename = file.name;
    if (filename.endsWith(".tft")) {
      filename = filename.substring(0, filename.length - 4);
    }
    vm.name = filename;

    const content = readerEvent.target.result;
    parseTFT(content);
  }
}