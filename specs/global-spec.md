# Global Spec

## Product goal

SolveOS is an AI decision operating system for people making high-stakes choices. It helps users move from uncertainty to a clear recommendation, risk view, and action plan.

## Core features

- Decision Blueprint with verdict, risk assessment, outcomes, and action items.
- AI advisor roles such as Strategist, Skeptic, and Operator.
- Decision memory so past choices can inform future ones.
- Multilingual support so users can work in their preferred language.
- Outcome tracking so the system learns from what actually happened.

## User flow

1. User enters a decision question and background context.
2. SolveOS detects the language and asks for missing details.
3. AI advisors analyze the decision from different angles.
4. The system creates a clear blueprint.
5. The user reviews, follows up, and later records the outcome.

## Technical overview

The product is planned as a Next.js and TypeScript web app. AI analysis can be powered by OpenAI, with multi-agent workflows organized through LangGraph-style orchestration. Memory starts simple and can later grow into vector search.

## Roadmap / order of work

1. Complete the core decision workspace.
2. Improve the decision blueprint structure.
3. Add multilingual response handling.
4. Add memory and outcome tracking.
5. Expand to sharing, exports, and team workflows.
