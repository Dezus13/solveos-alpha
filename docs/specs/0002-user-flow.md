# 0002 User Flow

## 1. Purpose

- Define the main user path.
- Make the decision-to-action loop clear.

## 2. Where it is used

- Home page decision input.
- Decision console messages.
- Result view.
- Persistent action banner.
- Decision journal.

## 3. Main objects

- Situation: text entered by the user.
- Verdict: short decision result.
- Action: required step within 24 hours.
- Reminder: saved action state.
- Identity: feedback based on follow-through.

## 4. Logic (step-by-step)

1. User enters situation.
2. System gives verdict.
3. System gives action.
4. Action is saved.
5. Banner appears.
6. User chooses:
   - YES -> mark done
   - NOT YET -> keep reminder
   - SKIP -> show consequence
7. Identity updates.

## 5. Stored data

- turnId: conversation item connected to the action.
- actionText: next step shown to the user.
- status: `pending`, `done`, `blocked`, or `skipped`.
- dueAt: action deadline.
- completedAt: time action was marked done.
- skippedAt: time action was skipped.
- blocker: reason user has not acted yet.

## 6. Edge cases

- Empty situation: block submission.
- Active pending action: ask user to finish or skip it.
- User clicks Not yet: keep action pending or blocked.
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
