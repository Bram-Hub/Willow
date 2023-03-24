import {Formula} from '../src/common/formula';
import {
    StatementReducer,
    AndStatement,
    AtomicStatement,
    NotStatement,
    Contradiction,
    OrStatement,
    ConditionalStatement,
    BiconditionalStatement,
    Tautology
} from '../src/common/statement';

const notStatementToReduce = new NotStatement(new AtomicStatement(new Formula("H")));
const andStatementToReduce1 = new AndStatement(new AtomicStatement(new Formula("H")), new AtomicStatement(new Formula("B")));
const andStatementToReduce2 = new AndStatement(new AtomicStatement(new Formula("B")), new AtomicStatement(new Formula("H")));
const orStatementToReduce1 = new OrStatement(new AtomicStatement(new Formula("H")), new AtomicStatement(new Formula("B")));
const orStatementToReduce2 = new OrStatement(new AtomicStatement(new Formula("B")), new AtomicStatement(new Formula("H")));
const conditionalStatementToReduce1 = new ConditionalStatement(new AtomicStatement(new Formula("H")), new AtomicStatement(new Formula("B")));
const conditionalStatementToReduce2 = new ConditionalStatement(new AtomicStatement(new Formula("B")), new AtomicStatement(new Formula("H")));
const biconditionalStatementToReduce1 = new BiconditionalStatement(new AtomicStatement(new Formula("H")), new AtomicStatement(new Formula("B")));
const biconditionalStatementToReduce2 = new BiconditionalStatement(new AtomicStatement(new Formula("B")), new AtomicStatement(new Formula("H")));

const notStatementReducer = new StatementReducer(notStatementToReduce);
const andStatementReducer1 = new StatementReducer(andStatementToReduce1);
const andStatementReducer2 = new StatementReducer(andStatementToReduce2);
const orStatementReducer1 = new StatementReducer(orStatementToReduce1);
const orStatementReducer2 = new StatementReducer(orStatementToReduce2);
const conditionalStatementReducer1 = new StatementReducer(conditionalStatementToReduce1);
const conditionalStatementReducer2 = new StatementReducer(conditionalStatementToReduce2);
const biconditionalStatementReducer1 = new StatementReducer(biconditionalStatementToReduce1);
const biconditionalStatementReducer2 = new StatementReducer(biconditionalStatementToReduce2);

// NOT reduction rules

test('¬True should have conclusion False', () => {
    const literal = new AtomicStatement(new Formula("H"));
    const conclusion = new Contradiction;
    const result = notStatementReducer.validateReduction(literal, conclusion);
    expect(result).toBeTruthy();
});

test('¬False should have conclusion True', () => {
    const literal = new NotStatement(new AtomicStatement(new Formula("H")));
    const conclusion = new Tautology;
    const result = notStatementReducer.validateReduction(literal, conclusion);
    expect(result).toBeTruthy();
});

// AND reduction rules

test('True ∧ P should have conclusion P', () => {
    const literal = new AtomicStatement(new Formula("H"));
    const conclusion = new AtomicStatement(new Formula("B"));
    const result = andStatementReducer1.validateReduction(literal, conclusion);
    expect(result).toBeTruthy();
});

test('False ∧ P should have conclusion False', () => {
    const literal = new NotStatement(new AtomicStatement(new Formula("H")));
    const conclusion = new Contradiction;
    const result = andStatementReducer1.validateReduction(literal, conclusion);
    expect(result).toBeTruthy();
});

test('P ∧ True should have conclusion P', () => {
    const literal = new AtomicStatement(new Formula("H"));
    const conclusion = new AtomicStatement(new Formula("B"));
    const result = andStatementReducer2.validateReduction(literal, conclusion);
    expect(result).toBeTruthy();
});

test('P ∧ False should have conclusion False', () => {
    const literal = new NotStatement(new AtomicStatement(new Formula("H")));
    const conclusion = new Contradiction;
    const result = andStatementReducer2.validateReduction(literal, conclusion);
    expect(result).toBeTruthy();
});

// OR reduction rules

test('True ∨ P should have conclusion True', () => {
    const literal = new AtomicStatement(new Formula("H"));
    const conclusion = new Tautology;
    const result = orStatementReducer1.validateReduction(literal, conclusion);
    expect(result).toBeTruthy();
});

test('False ∨ P should have conclusion P', () => {
    const literal = new NotStatement(new AtomicStatement(new Formula("H")));
    const conclusion = new AtomicStatement(new Formula("B"));
    const result = orStatementReducer1.validateReduction(literal, conclusion);
    expect(result).toBeTruthy();
});

test('P ∨ True should have conclusion P', () => {
    const literal = new AtomicStatement(new Formula("H"));
    const conclusion = new Tautology;
    const result = orStatementReducer2.validateReduction(literal, conclusion);
    expect(result).toBeTruthy();
});

test('P ∨ False should have conclusion P', () => {
    const literal = new NotStatement(new AtomicStatement(new Formula("H")));
    const conclusion = new AtomicStatement(new Formula("B"));
    const result = orStatementReducer2.validateReduction(literal, conclusion);
    expect(result).toBeTruthy();
});

// Conditional reduction rules

test('True → P should have conclusion P', () => {
    const literal = new AtomicStatement(new Formula("H"));
    const conclusion = new AtomicStatement(new Formula("B"));
    const result = conditionalStatementReducer1.validateReduction(literal, conclusion);
    expect(result).toBeTruthy();
});

test('False → P should have conclusion P', () => {
    const literal = new NotStatement(new AtomicStatement(new Formula("H")));
    const conclusion = new Tautology;
    const result = conditionalStatementReducer1.validateReduction(literal, conclusion);
    expect(result).toBeTruthy();
});

test('P → True should have conclusion P', () => {
    const literal = new AtomicStatement(new Formula("H"));
    const conclusion = new Tautology;
    const result = conditionalStatementReducer2.validateReduction(literal, conclusion);
    expect(result).toBeTruthy();
});

test('P → False should have conclusion ¬P', () => {
    const literal = new NotStatement(new AtomicStatement(new Formula("H")));
    const conclusion = new NotStatement(new AtomicStatement(new Formula("B")));
    const result = conditionalStatementReducer2.validateReduction(literal, conclusion);
    expect(result).toBeTruthy();
});

// Biconditional reduction rules

test('True ↔ P should have conclusion P', () => {
    const literal = new AtomicStatement(new Formula("H"));
    const conclusion = new AtomicStatement(new Formula("B"));
    const result = biconditionalStatementReducer1.validateReduction(literal, conclusion);
    expect(result).toBeTruthy();
});

test('False ↔ P should have conclusion P', () => {
    const literal = new NotStatement(new AtomicStatement(new Formula("H")));
    const conclusion = new NotStatement(new AtomicStatement(new Formula("B")));;
    const result = biconditionalStatementReducer1.validateReduction(literal, conclusion);
    expect(result).toBeTruthy();
});

test('P ↔ True should have conclusion P', () => {
    const literal = new AtomicStatement(new Formula("H"));
    const conclusion = new AtomicStatement(new Formula("B"));
    const result = biconditionalStatementReducer2.validateReduction(literal, conclusion);
    expect(result).toBeTruthy();
});

test('P ↔ False should have conclusion ¬P', () => {
    const literal = new NotStatement(new AtomicStatement(new Formula("H")));
    const conclusion = new NotStatement(new AtomicStatement(new Formula("B")));
    const result = biconditionalStatementReducer2.validateReduction(literal, conclusion);
    expect(result).toBeTruthy();
});
