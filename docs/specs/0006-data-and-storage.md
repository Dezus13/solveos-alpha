# 0006 Data And Storage

## 1. Purpose

- Define what SolveOS saves.
- Support decision history, reminders, outcomes, and profile state.

## 2. Where it is used

- Memory API.
- Outcome API.
- Decision journal.
- Action banner.
- Browser settings and profile state.

## 3. Main objects

- DecisionMemoryEntry: saved server-side decision.
- SavedDecision: browser-side saved decision.
- ActionReminderStore: browser-side action reminder map.
- UserDecisionProfile: browser-side behavior profile.
- Outcome: recorded result of a past decision.

## 4. Logic (step-by-step)

1. Decision is created.
2. System saves decision snapshot.
3. Action reminder is saved in browser storage.
4. Journal reads decision history.
5. User records outcome.
6. System updates memory.
7. Future decisions can use history.

## 5. Stored data

- id: unique record id.
- problem: user situation.
- verdict: decision result.
- confidence: decision score.
- keyRisks: saved risks.
- nextMove: next action.
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
