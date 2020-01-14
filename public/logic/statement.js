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
   * @param {Statement[]} operands the operands that compose this statement
   */
  constructor(operands) {
    super();
    this.operands = operands;
  }
}

class AndStatement extends CompositeStatement {
  /**
   * Constructs an {@link AndStatement}, which is composed of multiple operands.
   * 
   * @param {Statement[]} operands the operands that compose this statement 
   */
  constructor(operands) {
    super(operands);
  }

  /**
   * Evaluates this statement by applying the "logical AND" operator to its
   * operands.
   * 
   * @returns {boolean} the truth value of this statement
   */
  evaluate() {
    result = true;
    for (const component of this.operands) {
      result = result && component.evaluate();
    }
    return result;
  }
}

class OrStatement extends CompositeStatement {
  /**
   * Constructs an {@link OrStatement}, which is composed of multiple operands.
   * 
   * @param {Statement[]} operands the operands that compose this statement 
   */
  constructor(operands) {
    super(operands);
  }

  /**
   * Evaluates this statement by applying the "logical OR" operator to its
   * operands.
   * 
   * @returns {boolean} the truth value of this statement
   */
  evaluate() {
    result = false;
    for (const component of this.operands) {
      result = result || component.evaluate();
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