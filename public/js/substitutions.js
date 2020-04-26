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
  for(let key in substitutions){
    substitutions[key] = substitutions[key].toString()
  }
  localStorage.setItem("substitutions", JSON.stringify(substitutions));
}else{
  substitutions = JSON.parse(localStorage.getItem("substitutions"));
}
for(let key in substitutions){
  try {
    substitutions[key] = eval(substitutions[key])
  }
  catch(error) {}
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
