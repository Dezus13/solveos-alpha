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
- Pressure Layer: system that reacts to delay or skip.
- IdentityLabel: short behavior label for the user.
- DecisionScore: score based on follow-through.
- PressureLine: message shown after delay or skip.
- ActionStatus: `pending`, `done`, `blocked`, or `skipped`.

## 4. Logic (step-by-step)

1. System reads ActionStatus.
2. System counts completed Actions.
3. System counts skipped and delayed Actions.
4. Identity Engine creates identity label.
5. User chooses YES.
6. Score increases.
7. User chooses NOT YET or SKIP.
8. Pressure Layer increases pressure.

## 5. Stored data

- userDecisionScore: follow-through score.
- decisionScoreTrend: score direction.
- totalDecisions: number of tracked decisions.
- status: ActionStatus used by Identity Engine.
- completedAt: proof of follow-through.
- skippedAt: proof of avoidance.

## 6. Edge cases

- No Action history: show default identity.
- Many skipped Actions: show avoidance identity.
- Overdue Action: show stronger reminder.
- Missing profile: use default profile.
- Browser storage blocked: keep UI usable.

## 7. Files involved

- `lib/identityEngine.ts`
- `lib/inactionPain.ts`
- `lib/userProfile.ts`
- `lib/actionReminders.ts`
- `components/DecisionConsole.tsx`
- `components/PersistentActionBanner.tsx`
- `components/HomeExperience.tsx`
