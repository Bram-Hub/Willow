# Davis-Putnam User's Guide

Refer to [userguide](userguide.md) for instructions on the Willow interface.  
Refer to [DP_developer_guide](DP_developer_guide.md) if you are interested in extending existing functionality. 

This guide will walk through how to verify whether a set of statements is satisfiable using Davis-Putnam.

## What is Davis-Putnam?

[Davis Putnam](https://en.wikipedia.org/wiki/Davis%E2%80%93Putnam_algorithm), similar to truth trees, is another procedue used to determine if a set of statements is satisfiable. This is achieved by recursively selecting a literal, and creating a branch for each of the possible states. A literal can be either `True` or `False`, resulting in the creation of at most 2 states per literal. Statements are reduce with regard to some literal. This procedure halts once all states have either reached a contradiction or is deemed satisfiable. 

The following **Reduction Rules** can be used to reduce statements with respect to the truthy value of some literal.

- `⊤` means a literal is True  
- `⊥` means a literal is False.

 
| Not       | And         | Or          | Conditional | Biconditional |
| --------- | ----------- |------------ | ----------- | ------------- |
| ¬⊤ => ⊥   | ⊤ ∧ P => P | ⊤ ∨ P => ⊤  | ⊤ → P => P  | ⊤ ↔ P => P   |
| ¬⊥ => ⊤   | ⊥ ∧ P => ⊥ | ⊥ ∨ P => P  | ⊥ → P => ⊤  | ⊥ ↔ P => ¬P  |
|           | P ∧ ⊤ => P  | P ∨ ⊤ => ⊤  | P → ⊤ => ⊤  | P ↔ ⊤ => P   |
|           | P ∧ ⊥ => ⊥  | P ∨ ⊥ => P  | P → ⊥ => ¬P | P ↔ ⊥ => ¬P  |


## Willow for Davis-Putnam

We will walk through a simple example. Is the following clause satisfiable?

![Clause](https://user-images.githubusercontent.com/29582421/234971620-2e1994ff-81e8-40b4-a66b-5a8e7acfef1a.jpg)

1. **Select Mode**   
Ensure your are in Davis-Putnam Mode. The two different modes have different rules that can be used to satify a set of statements.
![DP Mode](https://user-images.githubusercontent.com/29582421/234759174-d7114e69-6d88-44e7-959f-6708ab26e293.jpg)


2. **Adding tautologies**  
Every variable can be set to the true or false. We create this tautology.  
![Creating tautology](https://user-images.githubusercontent.com/29582421/234971872-905d907c-7d87-421b-a020-6c87c25b2f23.jpg)  
<!-- 
Tautologies are formed by disjuncting any statement $\psi$ with $\neg \psi$

Intention is for tautologies to be literal 
(not tested with general statements) -->

3. **Branching off tautologies**    
Decompose the tautology to create the two possible states. For each of the two values, select where the statement came from. 
![Decompositions](https://user-images.githubusercontent.com/29582421/234972437-47d21adc-1bd0-465e-a5da-5f13291bc17c.jpg)
![Premise](https://user-images.githubusercontent.com/29582421/234972594-4a0f52e7-dd9f-4058-86d7-090ebf0d8e0c.jpg)

4. **Reduce Statements**  
For each statement in parent branch, reduce them with respect to the literal branch. Notice that statement gets checked off when they a
![R1](https://user-images.githubusercontent.com/29582421/234977549-90c491d7-94a7-463d-ba9c-7f6fc9e18e51.jpg)
![R2](https://user-images.githubusercontent.com/29582421/234977681-ac6f0160-fe36-48ff-af3c-5cbf904dd51f.jpg)


5. **Validating Tree**  
![Check](https://user-images.githubusercontent.com/29582421/234977819-ba52f194-1b9c-46fc-bbe3-044cf30ef490.jpg)

