import { Formula } from '../src/common/formula';
import {AndStatement, AtomicStatement, NotStatement, Contradiction, OrStatement, ConditionalStatement, BiconditionalStatement, Tautology} from '../src/common/statement';

const notStatementToReduce = new NotStatement(new AtomicStatement(new Formula("H")));
const andStatementToReduce1 = new AndStatement(new AtomicStatement(new Formula("H")), new AtomicStatement(new Formula("B")));
const andStatementToReduce2 = new AndStatement(new AtomicStatement(new Formula("B")), new AtomicStatement(new Formula("H")));
const orStatementToReduce1 = new OrStatement(new AtomicStatement(new Formula("H")), new AtomicStatement(new Formula("B")));
const orStatementToReduce2 = new OrStatement(new AtomicStatement(new Formula("B")), new AtomicStatement(new Formula("H")));
const conditionalStatementToReduce1 = new ConditionalStatement(new AtomicStatement(new Formula("H")), new AtomicStatement(new Formula("B")));
const conditionalStatementToReduce2 = new ConditionalStatement(new AtomicStatement(new Formula("B")), new AtomicStatement(new Formula("H")));
const biconditionalStatementToReduce1 = new BiconditionalStatement(new AtomicStatement(new Formula("H")), new AtomicStatement(new Formula("B")));
const biconditionalStatementToReduce2 = new BiconditionalStatement(new AtomicStatement(new Formula("B")), new AtomicStatement(new Formula("H")));

// NOT reduction rules

test('¬True should have conclusion False', () => {
    const literal = new AtomicStatement(new Formula("H"));
    const conclusion = new Contradiction;
    const result = notStatementToReduce.validateReduction(literal, conclusion);
    expect(result).toBeTruthy();
});

test('¬False should have conclusion True', () => {
    const literal = new NotStatement(new AtomicStatement(new Formula("H")));
    const conclusion = new Tautology;
    const result = notStatementToReduce.validateReduction(literal, conclusion);
    expect(result).toBeTruthy();
});

// AND reduction rules

test('True ∧ P should have conclusion P', () => {
    const literal = new AtomicStatement(new Formula("H"));
    const conclusion = new AtomicStatement(new Formula("B"));
    const result = andStatementToReduce1.validateReduction(literal, conclusion);
    expect(result).toBeTruthy();
});

test('False ∧ P should have conclusion False', () => {
    const literal = new NotStatement(new AtomicStatement(new Formula("H")));
    const conclusion = new Contradiction;
    const result = andStatementToReduce1.validateReduction(literal, conclusion);
    expect(result).toBeTruthy();
});

test('P ∧ True should have conclusion P', () => {
    const literal = new AtomicStatement(new Formula("H"));
    const conclusion = new AtomicStatement(new Formula("B"));
    const result = andStatementToReduce2.validateReduction(literal, conclusion);
    expect(result).toBeTruthy();
});

test('P ∧ False should have conclusion False', () => {
    const literal = new NotStatement(new AtomicStatement(new Formula("H")));
    const conclusion = new Contradiction;
    const result = andStatementToReduce1.validateReduction(literal, conclusion);
    expect(result).toBeTruthy();
});

// OR reduction rules

test('True ∨ P should have conclusion True', () => {
    const literal = new AtomicStatement(new Formula("H"));
    const conclusion = new Tautology;
    const result = orStatementToReduce1.validateReduction(literal, conclusion);
    expect(result).toBeTruthy();
});

test('False ∨ P should have conclusion P', () => {
    const literal = new NotStatement(new AtomicStatement(new Formula("H")));
    const conclusion = new AtomicStatement(new Formula("B"));
    const result = orStatementToReduce1.validateReduction(literal, conclusion);
    expect(result).toBeTruthy();
});

test('P ∨ True should have conclusion P', () => {
    const literal = new AtomicStatement(new Formula("H"));
    const conclusion = new Tautology;
    const result = orStatementToReduce2.validateReduction(literal, conclusion);
    expect(result).toBeTruthy();
});

test('P ∨ False should have conclusion P', () => {
    const literal = new NotStatement(new AtomicStatement(new Formula("H")));
    const conclusion = new AtomicStatement(new Formula("B"));
    const result = orStatementToReduce2.validateReduction(literal, conclusion);
    expect(result).toBeTruthy();
});

// Conditional reduction rules

test('True → P should have conclusion P', () => {
    const literal = new AtomicStatement(new Formula("H"));
    const conclusion = new AtomicStatement(new Formula("B"));
    const result = conditionalStatementToReduce1.validateReduction(literal, conclusion);
    expect(result).toBeTruthy();
});

test('False → P should have conclusion P', () => {
    const literal = new NotStatement(new AtomicStatement(new Formula("H")));
    const conclusion = new Tautology;
    const result = conditionalStatementToReduce1.validateReduction(literal, conclusion);
    expect(result).toBeTruthy();
});

test('P → True should have conclusion P', () => {
    const literal = new AtomicStatement(new Formula("H"));
    const conclusion = new Tautology;
    const result = conditionalStatementToReduce2.validateReduction(literal, conclusion);
    expect(result).toBeTruthy();
});

test('P → False should have conclusion ¬P', () => {
    const literal = new NotStatement(new AtomicStatement(new Formula("H")));
    const conclusion = new NotStatement(new AtomicStatement(new Formula("B")));
    const result = conditionalStatementToReduce2.validateReduction(literal, conclusion);
    expect(result).toBeTruthy();
});

// Biconditional reduction rules

test('True ↔ P should have conclusion P', () => {
    const literal = new AtomicStatement(new Formula("H"));
    const conclusion = new AtomicStatement(new Formula("B"));
    const result = biconditionalStatementToReduce1.validateReduction(literal, conclusion);
    expect(result).toBeTruthy();
});

test('False ↔ P should have conclusion P', () => {
    const literal = new NotStatement(new AtomicStatement(new Formula("H")));
    const conclusion = new NotStatement(new AtomicStatement(new Formula("B")));;
    const result = biconditionalStatementToReduce1.validateReduction(literal, conclusion);
    expect(result).toBeTruthy();
});

test('P ↔ True should have conclusion P', () => {
    const literal = new AtomicStatement(new Formula("H"));
    const conclusion = new AtomicStatement(new Formula("B"));
    const result = biconditionalStatementToReduce2.validateReduction(literal, conclusion);
    expect(result).toBeTruthy();
});

test('P ↔ False should have conclusion ¬P', () => {
    const literal = new NotStatement(new AtomicStatement(new Formula("H")));
    const conclusion = new NotStatement(new AtomicStatement(new Formula("B")));
    const result = biconditionalStatementToReduce2.validateReduction(literal, conclusion);
    expect(result).toBeTruthy();
});
