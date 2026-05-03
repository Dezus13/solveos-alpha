# 0004 Action System

## 1. Purpose

- Track the next action after a verdict.
- Push the user to act within 24 hours.

## 2. Where it is used

- Decision answer.
- Action follow-up controls.
- Persistent action banner.
- User profile scoring.

## 3. Main objects

- ActionReminder: saved record for one action.
- ActionStatus: current state of the action.
- Blocker: reason the user has not acted.
- Countdown: time left before the action is overdue.
- FollowThroughCount: number of completed actions.

## 4. Logic (step-by-step)

1. System extracts action from the decision result.
2. System creates a reminder.
3. Reminder starts as `pending`.
4. Banner shows the action.
5. User marks action as done, blocked, or skipped.
6. System updates reminder status.
7. System updates score and identity.

## 5. Stored data

- action: text of the required step.
- status: `pending`, `done`, `blocked`, or `skipped`.
- createdAt: time reminder was created.
- dueAt: 24-hour deadline.
- completedAt: time action was completed.
- skippedAt: time action was skipped.
- blocker: user reason for delay.

## 6. Edge cases

- No action text: do not create reminder.
- Existing reminder: do not duplicate it.
- Overdue action: show stronger pressure.
- Blocked action: store blocker text.
- Skipped action: lower score and show consequence.

## 7. Files involved

- `components/DecisionConsole.tsx`
- `components/PersistentActionBanner.tsx`
- `lib/actionReminders.ts`
- `lib/userProfile.ts`
- `lib/identityEngine.ts`
- `lib/inactionPain.ts`
