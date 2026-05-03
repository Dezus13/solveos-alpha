# SolveOS - Decision Log

This file tracks what we change, why we change it, and what we do next.

---

## 2026-05-03 — Action history and accountability

### Changed

- `lib/actionReminders.ts`: Added `decisionText?: string` to `ActionReminderRecord` — stores the original question when an action is created
- `lib/actionReminders.ts`: Updated `createReminderRecord()` and `ensureActionReminder()` to accept optional `decisionText`
- `lib/actionReminders.ts`: Added `getHistoryRecords()` — returns all resolved records (done, skipped, overdue) sorted by `updatedAt` descending. No new storage key; derived from existing `solveos_action_pressure_v1`
- `lib/actionReminders.ts`: Added `getActionMetrics()` — returns `{ successRate, streak }` for last 7 resolved actions
- `lib/actionReminders.ts`: Added `formatTimeAgo()` — human-readable relative timestamp
- `components/ActionHistory.tsx`: New component. Shows metrics row (last 7 success rate, streak) + last 8 resolved actions. Each item: decision text (if any), action text, status badge (Done/Skipped/Overdue), time ago. Listens to `ACTION_REMINDER_EVENT` to refresh live
- `components/HomeExperience.tsx`: Now passes `message` as `decisionText` to `ensureActionReminder()` so history has question context
- `components/HomeExperience.tsx`: Added `ActionHistory` section to sidebar between the score widget and the Decision Journal
- `components/HomeExperience.tsx`: Sidebar content below the new-chat button wrapped in `flex-1 overflow-y-auto min-h-0` — prevents overflow when history grows

### Why

- Users needed to see their behavior over time
- The `solveos_action_pressure_v1` store already had all the data; it only needed read-side functions and a UI layer
- No new storage key — history is derived at read time from existing records

### Problem solved

- Users can now see past actions, their outcomes, success rate, and current streak in the sidebar
- This creates accountability: skipped actions are visible, not forgotten

### Not done

- History not paginated (shows last 8 items)
- No filter by status (done / skipped / overdue)

### Next

- Commit: `feat: add action history and accountability tracking`

---

## 2026-05-03 — Decision score system

### Changed

- `lib/userProfile.ts`: Added `PROFILE_UPDATED_EVENT` — dispatched from `saveProfile()` so all UI can react to score changes without a page reload
- `lib/userProfile.ts`: Fixed `updateDecisionScoreOnActionSkip()` delta: −10 → −5
- `lib/userProfile.ts`: Added `updateDecisionScoreOnActionOverdue()` (delta −10)
- `lib/userProfile.ts`: Added `getIdentityLabel(score)` — 4-tier label: 0–39 "You avoid decisions", 40–69 "You are inconsistent", 70–89 "You act on decisions", 90–100 "You are highly reliable"
- `lib/userProfile.ts`: Updated `scoreMessageFor()` to delegate to `getIdentityLabel()`
- `lib/identityEngine.ts`: `generateIdentityLabel()` now returns `getIdentityLabel(getProfile().userDecisionScore)` — consistent with profile-based labels
- `lib/actionReminders.ts`: Added `overdueScorePenaltyApplied?: boolean` to `ActionReminderRecord` — prevents overdue penalty from firing more than once per action
- `components/PersistentActionBanner.tsx`: Added `useEffect` that calls `updateDecisionScoreOnActionOverdue()` exactly once when action becomes overdue (guarded by `overdueScorePenaltyApplied` flag)
- `components/DecisionConsole.tsx` (`ExecutionPressure`): Replaced `Follow-through × / Identity` display with `Score: X/100` + `getIdentityLabel(score)`; added reactive `score` state driven by `PROFILE_UPDATED_EVENT`
- `components/HomeExperience.tsx` sidebar: Added Decision Score widget — shows score/100, colored progress bar, identity label; reactive via `PROFILE_UPDATED_EVENT`
- `components/HomeExperience.tsx`: Updated `blueprint.scoreMessage` assignments to use `getIdentityLabel()` instead of hardcoded 2-tier labels

### Why

- Users needed to see how their follow-through affects their score in real time
- Skip and overdue had wrong deltas (both were −10); now skip is −5, overdue is −10
- Single source of truth for identity labels — all UI reads from `getIdentityLabel(score)` in `userProfile.ts`

### Problem solved

- Score is now visible in the sidebar and in every result card
- Score updates live (no page reload required) via custom event
- Overdue penalty fires exactly once per action regardless of how many re-renders occur

### Not done

- Score not yet synced to a backend or remote store — localStorage only

### Next

- Run: `npm run lint && npm run build`
- Commit: `feat: add decision score system`

---

## 2026-05-03 — Sync execution pressure system with specs

### Changed

- `0005-identity-and-pressure.md`: Added `PressureState` type, timing table (2h/12h/24h), overdue behavior (red banner + "Why not done?"), `BlockerCategory` definitions, smaller action generation table, updated logic steps, added `blockerCategory` and `smallerAction` to stored data
- `0004-action-system.md`: Added `BlockerCategory` to main objects; added `generateSmallerAction()` and `restartWithSmallerAction()` as documented functions with clear behavior; added `blockerCategory`, `smallerAction`, `updatedAt` to stored data; updated edge cases to include smaller-action reset and blocked-new-decision gate
- `0006-data-and-storage.md`: Split stored data into `ActionReminder` and `Decision` sections; added `blockerCategory`, `smallerAction`, `updatedAt` to ActionReminder; added "Pressure State (derived)" section documenting `pressure_state`, `last_action_time`, and `reset_time`
- `0002-user-flow.md`: Added new Decision blocked gate (step 2); added "Execution loop" section covering 2h/12h/24h escalation and full overdue → category → smaller action → reset flow; updated stored data and edge cases

### Why

- Specs must describe real system behavior
- The execution pressure loop was fully implemented but specs still described the old simple flow
- A teacher or new contributor reading the specs would not understand how the pressure system works

### Problem solved

- Specs now match the implemented code exactly
- No contradiction between specs and implementation

### Not done

- `0003-decision-engine.md` was not changed (no engine logic changed)
- `0001-project-overview.md` was not changed (overview still accurate)

### Next

- Commit: `docs: sync execution pressure system with specs`

---

## 2026-05-03 — Execution pressure loop

### Changed

- `lib/actionReminders.ts`: Added `BlockerCategory` ('fear' | 'unclear' | 'lazy' | 'external'), `PressureState` ('normal' | 'pressure_2h' | 'pressure_12h' | 'overdue') types
- `lib/actionReminders.ts`: Added `blockerCategory?` and `smallerAction?` fields to `ActionReminderRecord`
- `lib/actionReminders.ts`: Added `getPressureState()` — computes pressure level from elapsed time (2h / 12h / 24h thresholds)
- `lib/actionReminders.ts`: Added `getPressureMessage()` — returns "Still not done?" / "You are avoiding this" / "You missed your deadline. Why?"
- `lib/actionReminders.ts`: Added `generateSmallerAction()` — produces a micro-step based on blocker category (no API call)
- `lib/actionReminders.ts`: Added `restartWithSmallerAction()` — resets the same reminder to the smaller action with a fresh 24h clock
- `PersistentActionBanner.tsx`: Full pressure state system — amber → orange → red banner as time passes; overdue triggers "Why not done?" with 4 category buttons; after category → smaller action preview + "I'll do this now"; fixed `refresh()` to always call `setActive(data)` (was only updating on truthy)
- `DecisionConsole.tsx` `ExecutionPressure`: Replaced free-text blocker input with category buttons; after category → smaller action + "I'll do this now"; pressure state label updates header text
- `DecisionConsole.tsx` blocked input message: Now shows pressure state message ("Still not done? — finish your previous action first")

### Why

- User must not escape after receiving an action
- Free-text blocker was ignored — categories force reflection and generate a concrete next step
- Pressure escalates visually over time to create urgency without requiring a page reload
- Smaller action removes the "too big" excuse by auto-generating a micro-step

### Not done

- Pressure state does not yet escalate in `ExecutionPressure` inline (color only, no ticking clock) — the persistent banner handles live updates

### Next

- Test: submit decision → wait 2h → verify "Still not done?" in banner
- Test: overdue → pick "Fear" → verify smaller action generated → verify 24h clock resets

---

## 2026-05-03 — Core behavioral response loop

### Changed

- `HomeExperience.tsx`: Simplified `buildAssistantAnswer()` to 5 lines: Score, Verdict, Why (max 2), Do this next, Deadline 24h
- `HomeExperience.tsx`: Auto-save every decision to `solveos_saved_decisions` (localStorage) immediately after API response
- `HomeExperience.tsx`: Call `ensureActionReminder` immediately after response so the persistent banner fires without waiting for component mount
- `HomeExperience.tsx`: Removed identity, pattern, and "cost of inaction" lines from the response — too much noise
- `HomeExperience.tsx`: Added `deadline` label to all 6 languages
- `PersistentActionBanner.tsx`: Removed broken `getSavedDecisions()` guard — original `if (!active) return null` is the correct first-visit protection (action reminders only exist after a decision is made)
- `DecisionConsole.tsx`: Restored original `getActiveReminder()` call — the `getSavedDecisions()` guard was wrong and prevented the blocked-action gate from working on repeat visits

### Why

- SolveOS must force one action, not just answer
- The response was too long — users were reading, not acting
- Auto-save ensures the pressure system fires after every decision
- The banner's first-visit protection was broken by the previous `getSavedDecisions()` fix — it was using the wrong store

### Not done

- Done / Not yet buttons are in `ExecutionPressure` (inline) and `PersistentActionBanner` (top bar) — both wired
- Follow-through score updates on Done via `updateDecisionScoreOnActionCompletion`
- Blocked reason captured via `ExecutionPressure` blocker input

### Next

- Test full loop: submit → compact response → banner → Done → score increase
- Verify first-visit: no banner on fresh localStorage

---

## 2026-05-03

### Changed

- Added spec consistency rules
- Added spec consistency checklist
- Aligned terms across all specs
- Standardized Decision, Action, UserState, Decision Journal, Identity Engine, and Pressure Layer

### Why

- Specs must describe one system
- Teacher should not see conflicting names
- Future changes need one source of truth

### Not done

- No feature changes in this pass

### Next

- Commit aligned specs
- Keep checklist before future commits

---

### Changed

- Created Functional Map (0000-functional-map.md)
- Cleaned and simplified project specs
- Removed unnecessary text and noise
- Structured files into clear roles (User Flow, Decision Engine, Action System, etc.)

### Why

- The project must be easy to understand in 30 seconds
- The teacher should see clear thinking, not messy files
- Each part of the system should have one role

### Not done

- Teacher summary needs final review
- Future changes need consistency checks

### Next

- Keep specs aligned after each change
- Prepare clean teacher summary

### Rule

After any change:
- update specs
- check consistency
- then commit

---

## Rules for future updates

Every time we change something:

- Write what changed
- Explain why
- Write what is still missing
- Define the next step
- Check spec consistency

Keep it simple.
No long text.
Only important decisions.
