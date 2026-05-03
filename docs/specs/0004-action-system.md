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
- ActionResultStatus: accountability state shown in history: `done`, `not yet`, `skipped`, or `overdue`.
- BlockerCategory: reason the user did not act (`fear`, `unclear`, `lazy`, `external`).
- UserState: behavior record after Done or overdue.
- Pressure Layer: reminder and escalation system.

## 4. Logic (step-by-step)

1. System receives an Action from the Decision Engine.
2. System creates an ActionReminder.
3. ActionReminder starts as `not yet`.
4. Banner shows the Action.
5. User chooses Done.
6. System marks ActionStatus as `done`, updates score, and the history list updates.
7. If user chooses Not yet, the Action stays active with status `not yet`; the history list updates immediately.
8. If user skips to start a new Decision, the ActionStatus becomes `skipped`, score decreases, and the history list updates.
9. If user does not act — Pressure Layer escalates at 2h, 12h, 24h.
10. At overdue: ActionStatus becomes `overdue` when the overdue penalty is applied; user picks BlockerCategory.
11. System calls `generateSmallerAction(action, category)` — client-side, no API.
12. User accepts smaller action via "I'll do this now".
13. System calls `restartWithSmallerAction(id, action, category)` — resets same reminder with fresh 24h clock and status `not yet`.

## 5. Key functions

- `generateSmallerAction(action, category)`: returns a reduced action string based on BlockerCategory. No API call.
- `restartWithSmallerAction(id, action, category)`: saves the smaller action over the existing reminder, resets `createdAt` and `dueAt` to a new 24h window, sets status back to `not yet`.
- `updateDecisionScoreOnActionCompletion()`: +5 to score.
- `updateDecisionScoreOnActionSkip()`: −5 to score.
- `updateDecisionScoreOnActionOverdue()`: −10 to score. Called once per action via `overdueScorePenaltyApplied` flag.
- `getIdentityLabel(score)`: returns the identity label for a given score (0–39 / 40–69 / 70–89 / 90–100).

## 5a. Score rules

| Event   | Delta |
|---------|-------|
| Done    | +5    |
| Not yet | 0     |
| Skip    | −5    |
| Overdue | −10   |

Score starts at 50. Clamped 0–100. Stored in `solveos_user_profile` (localStorage).

## 5b. Identity labels (score-based)

| Range  | Label                    |
|--------|--------------------------|
| 0–39   | "You avoid decisions"    |
| 40–69  | "You are inconsistent"   |
| 70–89  | "You act on decisions"   |
| 90–100 | "You are highly reliable"|

## 6. Stored data

- action: text of the Action (may be replaced by smaller action after reset).
- decisionText: original Decision text that produced the Action.
- status: `not yet`, `done`, `skipped`, or `overdue`. Legacy records may contain `pending` or `blocked` and are treated as `not yet` until due.
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
- PersistentActionBanner: do not render until mounted on the client; all `localStorage`, `window`, `Date.now()`, and reminder reads happen after mount to avoid hydration mismatch.

## 7a. History and accountability

- `getHistoryRecords()`: returns all ActionReminders (done, not yet, skipped, overdue) sorted newest-first.
- `getActionResultStatus()`: normalizes current and legacy records into `done`, `not yet`, `skipped`, or `overdue`.
- `getActionResultTimestamp()`: picks the timestamp used for "time passed" in the history row.
- `getActionMetrics()`: computes `successRate` (% done in last 7 action records) and `streak` (consecutive done from newest).
- `formatTimeAgo(timestamp)`: converts ISO timestamp to human-readable relative time ("2h ago", "3d ago").
- `ActionHistory` component: displays metrics + last 8 actions in the sidebar. Reacts to `ACTION_REMINDER_EVENT`.

## 8. Files involved

- `components/DecisionConsole.tsx`
- `components/PersistentActionBanner.tsx`
- `components/ActionHistory.tsx`
- `lib/actionReminders.ts`
- `lib/userProfile.ts`
- `lib/identityEngine.ts`
