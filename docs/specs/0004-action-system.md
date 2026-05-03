# 0004 Action System

## 1. Purpose

- Track the next Action after a Verdict.
- Push the user to act within 24 hours.
- Allow Action to be reduced to a smaller step when blocked.

## 2. Where it is used

- Decision answer.
- Action follow-up controls.
- Persistent action banner.
- User profile scoring.

## 3. Main objects

- Decision: source of the Action.
- ActionReminder: saved record for one Action.
- ActionStatus: current state of the Action.
- BlockerCategory: reason the user did not act (`fear`, `unclear`, `lazy`, `external`).
- UserState: behavior record after Done or overdue.
- Pressure Layer: reminder and escalation system.

## 4. Logic (step-by-step)

1. System receives an Action from the Decision Engine.
2. System creates an ActionReminder.
3. ActionReminder starts as `pending`.
4. Banner shows the Action.
5. User chooses Done.
6. System marks ActionStatus as `done`, updates score.
7. If user does not act — Pressure Layer escalates at 2h, 12h, 24h.
8. At overdue: user picks BlockerCategory.
9. System calls `generateSmallerAction(action, category)` — client-side, no API.
10. User accepts smaller action via "I'll do this now".
11. System calls `restartWithSmallerAction(id, action, category)` — resets same reminder with fresh 24h clock.

## 5. Key functions

- `generateSmallerAction(action, category)`: returns a reduced action string based on BlockerCategory. No API call.
- `restartWithSmallerAction(id, action, category)`: saves the smaller action over the existing reminder, resets `createdAt` and `dueAt` to a new 24h window, sets status back to `pending`.

## 6. Stored data

- action: text of the Action (may be replaced by smaller action after reset).
- status: `pending`, `done`, `blocked`, or `skipped`.
- createdAt: time reminder was created (reset when smaller action is accepted).
- dueAt: 24-hour deadline (reset when smaller action is accepted).
- completedAt: time Action was completed.
- skippedAt: time Action was skipped.
- blockerCategory: selected category after overdue.
- smallerAction: reduced action text stored for audit trail.
- updatedAt: time of last change.

## 7. Edge cases

- No Action text: do not create reminder.
- Existing ActionReminder: do not duplicate it.
- Overdue Action: show category buttons, then smaller action.
- Smaller action accepted: overwrite existing reminder in-place, reset clock.
- Blocked Action: store blockerCategory.
- New Decision blocked: user must finish or the active Action must be overdue before submitting a new one.

## 8. Files involved

- `components/DecisionConsole.tsx`
- `components/PersistentActionBanner.tsx`
- `lib/actionReminders.ts`
- `lib/userProfile.ts`
- `lib/identityEngine.ts`
