const defaultSubstitutions = {
  "~": "¬",
  "|": "∨",
  "&": "∧",
  "$": " → ",
  "%": " ↔ ",
  ";": "◯",
  "'": "×",
};

// standalone symbols; i.e., no other characters can appear alongside these
// symbols
const standalone = ["◯", "×"];

const storedSubstitutions = localStorage.getItem("substitutions");
if (storedSubstitutions === null || (
    countKeys(JSON.parse(storedSubstitutions)) < countKeys(defaultSubstitutions)
)) {
  // store default substitutions
  localStorage.setItem("substitutions", JSON.stringify(defaultSubstitutions));
}
const substitutions = JSON.parse(localStorage.getItem("substitutions"));

/**
 * Makes character substitutions in a text input.
 *
 * @param input the input element
 */
function makeSubstitutions(input) {
  for (let [from, to] of Object.entries(substitutions)) {
    if (standalone.includes(to) && input.value.length > 1) {
      // if this substitution is standalone and there are other characters, then
      // do not perform the substitution
      to = "";
    }
    input.value = input.value.replace(from, to);
  }
}
