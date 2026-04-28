# SolveOS Plan

## Product goal

Build a beginner-friendly MVP of SolveOS: an AI decision operating system that helps users make better high-stakes decisions by producing clear recommendations, risks, and next steps.

## Core features

- Decision Engine: analyzes the user's decision and creates a structured blueprint.
- Memory Graph: stores decisions and connects related lessons over time.
- Outcome Flywheel: records real outcomes so future advice becomes smarter.
- User Stories: define practical founder and team decision scenarios.
- Technical Foundation: keep the app organized with Next.js, TypeScript, and clean data flow.

## User flow

1. User opens the decision workspace.
2. User describes a decision, goal, constraints, and context.
3. SolveOS asks clarifying questions if details are missing.
4. AI advisors debate risks, upside, and execution reality.
5. SolveOS returns a Decision Blueprint.
6. User logs the outcome later, which updates memory for future decisions.

## Technical overview

The current product is planned around a Next.js app with TypeScript and Tailwind CSS. AI work is expected to use OpenAI for analysis and LangGraph-style orchestration for multiple advisor roles. Memory can begin with simple stored records and later move to vector search.

## Roadmap / order of work

1. Define the product goal and user stories.
2. Build the basic decision input and blueprint output.
3. Add the Decision Engine logic.
4. Add memory storage for past decisions.
5. Add outcome tracking and lessons learned.
6. Improve sharing, exports, and team workflows.
