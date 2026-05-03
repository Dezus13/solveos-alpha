# 0007 UI Structure

## 1. Purpose

- Define the main UI areas.
- Show how the user moves from input to verdict to action.

## 2. Where it is used

- Home route.
- Journal route.
- Decision console.
- Result panels.
- Settings modal.
- Persistent action banner.

## 3. Main objects

- HomeExperience: main app shell.
- DecisionConsole: input and conversation area.
- SimulationResults: decision result display.
- PersistentActionBanner: active action reminder.
- DecisionJournal: saved decision list.
- SettingsModal: user settings panel.

## 4. Logic (step-by-step)

1. Home page loads.
2. Main experience renders.
3. User enters a situation.
4. Console submits request.
5. Results render verdict and action.
6. Banner shows pending action.
7. Journal shows saved decisions.
8. Settings control language and preferences.

## 5. Stored data

- settings: user UI preferences.
- language: selected or detected language.
- conversationHistory: visible decision thread.
- currentDecisionId: active decision.
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
