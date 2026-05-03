# SolveOS

SolveOS helps users make decisions and take action.

It is not a normal chatbot. A normal chatbot mostly answers a question. SolveOS turns a decision into a short verdict, a required next action, and a follow-up loop.

## What SolveOS Does

- Gives the user a short verdict on a decision.
- Shows why the verdict makes sense.
- Creates a clear action the user should do next.
- Tracks pending actions.
- Asks if the user completed the action.
- Builds identity, pressure, and follow-through over time.
- Saves decision history so past decisions can inform future ones.

## Main User Flow

1. The user enters a decision or situation.
2. SolveOS analyzes the problem.
3. SolveOS returns a verdict and next action.
4. The action becomes pending.
5. The user marks the action as done or not done.
6. SolveOS updates the user's follow-through score and identity.
7. The decision is saved for later review.

## Technical Parts

- `app/` contains the Next.js pages and API routes.
- `components/` contains the user interface.
- `lib/` contains the decision engine, memory, action reminders, identity logic, and helpers.
- `data/` stores decision history for local/server memory.
- `scripts/` contains test scripts for routing and behavior checks.
- `docs/specs/` contains the clean SolveOS documentation.

## Documentation

- [Project Map](docs/project-map.md)
- [Teacher Summary](docs/teacher-summary.md)
- [Specs](docs/specs/)

## Status

SolveOS is an alpha project. The core idea is working: decision in, verdict out, action tracked, history saved, and follow-through measured.
