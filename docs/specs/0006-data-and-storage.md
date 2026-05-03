# 0006 Data And Storage

## 1. Purpose

- Define what SolveOS saves.
- Support Decision history, Action reminders, outcomes, and UserState.

## 2. Where it is used

- Memory API.
- Outcome API.
- Decision Journal.
- Action banner.
- Browser settings and profile state.

## 3. Main objects

- Decision: saved user situation and Verdict.
- Action: saved next step.
- ActionReminder: saved Action state.
- UserState: saved behavior state.
- Decision Journal: saved list of past Decisions.
- Outcome: recorded result of a past Decision.

## 4. Logic (step-by-step)

1. Decision is created.
2. System saves Decision.
3. System saves ActionReminder.
4. Decision Journal reads Decision history.
5. User records outcome.
6. System updates UserState.
7. Future Decisions can use history.

## 5. Stored data

- id: unique record id.
- problem: user Decision.
- verdict: Decision result.
- confidence: Decision score.
- keyRisks: saved risks.
- actionText: next Action.
- outcomeStatus: result state.
- reviewCheckpoints: 30, 60, and 90 day checks.
- userDecisionScore: behavior score.

## 6. Edge cases

- File storage unavailable: use remote storage if configured.
- Remote storage missing: use local file in development.
- Browser storage missing: return empty state.
- Invalid JSON: ignore bad data and continue.
- Decision not found: return safe API error.

## 7. Files involved

- `data/decisions.json`
- `data/simulations.json`
- `lib/memory.ts`
- `lib/savedDecisions.ts`
- `lib/actionReminders.ts`
- `lib/userProfile.ts`
- `app/api/memory/route.ts`
- `app/api/outcomes/route.ts`
