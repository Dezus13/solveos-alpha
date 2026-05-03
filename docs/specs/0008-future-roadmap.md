# 0008 Future Roadmap

## 1. Purpose

- Define the next technical and product improvements.
- Keep future work focused on the Decision and Action loop.

## 2. Where it is used

- Project planning.
- Teacher review.
- Future implementation work.
- MVP validation.

## 3. Main objects

- UserAccount: future owner for each Decision.
- Database: future place to save Decisions and Actions.
- Decision Journal: future long-term history view.
- PaymentSignal: proof that users may pay.
- FeedbackItem: real user feedback.
- TestCoverage: checks for main flows.

## 4. Logic (step-by-step)

1. Validate user need.
2. Ask users for feedback.
3. Test willingness to pay.
4. Improve storage.
5. Add user accounts.
6. Improve tests.
7. Improve review flow.

## 5. Stored data

- userId: future owner of Decisions.
- paymentInterest: user willingness to pay.
- feedbackText: user feedback.
- decisionHistory: saved Decisions in database.
- outcomeHistory: saved results over time.

## 6. Edge cases

- Users do not pay: revise product offer.
- Feedback is unclear: run smaller tests.
- Database migration fails: keep local backup.
- Accounts add friction: keep simple demo mode.
- Tests fail: block release until fixed.

## 7. Files involved

- `app/api/solve/route.ts`
- `app/api/memory/route.ts`
- `app/api/outcomes/route.ts`
- `components/OutcomeLogger.tsx`
- `components/DecisionJournal.tsx`
- `lib/memory.ts`
- `scripts/`
