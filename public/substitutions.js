const substitutions = {
  "!": "¬",
  "|": " ∨ ",
  "&": " ∧ ",
  "$": " → ",
  "%": " ↔ ",
};

/**
 * Makes character substitutions in a text input.
 * 
 * @param input the input element
 */
function makeSubstitutions(input) {
  for (const [from, to] of Object.entries(substitutions)) {
    input.value = input.value.replace(from, to);
  }
}