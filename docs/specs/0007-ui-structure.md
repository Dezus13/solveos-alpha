# 0007 UI Structure

## 1. Purpose

- Define the main UI areas.
- Show how the user moves from Decision to Verdict to Action.

## 2. Where it is used

- Home route.
- Journal route.
- Decision console.
- Result panels.
- Settings modal.
- Persistent action banner.
- Decision Journal.

## 3. Main objects

- DecisionConsole: where user enters a Decision.
- SimulationResults: where user sees Verdict and Action.
- PersistentActionBanner: where active Action stays visible.
- Decision Journal: where saved Decisions appear.
- SettingsModal: where user settings appear.

## 4. Logic (step-by-step)

1. Home page loads.
2. Main experience renders.
3. User enters a Decision.
4. Console submits request.
5. Results show Verdict and Action.
6. Banner shows pending Action.
7. Decision Journal shows saved Decisions.
8. Settings control language and preferences.

## 5. Stored data

- settings: user UI preferences.
- language: selected or detected language.
- conversationHistory: visible decision thread.
- currentDecisionId: active Decision.
- refreshTrigger: signal to reload journal data.

## 6. Edge cases

- API loading: show skeleton or loading state.
- API error: show safe error message.
- No saved decisions: show empty journal state.
- Missing locale: use English fallback.
- Mobile layout: keep controls readable.

## 7. Files involved

- `app/page.tsx`
- `app/journal/page.tsx`
- `components/DeferredHomeExperience.tsx`
- `components/HomeExperience.tsx`
- `components/DecisionConsole.tsx`
- `components/SimulationResults.tsx`
- `components/DecisionJournal.tsx`
- `components/PersistentActionBanner.tsx`
- `components/SettingsModal.tsx`
- `locales/`
