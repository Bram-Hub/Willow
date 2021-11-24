import {
	Statement,
	AtomicStatement,
	NotStatement,
	ConditionalStatement,
	BiconditionalStatement,
	AndStatement,
	OrStatement,
	UniversalStatement,
	ExistenceStatement,
} from './statement';
import {Formula} from './formula';

/**
 * An error that occurs when parsing an expression.
 */
class ParseError extends Error {
	/**
	 * The position at which the error occurred.
	 */
	position: number;

	/**
	 * An explanation of the error.
	 */
	message: string;

	/**
	 * Constructs a new `ParseError`.
	 * @param position the position at which the error occurred
	 * @param message an explanation of the error
	 */
	constructor(position: number, message: string) {
		super(`${message} at position ${position}`);
		this.position = position;
		this.message = message;

		// Without this, throwing an instance of ParseError appears as an Error in
		// the console
		Object.setPrototypeOf(this, ParseError.prototype);
	}
}

/**
 * A generic parser.
 */
abstract class Parser<T> {
	cache: {[chars: string]: string[]} = {};

	/**
	 * The text to currently being parsed.
	 */
	text = '';

	/**
	 * The READ position; i.e., the position in `text` that is currently being
	 * read.
	 */
	position = 0;

	/**
	 * Parses a string of text according to the ruleset defined by the derived class.
	 * @param text the text to parse
	 */
	parse(text: string) {
		this.text = text;

		const rv = this.start();
		this.assertEnd();
		return rv;
	}

	/**
	 * Represents the starting term in the context-free grammar.
	 */
	abstract start(): T;

	/**
	 * Asserts that the parsed text completely matched the patterns defined by
	 * the context-free grammar. If the text does not completely match any
	 * pattern, it is not within the generated language of the context-free
	 * grammar.
	 */
	assertEnd() {
		if (this.position < this.text.length) {
			throw new ParseError(
				this.position,
				`Expected end of string but got ${this.text[this.position]}`
			);
		}
	}

	/**
	 * Pushes the READ position forward until it is not on a whitespace character.
	 */
	consumeWhitespace() {
		while (
			this.position < this.text.length &&
			' \f\v\r\t\n'.includes(this.text[this.position])
		) {
			++this.position;
		}
	}

	/**
	 * Splits a special format of string into discrete ASCII ranges to match to.
	 * @param chars a regex-type characterset to expect.
	 * @returns the array of ASCII character ranges to match.
	 */
	splitCharRanges(chars: string): string[] {
		if (chars in this.cache) {
			return this.cache[chars];
		}

		const rv: string[] = [];
		let index = 0;

		while (index < chars.length) {
			if (index + 2 < chars.length && chars[index + 1] === '-') {
				if (chars[index] >= chars[index + 2]) {
					throw new Error('Bad character range');
				}

				rv.push(chars.slice(index, index + 3));
				index += 3;
			} else {
				rv.push(chars[index]);
				index++;
			}
		}

		this.cache[chars] = rv;
		return rv;
	}

	/**
	 * Attempts to match the character at the current READ position with a character from the given
	 * range. If no range is provided, it will match any character.
	 * @param chars the characterset to read from
	 * @returns the character that was matched
	 */
	char(chars: string | null = null): string {
		if (this.position >= this.text.length) {
			throw new ParseError(
				this.position,
				`Expected ${chars} but got end of string`
			);
		}

		const nextChar = this.text[this.position];
		if (chars === null) {
			++this.position;
			return nextChar;
		}

		for (const charRange of this.splitCharRanges(chars)) {
			if (charRange.length === 1) {
				if (nextChar === charRange) {
					++this.position;
					return nextChar;
				}
			} else if (charRange[0] <= nextChar && nextChar <= charRange[2]) {
				++this.position;
				return nextChar;
			}
		}

		throw new ParseError(
			this.position,
			`Expected ${chars} but got end of string`
		);
	}

	/**
	 * Attempts to match with any of the given keywords by slicing the text at the lengths of the
	 * keywords and comparing.
	 * @param keywords the keywords to match with
	 * @returns the keyword string that was matched
	 */
	keyword(...keywords: string[]): string {
		this.consumeWhitespace();
		if (this.position >= this.text.length) {
			throw new ParseError(
				this.position,
				`Expected ${keywords.join(',')} but got end of string`
			);
		}

		for (const keyword of keywords) {
			const low = this.position;
			const high = low + keyword.length;

			if (this.text.slice(low, high) === keyword) {
				this.position += keyword.length;
				this.consumeWhitespace();
				return keyword;
			}
		}

		throw new ParseError(
			this.position,
			`Expected ${keywords.join(',')} but got ${this.text[this.position]}`
		);
	}

	/**
	 * Attempts to match characters at and after the READ position with the provided rule names.
	 * The rules are then tested sequentially via recursive descent by calling the function
	 * named the same as those given in the argument.
	 * @param keywords the keywords to match with
	 * @returns the text that was matched with one of the rules.
	 */
	match(...rules: string[]) {
		this.consumeWhitespace();
		let lastErrorPosition = 0;
		let lastException = undefined;
		let lastErrorRules: string[] = [];

		for (const rule of rules) {
			const initialPosition = this.position;
			try {
				const rv = (this as any)[rule]();
				this.consumeWhitespace();
				return rv;
			} catch (e: any) {
				this.position = initialPosition;
				if (e.position > lastErrorPosition) {
					lastException = e;
					lastErrorPosition = e.position;
					lastErrorRules = [rule];
				} else if (e.position === lastErrorPosition) {
					lastErrorRules.push(rule);
				}
			}
		}

		if (lastErrorRules.length === 1) {
			throw lastException;
		}
		// else

		throw new ParseError(
			lastErrorPosition,
			`Expected ${lastErrorRules.join(',')} but got ${
				this.text[lastErrorPosition]
			}`
		);
	}

	/**
	 * Tries to match a character from the given range.
	 * @param chars the ASCII character range to match to
	 * @returns the matched character or null if no match
	 */
	maybeChar(chars: string | null = null): string | null {
		try {
			return this.char(chars);
		} catch (e) {
			return null;
		}
	}

	/**
	 * Tries to match the text following the READ position with one of the keywords from the list.
	 * @param keywords the list of keywords to match to
	 * @returns the matched keyword or null if no match
	 */
	maybeKeyword(...keywords: string[]): string | null {
		try {
			return this.keyword(...keywords);
		} catch (e) {
			return null;
		}
	}

	/**
	 * Tries to match the text according to the pattern defined by one of the rules from the list.
	 * @param rules the list of rules to match to
	 * @returns the text matched or null if no match
	 */
	maybeMatch(...rules: string[]): T | null {
		try {
			return this.match(...rules);
		} catch (e) {
			return null;
		}
	}
}

/**
 * Provides a parser for the following LL(1) propositional logic grammar:
 * start        -> expr_gen
 * expr_gen     -> or_expr_gen expr
 * expr         -> "iff" or_expr_gen expr
 *                   | "implies" or_expr_gen expr
 *                   | eps
 * or_expr_gen  -> and_expr_gen or_expr
 * or_expr      -> "or" and_expr_gen or_expr
 *                   | eps
 * and_expr_gen -> unary_expr and_expr
 * and_expr     -> "and" unary_expr and_expr
 *                   | eps
 * unary_expr   -> "not" unary_expr
 *                   | "(" expr_gen ")"
 *                   | id
 */
export class PropositionalLogicParser extends Parser<Statement> {
	/**
	 * Stores the valid text representations of the supported operators.
	 */
	static readonly OPERATORS = {
		iff: ['↔', '<->', '%', 'iff', 'equiv'],
		implies: ['→', '->', '$', 'implies', 'only if'],
		and: ['∧', '&', 'and'],
		or: ['∨', '|', 'or'],
		not: ['¬', '!', '~', 'not'],
	};

	start(): Statement {
		return this.expressionGenerator();
	}

	expressionGenerator(): Statement {
		const e2 = this.match('orExprGenerator');
		const f1 = this.match('expression');
		if (f1 === null) {
			// epsilon
			return e2;
		}

		const op = f1[0],
			stmt = f1[1];

		if (PropositionalLogicParser.OPERATORS['iff'].includes(op)) {
			return new BiconditionalStatement(e2, stmt);
		} else if (PropositionalLogicParser.OPERATORS['implies'].includes(op)) {
			return new ConditionalStatement(e2, stmt);
		}
		throw new ParseError(
			this.position,
			`Expected biconditional/conditional operator but got ${
				this.text[this.position]
			}`
		);
	}

	expression() {
		/*
		returns one of:
			- BiconditionalStatement
			- ConditionalStatement
			- Tuple? containing [str, Statement]
			- null
		*/

		const op = this.maybeKeyword(
			...PropositionalLogicParser.OPERATORS['iff'],
			...PropositionalLogicParser.OPERATORS['implies']
		);
		if (op === null) {
			// epsilon
			return null;
		}

		const e2 = this.match('orExprGenerator');
		const f1 = this.match('expression');
		if (f1 === null) {
			// epsilon
			return [op, e2];
		}

		const nestedOp = f1[0],
			stmt = f1[1];

		if (PropositionalLogicParser.OPERATORS['iff'].includes(nestedOp)) {
			return new BiconditionalStatement(e2, stmt);
		} else if (
			PropositionalLogicParser.OPERATORS['implies'].includes(nestedOp)
		) {
			return new ConditionalStatement(e2, stmt);
		}

		throw new ParseError(
			this.position,
			`Expected biconditional/conditional operator but got ${
				this.text[this.position]
			}`
		);
	}

	orExprGenerator(): Statement {
		const e3 = this.match('andExpressionGenerator');
		const f2 = this.match('orExpression');
		if (f2 === null) {
			return e3;
		}

		// auto-reduce
		if (f2 instanceof OrStatement) {
			return new OrStatement(e3, ...f2.operands);
		}

		return new OrStatement(e3, f2);
	}

	orExpression(): OrStatement | null {
		const op = this.maybeKeyword(...PropositionalLogicParser.OPERATORS['or']);
		if (op === null) {
			// epsilon
			return null;
		}

		const e3 = this.match('andExpressionGenerator');
		const f2 = this.match('orExpression');
		if (f2 === null) {
			return e3;
		}

		// auto-reduce
		if (f2 instanceof OrStatement) {
			return new OrStatement(e3, ...f2.operands);
		}

		return new OrStatement(e3, f2);
	}

	andExpressionGenerator(): Statement {
		const e4 = this.match('unaryExpression');
		const f3 = this.match('andExpression');
		if (f3 === null) {
			// eps
			return e4;
		}

		// auto-reduce
		if (f3 instanceof AndStatement) {
			return new AndStatement(e4, ...f3.operands);
		}

		return new AndStatement(e4, f3);
	}

	andExpression(): AndStatement | null {
		const op = this.maybeKeyword(...PropositionalLogicParser.OPERATORS['and']);
		if (op === null) {
			// eps
			return null;
		}

		const e4 = this.match('unaryExpression');
		const f3 = this.match('andExpression');
		if (f3 === null) {
			// eps
			return e4;
		}

		// auto-reduce and statements
		if (f3 instanceof AndStatement) {
			return new AndStatement(e4, ...f3.operands);
		}

		return new AndStatement(e4, f3);
	}

	unaryExpression(): Statement {
		if (this.maybeKeyword(...PropositionalLogicParser.OPERATORS['not'])) {
			// not statement
			const notStmt = this.match('unaryExpression');

			return new NotStatement(notStmt);
		} else if (this.maybeKeyword('(')) {
			// parenthesized statement
			const parensStmt = this.match('expressionGenerator');
			this.keyword(')');

			return parensStmt;
		}

		return new AtomicStatement(this.match('predicateName'));
	}

	predicateName(): string {
		const acceptableChars = '0-9A-Za-z';
		const chars = [this.char('A-Z')];

		let char: string | null = this.maybeChar(acceptableChars);

		while (char !== null) {
			chars.push(char);
			char = this.maybeChar(acceptableChars);
		}

		return chars.join('');
	}

	symbolName(): string {
		const acceptableChars = '0-9A-Za-z';
		const chars = [this.char('a-z')];

		let char: string | null = this.maybeChar(acceptableChars);

		while (char !== null) {
			chars.push(char);
			char = this.maybeChar(acceptableChars);
		}

		return chars.join('');
	}
}

/**
 * A parser for first-order logic expressions. The LL(1) first-order logic
 * grammar is:
 * start        -> expr_gen
 * expr_gen     -> or_expr_gen expr
 * expr         -> "iff" or_expr_gen expr
 *                   | "implies" or_expr_gen expr
 *                   | eps
 * or_expr_gen  -> and_expr_gen or_expr
 * or_expr      -> "or" and_expr_gen or_expr
 *                   | eps
 * and_expr_gen -> unary_expr and_expr
 * and_expr     -> "and" unary_expr and_expr
 *                   | eps
 * unary_expr   -> "not" unary_expr
 *                   | "forall" id_list unary_expr
 *                   | "exists" id_list unary_expr
 *                   | "(" expr_gen ")"
 *                   | predicate
 * predicate    -> capitalLetter formula
 * formula      -> formula formula_tail
 * formula_tail -> ( formula )
 * 					         | eps
 */
export class FirstOrderLogicParser extends PropositionalLogicParser {
	/**
	 * Stores the valid text representations of the supported operators.
	 */
	static readonly OPERATORS = {
		forall: ['∀', 'forall'],
		exists: ['∃', 'exists'],
		iff: ['↔', '<->', '%', 'iff', 'equiv'],
		implies: ['→', '->', '$', 'implies', 'only if'],
		and: ['∧', '&', 'and'],
		or: ['∨', '|', 'or'],
		not: ['¬', '!', '~', 'not'],
	};

	unaryExpression(): Statement {
		if (this.maybeKeyword(...FirstOrderLogicParser.OPERATORS['not'])) {
			// not statement
			const notStatement = this.match('unaryExpression');

			return new NotStatement(notStatement);
		} else if (
			this.maybeKeyword(...FirstOrderLogicParser.OPERATORS['forall'])
		) {
			// universal statement
			const variables = this.match('symbolNameList');
			const statement = this.match('unaryExpression');

			return new UniversalStatement(variables, statement);
		} else if (
			this.maybeKeyword(...FirstOrderLogicParser.OPERATORS['exists'])
		) {
			// existence statement
			const variables = this.match('symbolNameList');
			const statement = this.match('unaryExpression');

			return new ExistenceStatement(variables, statement);
		} else if (this.maybeKeyword('(')) {
			// parenthesized statement
			const parensStmt = this.match('expressionGenerator');
			this.keyword(')');

			return parensStmt;
		}

		return new AtomicStatement(this.match('predicate'));
	}

	predicate(): Formula {
		const predicateName = this.match('predicateName');
		const predicateArguments = this.match('formulaTail');

		return new Formula(predicateName, predicateArguments, true);
	}

	formula(): Formula {
		const functionSymbol = this.match('symbolName');
		const functionArguments = this.match('formulaTail');

		return new Formula(functionSymbol, functionArguments);
	}

	formulaTail(): Formula[] | null {
		// If there is no open parenthesis, then it must be the innermost symbolName
		if (this.maybeKeyword('(') === null) {
			return null;
		}
		// Otherwise, it is a function definition i.e. f( ? )
		const innerIdentifier = this.match('formulaList');

		// Make sure to consume the closing parenthesis
		this.keyword(')');
		return innerIdentifier;
	}

	formulaList(): Formula[] {
		const head = this.match('formula');
		const tail = this.match('formulaListTail');

		return [head, ...tail];
	}

	formulaListTail(): Formula[] {
		// Must start with a ','
		if (this.maybeKeyword(',') === null) {
			return [];
		}

		const head = this.match('formula');
		const tail = this.match('formulaListTail');

		return [head, ...tail];
	}

	symbolNameList(): Formula[] {
		const head = this.match('symbolName');
		const tail = this.match('symbolNameListTail');

		return [new Formula(head), ...tail];
	}

	symbolNameListTail(): Formula[] {
		// Must start with a ','
		if (this.maybeKeyword(',') === null) {
			return [];
		}

		const head = this.match('symbolName');
		const tail = this.match('symbolNameListTail');

		return [new Formula(head), ...tail];
	}
}
