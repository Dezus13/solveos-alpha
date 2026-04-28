# Feature Spec: Outcome Flywheel

## Product goal

The Outcome Flywheel makes SolveOS improve over time. Instead of giving one-time advice, it learns from the difference between predicted outcomes and real outcomes.

## Core features

- Outcome logging after a decision is made.
- Post-mortem notes for what worked and what failed.
- Prediction comparison between expected and actual results.
- Lessons learned that can be reused in future decisions.
- Confidence calibration based on past accuracy.

## User flow

1. SolveOS creates a Decision Blueprint.
2. User makes the decision in real life.
3. After time passes, user logs the result.
4. SolveOS compares the result with the original prediction.
5. The lesson is stored and used to improve future recommendations.

## Technical overview

The flywheel depends on memory records that include predicted outcomes and later actual outcomes. At first this can be manual user input. Later, reminders and analytics can make the loop more automatic.

## Roadmap / order of work

1. Add outcome status to saved decisions.
2. Add a short post-mortem form.
3. Show predicted vs. actual result.
4. Store lessons learned.
5. Use lessons in future Decision Engine prompts.
