import {Formula} from '../src/common/formula';
import {
    DPStatementValidator,
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

// NOT reduction rules

test('¬True should have conclusion False', () => {
    const literal = new AtomicStatement(new Formula("H"));
    const notStatementReducer = new DPStatementValidator(notStatementToReduce, literal);
    const conclusion = new Contradiction;
    const result = notStatementReducer.validateReduction(conclusion);
    expect(result).toBeTruthy();
});

test('¬False should have conclusion True', () => {
    const literal = new NotStatement(new AtomicStatement(new Formula("H")));
    const notStatementReducer = new DPStatementValidator(notStatementToReduce, literal);
    const conclusion = new Tautology;
    const result = notStatementReducer.validateReduction(conclusion);
    expect(result).toBeTruthy();
});

// AND reduction rules

test('True ∧ P should have conclusion P', () => {
    const literal = new AtomicStatement(new Formula("H"));
    const andStatementReducer1 = new DPStatementValidator(andStatementToReduce1, literal);
    const conclusion = new AtomicStatement(new Formula("B"));
    const result = andStatementReducer1.validateReduction(conclusion);
    expect(result).toBeTruthy();
});

test('False ∧ P should have conclusion False', () => {
    const literal = new NotStatement(new AtomicStatement(new Formula("H")));
    const andStatementReducer1 = new DPStatementValidator(andStatementToReduce1, literal);
    const conclusion = new Contradiction;
    const result = andStatementReducer1.validateReduction(conclusion);
    expect(result).toBeTruthy();
});

test('P ∧ True should have conclusion P', () => {
    const literal = new AtomicStatement(new Formula("H"));
    const andStatementReducer2 = new DPStatementValidator(andStatementToReduce2, literal);
    const conclusion = new AtomicStatement(new Formula("B"));
    const result = andStatementReducer2.validateReduction(conclusion);
    expect(result).toBeTruthy();
});

test('P ∧ False should have conclusion False', () => {
    const literal = new NotStatement(new AtomicStatement(new Formula("H")));
    const andStatementReducer2 = new DPStatementValidator(andStatementToReduce2, literal);
    const conclusion = new Contradiction;
    const result = andStatementReducer2.validateReduction(conclusion);
    expect(result).toBeTruthy();
});

// OR reduction rules

test('True ∨ P should have conclusion True', () => {
    const literal = new AtomicStatement(new Formula("H"));
    const orStatementReducer1 = new DPStatementValidator(orStatementToReduce1, literal);
    const conclusion = new Tautology;
    const result = orStatementReducer1.validateReduction(conclusion);
    expect(result).toBeTruthy();
});

test('False ∨ P should have conclusion P', () => {
    const literal = new NotStatement(new AtomicStatement(new Formula("H")));
    const orStatementReducer1 = new DPStatementValidator(orStatementToReduce1, literal);
    const conclusion = new AtomicStatement(new Formula("B"));
    const result = orStatementReducer1.validateReduction(conclusion);
    expect(result).toBeTruthy();
});

test('P ∨ True should have conclusion P', () => {
    const literal = new AtomicStatement(new Formula("H"));
    const orStatementReducer2 = new DPStatementValidator(orStatementToReduce2, literal);
    const conclusion = new Tautology;
    const result = orStatementReducer2.validateReduction(conclusion);
    expect(result).toBeTruthy();
});

test('P ∨ False should have conclusion P', () => {
    const literal = new NotStatement(new AtomicStatement(new Formula("H")));
    const orStatementReducer2 = new DPStatementValidator(orStatementToReduce2, literal);
    const conclusion = new AtomicStatement(new Formula("B"));
    const result = orStatementReducer2.validateReduction(conclusion);
    expect(result).toBeTruthy();
});

// Conditional reduction rules

test('True → P should have conclusion P', () => {
    const literal = new AtomicStatement(new Formula("H"));
    const conditionalStatementReducer1 = new DPStatementValidator(conditionalStatementToReduce1, literal);
    const conclusion = new AtomicStatement(new Formula("B"));
    const result = conditionalStatementReducer1.validateReduction(conclusion);
    expect(result).toBeTruthy();
});

test('False → P should have conclusion P', () => {
    const literal = new NotStatement(new AtomicStatement(new Formula("H")));
    const conditionalStatementReducer1 = new DPStatementValidator(conditionalStatementToReduce1, literal);
    const conclusion = new Tautology;
    const result = conditionalStatementReducer1.validateReduction(conclusion);
    expect(result).toBeTruthy();
});

test('P → True should have conclusion P', () => {
    const literal = new AtomicStatement(new Formula("H"));
    const conditionalStatementReducer2 = new DPStatementValidator(conditionalStatementToReduce2, literal);
    const conclusion = new Tautology;
    const result = conditionalStatementReducer2.validateReduction(conclusion);
    expect(result).toBeTruthy();
});

test('P → False should have conclusion ¬P', () => {
    const literal = new NotStatement(new AtomicStatement(new Formula("H")));
    const conditionalStatementReducer2 = new DPStatementValidator(conditionalStatementToReduce2, literal);
    const conclusion = new NotStatement(new AtomicStatement(new Formula("B")));
    const result = conditionalStatementReducer2.validateReduction(conclusion);
    expect(result).toBeTruthy();
});

// Biconditional reduction rules

test('True ↔ P should have conclusion P', () => {
    const literal = new AtomicStatement(new Formula("H"));
    const biconditionalStatementReducer1 = new DPStatementValidator(biconditionalStatementToReduce1, literal);
    const conclusion = new AtomicStatement(new Formula("B"));
    const result = biconditionalStatementReducer1.validateReduction(conclusion);
    expect(result).toBeTruthy();
});

test('False ↔ P should have conclusion P', () => {
    const literal = new NotStatement(new AtomicStatement(new Formula("H")));
    const biconditionalStatementReducer1 = new DPStatementValidator(biconditionalStatementToReduce1, literal);
    const conclusion = new NotStatement(new AtomicStatement(new Formula("B")));;
    const result = biconditionalStatementReducer1.validateReduction(conclusion);
    expect(result).toBeTruthy();
});

test('P ↔ True should have conclusion P', () => {
    const literal = new AtomicStatement(new Formula("H"));
    const biconditionalStatementReducer2 = new DPStatementValidator(biconditionalStatementToReduce2, literal);
    const conclusion = new AtomicStatement(new Formula("B"));
    const result = biconditionalStatementReducer2.validateReduction(conclusion);
    expect(result).toBeTruthy();
});

test('P ↔ False should have conclusion ¬P', () => {
    const literal = new NotStatement(new AtomicStatement(new Formula("H")));
    const biconditionalStatementReducer2 = new DPStatementValidator(biconditionalStatementToReduce2, literal);
    const conclusion = new NotStatement(new AtomicStatement(new Formula("B")));
    const result = biconditionalStatementReducer2.validateReduction(conclusion);
    expect(result).toBeTruthy();
});
