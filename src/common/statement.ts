class Statement {

    /**
     * Decomposes this statement into an array of branches, where each branch
     * contains the necessary decomposed statements.
     * 
     * @returns {Statement[][]} the decomposed statements by branch
     */
    decompose() : Statement[] | Statement[][] {
        return [];
    }

    /**
     * Converts this statement to a string.
     * 
     * @returns {string} the string representation of this statement
     */
    toString() {
        throw new Error(
                "toString() not implemented for child instance of Statement"
        );
    }

    /**
     * Determines if this statement is a literal, which is either an atomic
     * statement or the negation of an atomic statement.
     * 
     * @returns {boolean} if this statement is a literal
     */
    isLiteral() : boolean {
        return this instanceof AtomicStatement || (
                this instanceof NotStatement && this.operand instanceof AtomicStatement
        );
    }

    isMemberOfDecomp(other : Statement) : boolean {
        const decomp = other.decompose();
        for (const branch of decomp) {
            if (Array.isArray(branch)) {
                if (branch.includes(this)) {
                    return true;
                }
            } else {
                return this === branch;
            }
        }
        return false;
    }
}

class Tautology extends Statement {

    /**
     * Converts this statement to a string.
     * 
     * @returns {string} the string representation of this statement
     */
    toString() {
        return "⊤";
    }
}

class Contradiction extends Statement {

    /**
     * Converts this statement to a string.
     * 
     * @returns {string} the string representation of this statement
     */
    toString() {
        return "⊥";
    }
}

class AtomicStatement extends Statement {

    value : string;

    /**
     * Constructs an {@link AtomicStatement}, which is represented by a value.
     * 
     * @param {string} value the value representing this statement
     */
    constructor(value) {
        super();
        this.value = value;
    }

    /**
     * Converts this statement to a string.
     * 
     * @returns {string} the string representation of this statement
     */
    toString() {
        return this.value;
    }
}

class UnaryStatement extends Statement {

    operand : Statement;

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
     * Decomposes this statement into an array of branches, where each branch
     * contains the necessary decomposed statements.
     * 
     * @returns {Statement[][]} the decomposed statements by branch
     */
    decompose() {
        if (this.operand instanceof NotStatement) {
            return [this.operand.operand];
        } else if (this.operand instanceof AndStatement) {
            return this.operand.operands.map(operand => [new NotStatement(operand)]);
        } else if (this.operand instanceof OrStatement) {
            return this.operand.operands.map(operand => new NotStatement(operand));
        } else if (this.operand instanceof ConditionalStatement) {
            return [this.operand.lhs, new NotStatement(this.operand.rhs)];
        } else if (this.operand instanceof BiconditionalStatement) {
            return [
                [this.operand.lhs, new NotStatement(this.operand.rhs)],
                [new NotStatement(this.operand.lhs), this.operand.rhs],
            ];
        }
        // negation of literal, so no decomposition
        return [];
    }

    /**
     * Converts this statement to a string.
     * 
     * @returns {string} the string representation of this statement
     */
    toString() {
        return "¬" + this.operand.toString();
    }
}

class CommutativeStatement extends Statement {

    operands : Statement[];

    /**
     * Constructs a {@link CommutativeStatement}, which is composed of multiple
     * operands.
     * 
     * @param {...Statement} operands the operands that compose this statement
     */
    constructor(...operands) {
        super();
        this.operands = operands;
    }
}

class AndStatement extends CommutativeStatement {
    /**
     * Constructs an {@link AndStatement}, which is composed of multiple operands.
     * 
     * @param {...Statement} operands the operands that compose this statement 
     */
    constructor(...operands) {
        super(...operands);
    }

    /**
     * Decomposes this statement into an array of branches, where each branch
     * contains the necessary decomposed statements.
     * 
     * @returns {Statement[][]} the decomposed statements by branch
     */
    decompose() {
        return this.operands;
    }
    
    /**
     * Converts this statement to a string.
     * 
     * @returns {string} the string representation of this statement
     */
    toString() {
        return "(" + this.operands.map(operand => operand.toString()).join(" ∧ ") +
                ")";
    }
}

class OrStatement extends CommutativeStatement {
    /**
     * Constructs an {@link OrStatement}, which is composed of multiple operands.
     * 
     * @param {...Statement} operands the operands that compose this statement 
     */
    constructor(...operands) {
        super(...operands);
    }

    /**
     * Decomposes this statement into an array of branches, where each branch
     * contains the necessary decomposed statements.
     * 
     * @returns {Statement[][]} the decomposed statements by branch
     */
    decompose() {
        return this.operands.map(operand => [operand]);
    }

    /**
     * Converts this statement to a string.
     * 
     * @returns {string} the string representation of this statement
     */
    toString() {
        return "(" + this.operands.map(operand => operand.toString()).join(" ∨ ") +
                ")";
    }
}

class BiconditionalStatement extends CommutativeStatement {

    lhs : Statement;
    rhs : Statement;

    /**
     * Constructs a {@link BiconditionalStatement}, which is composed of exactly two
     * operands.
     * 
     * @param {Statement} lhs the left-hand side operand 
     * @param {Statement} rhs the right-hand side operand
     */
    constructor(lhs, rhs) {
        super(lhs, rhs);
        this.lhs = lhs;
        this.rhs = rhs;
    }

    /**
     * Decomposes this statement into an array of branches, where each branch
     * contains the necessary decomposed statements.
     * 
     * @returns {Statement[][]} the decomposed statements by branch
     */
    decompose() {
        return [
            [this.lhs, this.rhs],
            [new NotStatement(this.lhs), new NotStatement(this.rhs)],
        ];
    }

    /**
     * Converts this statement to a string.
     * 
     * @returns {string} the string representation of this statement
     */
    toString() {
        return "(" + this.lhs.toString() + " ↔ " + this.rhs.toString() + ")";
    }
}

class BinaryStatement extends Statement {

    lhs : Statement;
    rhs : Statement;

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
     * Decomposes this statement into an array of branches, where each branch
     * contains the necessary decomposed statements.
     * 
     * @returns {Statement[][]} the decomposed statements by branch
     */
    decompose() {
        return [[new NotStatement(this.lhs)], [this.rhs]];
    }
    
    /**
     * Converts this statement to a string.
     * 
     * @returns {string} the string representation of this statement
     */
    toString() {
        return "(" + this.lhs.toString() + " → " + this.rhs.toString() + ")";
    }
}

