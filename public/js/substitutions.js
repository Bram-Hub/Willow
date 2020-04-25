let substitutions = {
  "!": "¬",
  "|": "∨",
  "&": "∧",
  "$": " → ",
  "%": " ↔ ",
  ";": str => str.length <= 1 ? "◯" : "",
  "'": str => str.length <= 1 ? "×" : "",
};

if (localStorage.getItem("substitutions") === null) {
  localStorage.setItem("substitutions", JSON.stringify(substitutions));
}else{
  substitutions = JSON.parse(localStorage.getItem("substitutions"));
  substitutions[";"] = str => str.length <= 1 ? "◯" : "";
  substitutions["'"] = str => str.length <= 1 ? "×" : "";
}

/**
 * Makes character substitutions in a text input.
 *
 * @param input the input element
 */
function makeSubstitutions(input) {
  for (let [from, to] of Object.entries(substitutions)) {
    if (to instanceof Function) {
      to = to(input.value);
    }
    input.value = input.value.replace(from, to);
  }
}
