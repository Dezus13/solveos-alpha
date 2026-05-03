# 0005 Identity And Pressure

## 1. Purpose

- Show the user what their behavior says about them.
- Create pressure when the user avoids action.

## 2. Where it is used

- Decision console follow-up.
- Persistent action banner.
- Home summary lines.
- User profile updates.

## 3. Main objects

- IdentityLabel: short behavior label for the user.
- DecisionScore: score based on follow-through.
- PressureLine: message shown after delay or skip.
- ActionSignals: completion, delay, and skip rates.
- UserProfile: saved behavior profile.

## 4. Logic (step-by-step)

1. System reads action reminders.
2. System counts completed actions.
3. System counts skipped and delayed actions.
4. System creates identity label.
5. User completes action.
6. Score increases.
7. User skips or delays action.
8. Score decreases or pressure increases.

## 5. Stored data

- userDecisionScore: follow-through score.
- decisionScoreTrend: score direction.
- totalDecisions: number of tracked decisions.
- status: action state used for identity.
- completedAt: proof of follow-through.
- skippedAt: proof of avoidance.

## 6. Edge cases

- No action history: show default identity.
- Many skipped actions: show avoidance identity.
- Overdue action: show stronger reminder.
- Missing profile: use default profile.
- Browser storage blocked: keep UI usable.

## 7. Files involved

- `lib/identityEngine.ts`
- `lib/inactionPain.ts`
- `lib/userProfile.ts`
- `lib/actionReminders.ts`
- `components/DecisionConsole.tsx`
- `components/PersistentActionBanner.tsx`
- `components/HomeExperience.tsx`
