# SolveOS Specifications

This directory contains the SolveOS homework specifications. The simple teacher-facing files are at the top level of this folder, while the older detailed source specs remain in subfolders for reference.

## Teacher review files

- `global-spec.md`
- `functional-map.md`
- `feature-spec-decision-engine.md`
- `feature-spec-memory-graph.md`
- `feature-spec-outcome-flywheel.md`
- `technical-spec.md`
- `user-stories.md`

## Product goal

SolveOS helps users make better high-stakes decisions by turning context, risks, and outcomes into clear decision blueprints.

## Core features

- Decision Engine for recommendations and risk analysis.
- Memory Graph for saved decisions and connected lessons.
- Outcome Flywheel for learning from real results.
- User stories for practical founder and team scenarios.
- Technical plan for the app architecture.

## User flow

1. User describes a decision.
2. SolveOS asks for missing context.
3. AI advisors analyze options and risks.
4. User receives a clear Decision Blueprint.
5. User logs the outcome later so future decisions improve.

## Technical overview

The current app is planned with Next.js, TypeScript, Tailwind CSS, and AI analysis through OpenAI plus future multi-agent orchestration. Memory can start with simple stored records and later move to vector search.

## Roadmap / order of work

1. Define the specs and user stories.
2. Build the basic decision input and blueprint output.
3. Add advisor logic and confidence scoring.
4. Add memory and outcome tracking.
5. Add sharing, exports, and team features.

## Reference folders

- `global/`: original vision notes.
- `product/`: detailed feature ideas and product specs.
- `technical/`: architecture notes.
- `user-stories/`: original story examples.
- `roadmap/`: original 90-day roadmap.
