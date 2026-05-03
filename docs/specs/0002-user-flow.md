# 0002 User Flow

## 1. Purpose

- Define the main user path.
- Make the Decision -> Action -> Execution loop clear.

## 2. Where it is used

- Home page decision input.
- Decision console messages.
- Result view.
- Persistent action banner.
- Decision Journal.

## 3. Main objects

- Decision: situation entered by the user.
- Verdict: short Decision result.
- Action: required step within 24 hours.
- UserState: behavior record after the user acts or avoids Action.
- Decision Journal: saved list of Decisions.

## 4. Retention Loop via Open Commitments

When the user has an active action (not yet marked done), SolveOS applies a continuous open loop. This is an internal pressure mechanism — no notifications, no push reminders. The pressure comes from the unfinished commitment itself.

### Open loop rules

1. **Always show an indicator**: as long as an active action exists, something is visible:
   - `normal` (0–2h): a very subtle strip at the top of the page (muted text, accent dot, Done button)
   - `pressure_2h` (2–12h): amber banner — "Still not done?"
   - `pressure_12h` (12–24h): orange banner — "You are avoiding this"
   - `overdue` (24h+): red banner — "You missed your deadline. Why?" + blocker buttons

2. **On app open with active action (no thread)**: the main content area skips `EmptyState` and immediately shows the `OpenCommitmentView`:
   - Shows the pressure message appropriate to elapsed time
   - Shows the action text
   - Shows the time remaining (for pressure states)
   - Done button: marks action complete, dispatches score update, shows "Done. / Next?"
   - Input bar is hidden — the user must engage with the open commitment first

3. **Completion**:
   - Mark done → pressure clears immediately
   - Banner briefly shows "Done." (no celebration, no streak message, no animation)
   - Optional line: "Next?" — invites new decision without pushing

4. **No external notifications**: all pressure is in-product only. The system does not send emails, push notifications, or reminders outside the app.

### What does NOT happen

- No celebration animations
- No reward messages or achievement language
- No streak-based emotional language
- No forced UI — the user can close the app; the pressure is internal, not pestering

## 5. Execution Entry Flow (first input only)

When the user submits their first input (no thread exists), the system does not call the AI. Instead it routes directly into a forced action-discovery flow:

1. System shows: "Why is this not done?" + the user's decision in quotes.
2. Four blocker buttons appear: Fear / Not clear / No energy / Blocked externally.
3. User picks a category. System generates a smaller action client-side via `generateSmallerAction(decision, category)`. No API call.
4. System shows: "Do this now: {micro-action}".
5. User taps "I will do this now". System calls `ensureActionReminder(id, microAction, decision)`. A 24h clock starts. The `PersistentActionBanner` appears automatically.
6. Entry flow shows a brief "Committed. 24h window started." confirmation, then clears.

This replaces any AI response for the first interaction. The goal is to force action before analysis.

## 6. Main flow (step-by-step, second input onward)

1. User enters a Decision.
2. System checks: is there an active pending Action?
   - YES → block new Decision. Show: "{PressureMessage} — finish your previous action first".
   - NO → continue.
3. System gives a Verdict.
4. System gives an Action.
5. Action is saved as ActionReminder (`pending`, 24h clock starts).
6. Banner appears at top of page.
7. User marks Done → score increases, banner clears.

## 7. Execution loop (no action taken)

1. Time elapses. Pressure Layer escalates:
   - 2h: banner turns amber, "Still not done?"
   - 12h: banner turns orange, "You are avoiding this"
   - 24h: banner turns red, "You missed your deadline. Why?"
2. At overdue:
   a. User sees "Why not done?" with four category buttons.
   b. User picks a category (fear / not clear / no energy / blocked externally).
   c. System generates a smaller action (no API call).
   d. User sees smaller action and taps "I'll do this now".
   e. System resets the same reminder with the smaller action and a fresh 24h clock.

## 8. Stored data

- decisionId: record connected to the Action.
- actionText: Action shown to the user.
- status: `pending`, `done`, `blocked`, or `skipped`.
- dueAt: Action deadline.
- completedAt: time Action was marked done.
- skippedAt: time Action was skipped.
- blockerCategory: category picked when Action was overdue.
- smallerAction: reduced action after category pick.

## 9. Edge cases

- Empty situation: block submission.
- Active pending Action: block new Decision, show pressure message.
- Overdue Action: show category buttons to reduce the action.
- Data missing: recreate safe reminder state.

## 10. Files involved

- `components/HomeExperience.tsx`
- `components/DecisionConsole.tsx`
- `components/PersistentActionBanner.tsx`
- `components/DecisionJournal.tsx`
- `app/api/solve/route.ts`
- `lib/actionReminders.ts`
- `lib/userProfile.ts`
