# 0005 Identity Engine And Pressure Layer

## 1. Purpose

- Define the Identity Engine.
- Define the Pressure Layer.

## 2. Where it is used

- Decision console follow-up.
- Persistent action banner.
- Home summary lines.
- User profile updates.

## 3. Main objects

- UserState: behavior record after Action outcomes.
- Identity Engine: system that turns UserState into identity feedback.
- Pressure Layer: system that reacts to delay based on elapsed time.
- IdentityLabel: short behavior label for the user.
- DecisionScore: score based on follow-through.
- PressureState: current urgency level of a pending Action.
- PressureLine: message shown based on PressureState.
- ActionStatus: `pending`, `done`, `blocked`, or `skipped`.
- BlockerCategory: reason the user did not act (`fear`, `unclear`, `lazy`, `external`).

## 4. Pressure States

| State         | Trigger         | Message shown                      |
|---------------|-----------------|------------------------------------|
| normal        | 0–2 hours       | "You have a pending action"        |
| pressure_2h   | 2–12 hours      | "Still not done?"                  |
| pressure_12h  | 12–24 hours     | "You are avoiding this"            |
| overdue       | 24+ hours       | "You missed your deadline. Why?"   |

## 5. Overdue Behavior

1. Banner turns red.
2. Header shows: "You missed your deadline. Why?"
3. System shows "Why not done?" with four category buttons:
   - Fear
   - Not clear
   - No energy
   - Blocked externally
4. User picks a category.
5. System generates a smaller action (client-side, no API).
6. User sees the smaller action and can choose "I'll do this now".
7. System resets the same ActionReminder to the smaller action with a fresh 24h clock.

## 6. Blocker Categories and Smaller Actions

| Category | Smaller action prefix                |
|----------|--------------------------------------|
| fear     | "5 minutes only: {action}"           |
| unclear  | "Write what is unclear about: {action}" |
| lazy     | "First step only: {action}"          |
| external | "Name what is blocking: {action}"    |

## 7. Logic (step-by-step)

1. System reads ActionStatus.
2. System counts completed Actions.
3. System counts skipped and delayed Actions.
4. Identity Engine creates identity label.
5. User chooses Done.
6. Score increases.
7. User does not act — time elapses.
8. Pressure Layer escalates PressureState at 2h, 12h, 24h thresholds.
9. At overdue: show category buttons → generate smaller action → reset clock.

## 8. Stored data

- userDecisionScore: follow-through score.
- decisionScoreTrend: score direction.
- totalDecisions: number of tracked decisions.
- status: ActionStatus used by Identity Engine.
- completedAt: proof of follow-through.
- skippedAt: proof of avoidance.
- blockerCategory: selected blocker category when action was not done.
- smallerAction: reduced action generated after blocker category is picked.

## 9. Edge cases

- No Action history: show default identity.
- Many skipped Actions: show avoidance identity.
- Overdue Action: show red banner and category buttons.
- Missing profile: use default profile.
- Browser storage blocked: keep UI usable.

## 10. Files involved

- `lib/identityEngine.ts`
- `lib/userProfile.ts`
- `lib/actionReminders.ts`
- `components/DecisionConsole.tsx`
- `components/PersistentActionBanner.tsx`
- `components/HomeExperience.tsx`
