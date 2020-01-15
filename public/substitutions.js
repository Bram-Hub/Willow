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
  const entries = Object.entries(substitutions);
  for (let i = 0; i < entries.length; ++i) {
    input.value = input.value.replace(entries[i][0], entries[i][1]);
  }
}