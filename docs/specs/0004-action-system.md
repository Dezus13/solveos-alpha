# 0004 Action System

## 1. Purpose

- Track the next Action after a Verdict.
- Push the user to act within 24 hours.

## 2. Where it is used

- Decision answer.
- Action follow-up controls.
- Persistent action banner.
- User profile scoring.

## 3. Main objects

- Decision: source of the Action.
- ActionReminder: saved record for one Action.
- ActionStatus: current state of the Action.
- Blocker: reason the user has not acted.
- UserState: behavior record after YES, NOT YET, or SKIP.
- Pressure Layer: reminder and consequence system.

## 4. Logic (step-by-step)

1. System receives an Action from the Decision Engine.
2. System creates an ActionReminder.
3. ActionReminder starts as `pending`.
4. Banner shows the Action.
5. User chooses YES, NOT YET, or SKIP.
6. System updates ActionStatus.
7. System updates UserState.
8. Pressure Layer reacts when Action is delayed or skipped.

## 5. Stored data

- action: text of the Action.
- status: `pending`, `done`, `blocked`, or `skipped`.
- createdAt: time reminder was created.
- dueAt: 24-hour deadline.
- completedAt: time Action was completed.
- skippedAt: time Action was skipped.
- blocker: user reason for delay.

## 6. Edge cases

- No Action text: do not create reminder.
- Existing ActionReminder: do not duplicate it.
- Overdue Action: show stronger pressure.
- Blocked Action: store blocker text.
- Skipped Action: lower score and show consequence.

## 7. Files involved

- `components/DecisionConsole.tsx`
- `components/PersistentActionBanner.tsx`
- `lib/actionReminders.ts`
- `lib/userProfile.ts`
- `lib/identityEngine.ts`
- `lib/inactionPain.ts`
