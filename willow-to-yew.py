#!/usr/bin/python3

import json, codecs, sys

# globals
data = {}
adj_list = {}
antecedent_map = {}

class TruthTreeNode:
    # Inner Representation
    text            = ""
    tree            = None
    premise         = False
    node_id         = None
    parent          = None
    children        = []
    antecedent      = None
    decomposition   = []
    
    def __init__(self, text : str, tree, **kwargs):
        self.text = text
        self.tree = tree
        if kwargs is not None:
            if 'premise' in kwargs:
                self.premise = kwargs['premise']
            if 'node_id' in kwargs:
                self.node_id = kwargs['node_id']
            if 'parent' in kwargs:
                self.parent = kwargs['parent']
            if 'children' in kwargs:
                self.children = kwargs['children']
            if 'antecedent' in kwargs:
                self.antecedent = kwargs['antecedent']
            if 'decomposition' in kwargs:
                self.decomposition = kwargs['decomposition']

def get_num_nodes(tree):
    total = len(tree['statements'])
    for i, child in enumerate(tree['children']):
        total += get_num_nodes(child)
    return total

def get_node_id(branches, offset):
    global data
    return get_node_id_helper(data, branches, offset)

def get_node_id_helper(tree, branches, offset):

    if branches == []:
        return offset
    # branches is not []

    num_nodes = len(tree['statements'])
    for i in range(branches[0]):
        num_nodes += get_num_nodes(tree['children'][i])
    
    if len(branches) == 1:
        return num_nodes + offset

    return num_nodes + get_node_id_helper(
        tree['children'][branches[0]],
        branches[1:],
        offset
    )

def parse_tree(tree, node_count, parent_id):

    num_statements_in_branch = len(tree['statements'])
    if num_statements_in_branch == 0:
        return

    nodes_used = 0

    # Recursively go through all the children and add their TruthTreeNode to output
    # also calculates the children root node numbers and stores them in "children" variable
    branch_children = []
    for index, child in enumerate(tree["children"]):
        branch_children.append(node_count + num_statements_in_branch + nodes_used)
        child_nodes_used = parse_tree(
            child,
            node_count + nodes_used + num_statements_in_branch, 
            node_count + num_statements_in_branch - 1, 
        )

        nodes_used += child_nodes_used

    global adj_list, antecedent_map
    # Add the nodes for all the statments
    for index, statement in enumerate(tree["statements"]):

        # calculate the decomposition from the references
        decomp = []
        for str_ref in statement['references']:
            ref = json.loads(str_ref)
            decomp += [
                get_node_id(ref['branches'], ref['offset'])
            ]

        # mark the antecedents
        if statement['str'] not in ["×", "◯"]:
            for node_id in decomp:
                antecedent_map[node_id] = node_count
        
        adj_list[node_count] = TruthTreeNode(
            statement['str'],
            None,
            premise = statement['premise'],
            node_id = node_count,
            # first in branch is child of last node in parent branch
            # parent of tail nodes is previous node
            parent = parent_id if index == 0 else node_count - 1,
            children = branch_children if index == num_statements_in_branch - 1 else [node_count+1],
            decomposition = decomp,
        )

        node_count += 1
        nodes_used += 1

    return nodes_used

def main():

    global data, adj_list, antecedent_map
    with open(sys.argv[1], "r") as f:
        data = json.loads(codecs.decode(f.read().encode(), "utf-8-sig"))

    filename = "".join(sys.argv[1].split(".")[:-1])

    # parse the tree
    parse_tree(data, 0, None)
    # update the antecedents
    for node_id, val in antecedent_map.items():
        adj_list[node_id].antecedent = val

    # write as JSON format to file
    output = []
    for node in adj_list.values():
        serialized_node = {
            'id': node.node_id,
            'text': node.text,
            'children': node.children,
            'decomposition': node.decomposition,
        }
        if node.premise:
            serialized_node['premise'] = node.premise
        if node.parent is not None:
            serialized_node['parent'] = node.parent
        if node.antecedent is not None:
            serialized_node['antecedent'] = node.antecedent

        output.append(serialized_node)

    with open(filename + ".yew", "w") as f:
        json.dump(output, f, indent=4)

if __name__ == "__main__":
    main()