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
- ConversationHistory: recent local chat turns sent with the current request.
- Verdict: final answer.
- Action: required next step.
- Risk: reason the decision could fail.
- UserState: behavior record used as context.
- Decision Journal: saved list of past Decisions.

## 4. Logic (step-by-step)

1. User submits a Decision.
2. Client sends the current Decision plus a bounded recent ConversationHistory window (last 8–12 turns).
3. System reads UserState and Decision Journal.
4. System detects request intent and whether the current message is a contextual follow-up.
5. System injects ConversationHistory into prompt context so short follow-ups inherit the previous topic.
6. System creates a Verdict or direct follow-up answer.
7. System creates an Action when appropriate.
8. System checks result quality and repeated-answer loops.
9. System returns result to the UI.

## 5. Stored data

- problem: user Decision.
- conversationHistory: recent user/assistant turns; used for prompt context, loop detection, and pressure scoring.
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

- Empty problem: return validation error. Any non-empty input is accepted — no character minimum.
- Wrong intent: route to review or plan behavior.
- Missing model key: use fallback or error path.
- Invalid blueprint: normalize fields.
- Repeated Verdict loop: force a different answer.
- Contextual follow-up: answer against the prior topic instead of treating the short message as a new standalone decision.
- Long or noisy ConversationHistory: sanitize and cap to the latest 12 turns before prompt injection.

## 7. Files involved

- `app/api/solve/route.ts`
- `lib/engine.ts`
- `lib/prompts.ts`
- `lib/semantic-guards.ts`
- `lib/profileEngine.ts`
- `lib/types.ts`
- `lib/mocks.ts`
