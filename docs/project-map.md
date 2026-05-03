# Project Map

## app/

Contains the Next.js app routes. The home page loads the main SolveOS experience, and API routes handle solving, memory, outcomes, benchmarks, and reviews.

## components/

Contains the visible interface. This includes the decision console, result panels, action banner, journal, settings modal, and dashboards.

## lib/

Contains the main logic. This includes the decision engine, prompts, memory storage, action reminders, identity labels, profile scoring, language helpers, and shared types.

## scripts/

Contains local test scripts. These check behavior such as intent routing, review routing, profile updates, learning loops, and response variety.

## data/

Stores local project data. `decisions.json` holds saved decision history, and `simulations.json` holds simulation-related data.

## docs/specs/

Contains the clean SolveOS specs. These files explain the project in simple language for review, grading, and future development.
