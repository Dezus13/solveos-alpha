# SPEC-0008: Decision Memory

## Overview
Decision Memory allows SolveOS to learn from a user's (or organization's) past choices, outcomes, and reasoning. It turns individual simulations into a cumulative knowledge base.

## Objectives
- **Contextual Awareness**: Use past decisions to inform current simulations.
- **Pattern Recognition**: Identify recurring risks or successful strategies over time.
- **Institutional Knowledge**: Prevent "reinventing the wheel" for similar strategic dilemmas.

## Core Modules

### 1. The Decision Vault (Storage)
- **Vector Embeddings**: Store decision blueprints and context as vector embeddings for semantic search.
- **Outcome Tracking**: Allow users to mark past decisions as "Success" or "Failure" and provide "Post-mortem" notes.
- **Metadata Tagging**: Categorize decisions by industry, department, scale, and time-frame.

### 2. Retrieval Augmented Decisions (RAD)
- **Reference Injection**: When a new decision is initiated, the system automatically retrieves similar past decisions.
- **"The Memory Agent"**: A background agent that surfaces relevant past lessons during the War Room debate (e.g., "In a similar decision 6 months ago, the Skeptic was right about the marketing budget").

### 3. Analytics & Insights
- **Decision DNA**: Visual map of the user's decision-making style (e.g., Risk-taker vs. Conservative).
- **Learning Loop**: The system suggests adjustments to current decision models based on historical outcome data.

## Privacy & Security
- **Strict Isolation**: User memory must be siloed and never leak between different users/organizations.
- **Anonymization**: Option to store "Abstracted Lessons" while deleting specific PII or financial data.
- **User Control**: Users can delete specific memories or disable the memory system entirely.

## Success Metrics
- Users report that the system "knows them" or "remembers the company context."
- 20% of new simulations incorporate at least one reference to a past decision.
