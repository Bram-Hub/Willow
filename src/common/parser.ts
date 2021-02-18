
class ParseError extends Error {
    pos : number;
    msg : string;

    constructor(pos, msg) {
        super(`${msg} at position ${pos}`);
        this.pos = pos;
        this.msg = msg;

        // set it to be a ParseError instead of an Error, thanks TS!
        Object.setPrototypeOf(this, ParseError.prototype);
    }
    
}

class Parser {
    cache : {};
    text : string;
    pos : number;
    len : number;

    constructor() {
        this.cache = {};
    }

    parse(text: string) {
        this.text = text;
        this.pos = -1;
        this.len = text.length - 1;
        let rv = this.start();
        this.assertEnd();
        return rv;
    }

    start() {
        throw new Error("Not Implemented");
    }

    assertEnd() {
        if (this.pos < this.len) {
            const txt = `Expected end of string but got ${this.text[this.pos + 1]}`;
            throw new ParseError(this.pos + 1, txt);
        }
    }

    eatWhitespace() {
        while (this.pos < this.len && " \f\v\r\t\n".includes(this.text[this.pos + 1])) {
            this.pos++;
        }
    }

    splitCharRanges(chars : string) : string[] {
        try {
            return this.cache[chars];
        } catch (e) {}

        let rv : string[] = [];
        let index = 0;

        while (index < chars.length) {
            if (index + 2 < chars.length && chars[index + 1] === '-') {
                if (chars[index] >= chars[index + 2]) {
                    throw new Error('Bad character range');
                }

                rv.push( chars.slice(index, index + 3) );
                index += 3;
            } else {
                rv.push( chars[index] );
                index++;
            }
        }

        this.cache[chars] = rv;
        return rv;
    }

    char(chars : string = null) {
        if (this.pos >= this.len) {
            const txt = `Expected ${chars} but got end of string`;
            throw new ParseError(this.pos + 1, txt);
        }

        const nextChar = this.text[this.pos + 1];
        if (chars === null) {
            this.pos++;
            return nextChar;
        }
        
        for (const charRange of this.splitCharRanges(chars)) {
            if (charRange.length === 1) {
                if (nextChar === charRange) {
                    this.pos++;
                    return nextChar;
                }
            } else if (charRange[0] <= nextChar && nextChar <= charRange[2]) {
                this.pos++;
                return nextChar;
            }
        }

        const txt = `Expected ${chars} but got ${nextChar}`;
        throw new ParseError(this.pos + 1, txt);
    }

    keyword(...keywords : string[]) {
        this.eatWhitespace();
        if (this.pos >= this.len) {
            const txt = `Expected ${keywords.join(',')} but got end of string`;
            throw new ParseError(this.pos + 1, txt);
        }

        for (const keyword of keywords) {
            const low = this.pos + 1;
            const high = low + keyword.length;

            if (this.text.slice(low, high) === keyword) {
                this.pos += keyword.length;
                this.eatWhitespace();
                return keyword;
            }
        }

        const txt = `Expected ${keywords.join(',')} but got ${this.text[this.pos+1]}`;
        throw new ParseError(this.pos + 1, txt);
    }

    match(...rules : string[]) {
        this.eatWhitespace();
        let lastErrorPos = -1;
        let lastException = undefined;
        let lastErrorRules = [];

        for (const rule of rules) {
            const initialPos = this.pos;
            try {
                const rv = this[rule]();
                this.eatWhitespace();
                return rv;
            } catch (e) {
                this.pos = initialPos;
                if (e.pos > lastErrorPos) {
                    lastException = e;
                    lastErrorPos = e.pos;
                    lastErrorRules = [rule];
                } else if (e.pos === lastErrorPos) {
                    lastErrorRules.push(rule);
                }
            }
        }

        if (lastErrorRules.length === 1) {
            throw lastException;
        }
        // else

        const txt = `Expected ${lastErrorRules.join(',')} but got ${this.text[lastErrorPos]}`;
        throw new ParseError(lastErrorPos, txt);
    }

    maybeChar(chars=null) {
        try {
            return this.char(chars);
        } catch(e) {
            return null;
        }
    }

    maybeMatch(...rules) {
        try {
            return this.match(...rules);
        } catch (e) {
            return null;
        }
    }

    maybeKeyword(...keywords) {
        try {
            return this.keyword(...keywords);
        } catch (e) {
            return null;
        }
    }

}

class PL_Parser extends Parser {
    operators = {
        'iff': [
            '↔', '<->', '%', 'iff', 'equiv'
        ],
        'implies': [
            '→', '->', '$', 'implies', 'only if'
        ],
        'and': [
            '∧', '&', 'and',
        ],
        'or': [
            '∨', '|', 'or'
        ],
        'not': [
            '¬', '!', '~', 'not'
        ]
    };

    start() : Statement {
        const result = this.exprGen();
        reduceStatement(result);
        return result;
    }

    exprGen() : Statement {
        const e2 = this.match('orExprGen');
        const f1 = this.match('expr');
        if (f1 === null) {
            // epsilon
            return e2;
        }

        const op = f1[0], stmt = f1[1];

        if (this.operators['iff'].includes(op)) {
            return new BiconditionalStatement(e2, stmt);
        } else if (this.operators['implies'].includes(op)) {
            return new ConditionalStatement(e2, stmt);
        }
        throw new ParseError(
            this.pos+1,
            `Expected biconditional/conditional operator but got ${this.text[this.pos+1]}`
        );
    }

    expr() {
        /*
        returns one of:
            - BiconditionalStatement
            - ConditionalStatement
            - Tuple? containing [str, Statement]
            - null
        */

        const op = this.maybeKeyword(
            ...this.operators['iff'],
            ...this.operators['implies']
        );
        if (op === null) {
            // epsilon
            return null;
        }

        const e2 = this.match('orExprGen');
        const f1 = this.match('expr');
        if (f1 === null) {
            // epsilon
            return [op, e2];
        }

        const nestedOp = f1[0], stmt = f1[1];

        if (this.operators['iff'].includes(nestedOp)) {
            return new BiconditionalStatement(e2, stmt);
        } else if (this.operators['implies'].includes(nestedOp)) {
            return new ConditionalStatement(e2, stmt);
        }
        throw new ParseError(
            this.pos+1,
            `Expected biconditional/conditional operator but got ${this.text[this.pos+1]}`
        );
    }

    orExprGen() : Statement {
        const e3 = this.match('andExprGen');
        const f2 = this.match('orExpr');
        if (f2 === null) {
            return e3;
        }

        return new OrStatement(e3, f2);
    }

    orExpr() : OrStatement | null {
        const op = this.maybeKeyword(...this.operators['or']);
        if (op === null) {
            // epsilon
            return null;
        }
        
        const e3 = this.match('andExprGen');
        const f2 = this.match('orExpr');
        if (f2 === null) {
            return e3;
        }

        return new OrStatement(e3, f2);
    }

    andExprGen() : Statement {

        const e4 = this.match('notExpr');
        const f3 = this.match('andExpr');
        if (f3 === null) {
            // eps
            return e4;
        }

        return new AndStatement(e4, f3);
    }
    
    andExpr() : AndStatement | null {
        const op = this.maybeKeyword(...this.operators['and']);
        if (op === null) {
            // eps
            return null;
        }
        
        const e4 = this.match('notExpr');
        const f3 = this.match('andExpr');
        if (f3 === null) {
            // eps
            return e4;
        }

        return new AndStatement(e4, f3);
    }
        
    notExpr() : Statement {
        
        if (this.maybeKeyword(...this.operators['not'])) {
            // not statement
            const notStmt = this.match('notExpr');

            return new NotStatement(notStmt);

        } else if (this.maybeKeyword('(')) {
            // parenthesized statement
            const parensStmt = this.match('exprGen');
            this.keyword(')');

            return parensStmt;
        }

        return new AtomicStatement(this.match('identifier'));
    }

    identifier() : string {
        const acceptableChars = '0-9A-Za-z';
        const chars = [this.char(acceptableChars)];

        while (true) {
            const char = this.maybeChar(acceptableChars);
            if (char === null) {
                break;
            }
            
            chars.push(char);
        }
        
        return chars.join('');
    }
}

function reduceStatement(statement : Statement) {
    if (statement instanceof UnaryStatement) {
        reduceStatement(statement.operand);
    } else if (statement instanceof BinaryStatement) {
        reduceStatement(statement.lhs);
        reduceStatement(statement.rhs);
    } else if (statement instanceof CommutativeStatement) {
        for (const child of statement.operands) {
            reduceStatement(child);
            if (child instanceof CommutativeStatement && typeof(statement) === typeof(child)) {
                // absorb the child's children
                statement.operands = statement.operands.concat(child.operands);
                // remove the child
                const index = statement.operands.indexOf(child);
                statement.operands.splice(index, 1);
            }
        }
    }
    // otherwise it's a literal in which case there is no reduction
}