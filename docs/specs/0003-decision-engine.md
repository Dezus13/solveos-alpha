# 0003 Decision Engine

## 1. Purpose

- Turn user input into a structured Decision result.
- Return data the UI can display consistently.

## 2. Where it is used

- Solve API route.
- Home experience submit flow.
- Result panels.
- Decision Journal.

## 3. Main objects

- Decision: situation entered by the user.
- Verdict: final answer.
- Action: required next step.
- Risk: reason the decision could fail.
- UserState: behavior record used as context.
- Decision Journal: saved list of past Decisions.

## 4. Logic (step-by-step)

1. User submits a Decision.
2. System reads UserState and Decision Journal.
3. System detects request intent.
4. System creates a Verdict.
5. System creates an Action.
6. System checks result quality.
7. System returns result to the UI.

## 5. Stored data

- problem: user Decision.
- recommendation: final Verdict.
- confidenceScore: Decision confidence.
- keyRisks: main risks.
- actionPlan: next Action.
- milestoneTable: review points when present.
- language: response language.
- decisionScore: user follow-through score (0–100) attached to each result.
- decisionScoreTrend: direction of score ('up' | 'down').
- scoreMessage: identity label derived from decisionScore.
- decisionText: the original question stored with the ActionReminder to power the history display.
- actionHistoryContext: previous ActionReminder results can pressure future decisions by showing whether the user usually finishes, delays, skips, or goes overdue.

## 6. Edge cases

- No problem: return validation error.
- Wrong intent: route to review or plan behavior.
- Missing model key: use fallback or error path.
- Invalid blueprint: normalize fields.
- Repeated Verdict loop: force a different answer.

## 7. Files involved

- `app/api/solve/route.ts`
- `lib/engine.ts`
- `lib/prompts.ts`
- `lib/semantic-guards.ts`
- `lib/profileEngine.ts`
- `lib/types.ts`
- `lib/mocks.ts`
