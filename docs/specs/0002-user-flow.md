# 0002 User Flow

## 1. Purpose

- Define the main user path.
- Make the Decision -> Action loop clear.

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

## 4. Logic (step-by-step)

1. User enters a Decision.
2. System gives a Verdict.
3. System gives an Action.
4. Action is saved.
5. Banner appears.
6. User chooses:
   - YES -> mark done
   - NOT YET -> keep reminder
   - SKIP -> show consequence
7. Identity Engine updates UserState.
8. Pressure Layer reacts when needed.

## 5. Stored data

- decisionId: record connected to the Action.
- actionText: Action shown to the user.
- status: `pending`, `done`, `blocked`, or `skipped`.
- dueAt: Action deadline.
- completedAt: time Action was marked done.
- skippedAt: time Action was skipped.
- blocker: reason user has not acted yet.

## 6. Edge cases

- Empty situation: block submission.
- Active pending Action: ask user to finish or skip it.
- User clicks NOT YET: keep Action pending or blocked.
- User skips: lower score and show consequence.
- Data missing: recreate safe reminder state.

## 7. Files involved

- `components/HomeExperience.tsx`
- `components/DecisionConsole.tsx`
- `components/PersistentActionBanner.tsx`
- `components/DecisionJournal.tsx`
- `components/OutcomeLogger.tsx`
- `app/api/solve/route.ts`
- `app/api/outcomes/route.ts`
- `lib/actionReminders.ts`
- `lib/userProfile.ts`
