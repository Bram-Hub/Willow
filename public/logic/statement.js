class Statement {
  /**
   * Evaluates this logical statement.
   * 
   * @returns {boolean} the truth value of this statement
   */
  evaluate() {
    throw new Error(
        "evaluate() not implemented for child instance of Statement"
    );
  }

  /**
   * Determines if this statement is a literal, which is either an atomic
   * statement or the negation of an atomic statement.
   * 
   * @returns {boolean} if this statement is a literal
   */
  isLiteral() {
    return this instanceof AtomicStatement || (
        this instanceof NotStatement && this.operand instanceof AtomicStatement
    );
  }
}

class Tautology extends Statement {
  /**
   * Evaluates this tautology.
   * 
   * @returns {boolean} the truth value of this tautology, which is always true
   */
  evaluate() {
    return true;
  }
}

class Contradiction extends Statement {
  /**
   * Evaluates this contradiction.
   * 
   * @returns {boolean} the truth value of this contradiction, which is always
   * false
   */
  evaluate() {
    return false;
  }
}

class AtomicStatement extends Statement {
  /**
   * Constructs an {@link AtomicStatement}, which is represented by a value.
   * 
   * @param {string} value the value representing this statement
   */
  constructor(value) {
    super();
    this.value = value;
  }
}

class UnaryStatement extends Statement {
  /**
   * Constructs a {@link UnaryStatement}, which is composed of a single operand.
   * 
   * @param {Statement} operand the single operand which composes this statement 
   */
  constructor(operand) {
    super();
    this.operand = operand;
  }
}

class NotStatement extends UnaryStatement {
  /**
   * Constructs a {@link NotStatement}, which is composed of a single operand.
   * 
   * @param {Statement} operand the single operand which composes this statement
   */
  constructor(operand) {
    super(operand);
  }

  /**
   * Evaluates this statement by applying the "logical NOT" operator on its
   * only operand.
   * 
   * @returns {boolean} the truth value of this statement, which is the negation
   * of its only operand
   */
  evaluate() {
    return !this.operand.evaluate();
  }
}

class CompositeStatement extends Statement {
  /**
   * Constructs a {@link CompositeStatement}, which is composed of multiple
   * operands.
   * 
   * @param {...Statement} operands the operands that compose this statement
   */
  constructor(...operands) {
    super();
    this.operands = operands;
  }
}

class AndStatement extends CompositeStatement {
  /**
   * Constructs an {@link AndStatement}, which is composed of multiple operands.
   * 
   * @param {...Statement} operands the operands that compose this statement 
   */
  constructor(...operands) {
    super(...operands);
  }

  /**
   * Evaluates this statement by applying the "logical AND" operator to its
   * operands.
   * 
   * @returns {boolean} the truth value of this statement
   */
  evaluate() {
    let result = true;
    for (const operand of this.operands) {
      result = result && operand.evaluate();
    }
    return result;
  }
}

class OrStatement extends CompositeStatement {
  /**
   * Constructs an {@link OrStatement}, which is composed of multiple operands.
   * 
   * @param {...Statement} operands the operands that compose this statement 
   */
  constructor(...operands) {
    super(...operands);
  }

  /**
   * Evaluates this statement by applying the "logical OR" operator to its
   * operands.
   * 
   * @returns {boolean} the truth value of this statement
   */
  evaluate() {
    let result = false;
    for (const operand of this.operands) {
      result = result || operand.evaluate();
    }
    return result;
  }
}

class BinaryStatement extends Statement {
  /**
   * Constructs a {@link BinaryStatement}, which is composed of exactly two
   * operands.
   * 
   * @param {Statement} lhs the left-hand side operand
   * @param {Statement} rhs the right-hand side operand
   */
  constructor(lhs, rhs) {
    super();
    this.lhs = lhs;
    this.rhs = rhs;
  }
}

class ConditionalStatement extends BinaryStatement {
  /**
   * Constructs a {@link ConditionalStatement}, which is composed of exactly two
   * operands.
   * 
   * @param {Statement} lhs the left-hand side operand 
   * @param {Statement} rhs the right-hand side operand
   */
  constructor(lhs, rhs) {
    super(lhs, rhs);
  }
  
  /**
   * Evaluates this statement by applying the "CONDITIONAL" operator on its two
   * operands.
   * 
   * @returns {boolean} the truth value of this statement
   */
  evaluate() {
    return !this.lhs.evaluate() || this.rhs.evaluate();
  }
}

class BiconditionalStatement extends BinaryStatement {
  /**
   * Constructs a {@link BiconditionalStatement}, which is composed of exactly two
   * operands.
   * 
   * @param {Statement} lhs the left-hand side operand 
   * @param {Statement} rhs the right-hand side operand
   */
  constructor(lhs, rhs) {
    super(lhs, rhs);
  }
  
  /**
   * Evaluates this statement by applying the "BICONDITIONAL" operator on its two
   * operands.
   * 
   * @returns {boolean} the truth value of this statement
   */
  evaluate() {
    return this.lhs.evaluate() == this.rhs.evaluate();
  }
}

/**
 * Validates the parentheses in a string, ensuring that the string is not
 * malformed. Also determines if a string is "wrapped" in parentheses, or if there
 * are matching opening and closing parentheses on either side of the string.
 * 
 * @param {string} string the string to validate
 * @throws {Error} if the string has malformed parentheses
 * @returns {boolean} if the string is wrapped in parentheses as described above
 */
function validateParentheses(string) {
  let depth = 0;
  // initialize wrapped to true until we find a character outside of the first
  // pair of parentheses
  let wrapped = true;
  for (const c of string) {
    // adjust the depth when a parenthesis is encountered
    if (c === "(") {
      depth += 1;
    } else if (c === ")") {
      depth -= 1;
    } else if (depth === 0) {
      wrapped = false;
    }
    if (depth < 0) {
      // if the depth is negative, the string is malformed
      throw new Error(
          "Parsing statement failed due to unexpected closing parenthesis"
      );
    }
  }
  if (depth !== 0) {
    // if the end depth is not 0, the string is malformed
    throw new Error(
        "Parsing statement failed due to unexpected opening parenthesis"
    );
  }
  return wrapped;
}

// array of operators sorted by preference with highest precedence first, and
// operators with equal precedence grouped into an array
const operatorsByPrecedence = [["↔", "→"], ["∨"], ["∧"], ["¬"]];

/**
 * Parses a string for a {@link Statement}.
 * 
 * @param {string} string the string to parse
 * @returns {Statement} the parsed statement
 */
function parseStatement(string) {
  string = string.trim();
  // remove matching pairs of parentheses from the beginning and end of the string
  while (validateParentheses(string)) {
    // while the string is "wrapped" in parentheses, remove the outer parentheses 
    string = string.slice(1, string.length - 1).trim();
  }

  // iterate through the operators in order of precedence, starting with lowest
  // precedence first
  for (const operators of operatorsByPrecedence) {
    // track the current depth, and only check for operators when the depth is 0
    let depth = 0;
    for (let i = 0; i < string.length; ++i) {
      const c = string[i];
      // adjust the depth when a parenthesis is encountered
      if (c === "(") {
        depth += 1;
      } else if (c === ")") {
        depth -= 1;
      } else if (operators.includes(c) && depth === 0) {
        // return an appropriate subclass of Statement based on the operator, and
        // parse additional operands as necessary
        if (c === "¬") {
          return new NotStatement(parseStatement(string.slice(i + 1)));
        } else if (["∨", "∧", "↔", "→"].includes(c)) {
          const lhs = parseStatement(string.slice(0, i));
          const rhs = parseStatement(string.slice(i + 1));
          if (c === "∨") {
            return new OrStatement(lhs, rhs);
          } else if (c === "∧") {
            return new AndStatement(lhs, rhs);
          } else if (c === "→") {
            return new ConditionalStatement(lhs, rhs);
          } else if (c === "↔") {
            return new BiconditionalStatement(lhs, rhs);
          }
        } else {
          throw new Error(`Unknown operator "${c}"`);
        }
      }
    }
  }
  // if the string could not be broken down into a statement, it must be an atomic
  // statement
  return new AtomicStatement(string);
}