# Feature Spec: Memory Graph

## Product goal

The Memory Graph helps SolveOS remember past decisions, connect related lessons, and make future recommendations more useful.

## Core features

- Decision Vault for saved decision threads and blueprints.
- Outcome notes for success, failure, or partial success.
- Metadata tags such as industry, urgency, stakeholders, and confidence.
- Similar-decision retrieval for future analysis.
- Bias and pattern detection over time.

## User flow

1. User completes a decision blueprint.
2. SolveOS saves the decision as a memory.
3. User later records what happened in real life.
4. The memory becomes part of the user's decision history.
5. Future decisions can reference similar past situations.

## Technical overview

The first version can store simple decision records with IDs, timestamps, tags, blueprint text, and outcome notes. A later version can add embeddings and vector search to find related decisions by meaning instead of exact keywords.

## Roadmap / order of work

1. Define the memory record format.
2. Save completed decisions.
3. Add outcome fields.
4. Add search and filtering.
5. Add similarity retrieval and bias warnings.
