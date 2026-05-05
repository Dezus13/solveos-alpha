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

## 4. Pressure States and Retention Loop

| State         | Trigger         | Banner shown            | Message shown                      |
|---------------|-----------------|-------------------------|------------------------------------|
| normal        | 0–2 hours       | Minimal strip (subdued) | —                                  |
| pressure_2h   | 2–12 hours      | Amber banner            | "Still not done?"                  |
| pressure_12h  | 12–24 hours     | Orange banner           | "You are avoiding this"            |
| overdue       | 24+ hours       | Red banner              | "You missed your deadline. Why?"   |

### Retention Loop via Open Commitments

SolveOS keeps the user's unfinished commitment visible at all times. There are no external notifications — the pressure is entirely internal.

**Normal state (0–2h)**: A very minimal strip at `top-0` shows:
- A small muted accent dot
- The action text, truncated, in subdued color
- A "Done" text button (muted, no border emphasis)

This strip signals "you have something open" without creating urgency. Calm but persistent.

**Re-entry behavior**: When the user opens the app with no thread and an active action exists, `DecisionConsole` replaces `EmptyState` with `OpenCommitmentView`:
- Shows the pressure-appropriate message (changes with elapsed time)
- Shows the action text
- Shows remaining time (for pressure_2h and beyond)
- Done button: marks complete, shows "Done. / Next?" for 2s, then clears

**Completion**: Marking Done anywhere (banner strip, `OpenCommitmentView`, or inline in a conversation turn) dispatches `ACTION_REMINDER_EVENT`. All surfaces update immediately. The banner briefly shows "Done." — no celebration, no streak language.

**What does NOT happen**: No celebration animations, no reward language, no gamification, no push notifications, no external reminders of any kind.

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

## 6a. Identity Feedback System

The Identity Feedback System turns the score into a behavioral label and shows it in the sidebar. It is not a game. It is not a reward. It is a mirror.

### What is shown

- **Behavior Score**: score / 100, displayed as a number with a thin progress bar.
- **Identity label**: one of the four confrontational labels derived from the score.
- **Progress bar color**: reflects score range — rose (0–39), amber (40–69), emerald (70+).

### Where it is shown

- Not shown in the main UI. The score and label are internal behavior data only.
- `components/IdentityWidget.tsx` exists and is functional but is not rendered in the sidebar. It is available to place in a profile or settings view in a future iteration.

### Tone rules

- Do NOT celebrate. No congratulations, no streaks, no badges.
- Do NOT soften. "You avoid decisions" is correct. Do not euphemize it.
- The label is a statement of current behavior, not a permanent identity.
- The score changes on every action event — it is live, not historical.

### Live update mechanism

`IdentityWidget` listens to `PROFILE_UPDATED_EVENT`. Any action that changes the score (`done`, `skip`, `overdue`) dispatches this event. The widget re-reads the profile and updates the score and label without a page reload.

### Score triggers (connected systems)

| Event               | Delta | Dispatcher                                   |
|---------------------|-------|----------------------------------------------|
| Action marked done  | +5    | `updateDecisionScoreOnActionCompletion()`    |
| Action skipped      | −5    | `updateDecisionScoreOnActionSkip()`          |
| Action overdue      | −10   | `updateDecisionScoreOnActionOverdue()`       |

The overdue penalty is applied once per action via `overdueScorePenaltyApplied` flag to prevent double-deduction.

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
- `components/IdentityWidget.tsx`
- `components/PersistentActionBanner.tsx`
- `components/HomeExperience.tsx`
