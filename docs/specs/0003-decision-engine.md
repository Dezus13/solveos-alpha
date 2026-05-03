# 0003 Decision Engine

## 1. Purpose

- Turn user input into a structured decision result.
- Return data the UI can display consistently.

## 2. Where it is used

- Solve API route.
- Home experience submit flow.
- Result panels.
- Decision memory.

## 3. Main objects

- SolveRequest: input sent to the solve API.
- DecisionBlueprint: structured result from the engine.
- Verdict: final recommendation.
- ConfidenceScore: numeric strength of the decision.
- Risk: reason the decision could fail.
- ActionPlan: next steps for execution.

## 4. Logic (step-by-step)

1. User submits a situation.
2. API reads mode, language, profile, and history.
3. System detects request intent.
4. System builds or requests a decision blueprint.
5. System normalizes missing fields.
6. System checks verdict quality.
7. API returns result to the UI.

## 5. Stored data

- problem: user input.
- recommendation: final verdict.
- confidenceScore: decision confidence.
- keyRisks: main risks.
- actionPlan: next actions.
- milestoneTable: review points when present.
- language: response language.

## 6. Edge cases

- No problem: return validation error.
- Wrong intent: route to review or plan behavior.
- Missing model key: use fallback or error path.
- Invalid blueprint: normalize fields.
- Repeated verdict loop: force a different answer.

## 7. Files involved

- `app/api/solve/route.ts`
- `lib/engine.ts`
- `lib/prompts.ts`
- `lib/semantic-guards.ts`
- `lib/profileEngine.ts`
- `lib/types.ts`
- `lib/mocks.ts`
