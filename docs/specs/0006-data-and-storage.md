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
- ActionReminder: saved Action state including pressure fields.
- UserState: saved behavior state.
- Decision Journal: saved list of past Decisions.
- Outcome: recorded result of a past Decision.

## 4. Logic (step-by-step)

1. Decision is created.
2. System saves Decision.
3. System saves ActionReminder with `createdAt`, `dueAt`, and `status: not yet`.
4. Decision Journal reads Decision history.
5. User records outcome.
6. System updates UserState.
7. Future Decisions can use history.

## 5. Stored data

### ActionReminder (`solveos_action_pressure_v1`)

- id: unique record id (key in the store object).
- action: text of the current Action (may be replaced by smaller action).
- decisionText: original Decision text that produced the Action.
- status: `not yet`, `done`, `skipped`, or `overdue`. Legacy `pending` and `blocked` values are read as not-yet actions until the deadline passes.
- createdAt: time reminder was created. Reset when smaller action is accepted.
- dueAt: 24-hour deadline. Reset when smaller action is accepted.
- completedAt: time Action was completed.
- skippedAt: time Action was skipped.
- updatedAt: time of last write.
- blockerCategory: selected blocker category (`fear`, `unclear`, `lazy`, `external`).
- smallerAction: reduced action text stored after blockerCategory is picked.
- overdueScorePenaltyApplied: boolean flag set to true after the −10 overdue penalty is applied. Prevents double-deduction.

### ActionHistory (derived, not a separate store)

History is computed from `solveos_action_pressure_v1` at read time:
- Every ActionReminder is a history record, including active `not yet` actions.
- Each row shows Decision text, Action/result text, normalized status (`done`, `not yet`, `skipped`, `overdue`), and time passed from the relevant timestamp.
- `getHistoryRecords()` returns records sorted by result timestamp descending.
- `getActionMetrics()` returns `successRate` (% done in last 7 action records) and `streak` (consecutive done from newest).

### Decision (`solveos_saved_decisions`)

- id: unique record id.
- problem: user Decision.
- verdict: Decision result.
- confidence: Decision score.
- keyRisks: saved risks.
- actionText: next Action.
- outcomeStatus: result state.
- reviewCheckpoints: 30, 60, and 90 day checks.
- userDecisionScore: behavior score.

### Pressure State (derived, not stored)

- pressure_state: computed at read time from `createdAt` elapsed hours (0–2h = normal, 2–12h = pressure_2h, 12–24h = pressure_12h, 24h+ = overdue).
- last_action_time: `createdAt` of the active ActionReminder.
- reset_time: `createdAt` after `restartWithSmallerAction` is called.

### User Profile (`solveos_user_profile`)

- userDecisionScore: internal behavior score (0–100).
- decisionScoreTrend: internal direction of last score change.
- The score remains stored and used by Decision context, but the large sidebar Decision Score card is hidden from the UI for now.

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
