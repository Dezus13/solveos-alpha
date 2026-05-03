# Technical Spec

## Product goal

This technical spec explains how SolveOS can be built in a simple, maintainable way while supporting AI decision analysis, memory, and future growth.

## Core features

- Next.js app for the user interface.
- TypeScript for safer data structures.
- Tailwind CSS for styling.
- API routes for AI processing.
- Planned OpenAI and LangGraph-style orchestration for advisor workflows.
- Future memory storage for decisions and outcomes.

## User flow

1. User submits decision context from the UI.
2. Front end sends the request to an API route.
3. Server prepares prompts and calls the AI provider.
4. AI returns structured decision sections.
5. UI renders the Decision Blueprint.
6. Saved decisions and outcomes can be used later by memory features.

## Technical overview

The current architecture can stay simple: UI components collect input and display results, while server routes handle AI calls and response formatting. Shared TypeScript types should define the shape of a decision request, blueprint response, and memory record.

## Roadmap / order of work

1. Keep the UI and API data shapes consistent.
2. Add a typed Decision Blueprint model.
3. Improve server error handling for AI calls.
4. Add simple persistence for saved decisions.
5. Add retrieval and outcome analytics after the MVP works.
