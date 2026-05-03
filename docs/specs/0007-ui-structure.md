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
- SettingsHydrator.

## 3. Main objects

- DecisionConsole: where user enters a Decision.
- SimulationResults: where user sees Verdict and Action.
- PersistentActionBanner: where active Action stays visible.
- Decision Journal: where saved Decisions appear.
- SettingsModal: where user settings appear.
- SettingsHydrator: client-only bridge that applies saved theme, accent, and density from `lib/settingsStore.ts` to `document.documentElement`.
- ActionHistory: internal behavior memory and accountability metrics, currently hidden from sidebar UI.

## 4. Logic (step-by-step)

1. Home page loads.
2. Main experience renders.
3. User enters a Decision.
4. Console submits request.
5. Results show Verdict and Action.
6. Banner waits until client mount, then reads localStorage and shows pending Action.
7. Decision Journal shows saved Decisions.
8. Settings control language and preferences.
9. Decision Score stays internal for now and is not shown as a sidebar card.
10. Action History stays internal for now and is not shown as a sidebar block.
11. Appearance settings are saved in `solveos_settings`.
12. Appearance settings apply globally through `data-theme`, `data-accent`, and `data-density` attributes.
13. Every appearance update dispatches `SETTINGS_UPDATED` so mounted UI can sync live.

## 5. Stored data

- settings: user UI preferences.
- appearance.theme: `system`, `dark`, or `midnight`.
- appearance.accent: `purple`, `blue`, `emerald`, or `rose`.
- appearance.density: `compact`, `balanced`, or `calm`.
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
- Persistent banner hydration: render nothing until mounted on the client, then read `localStorage`, `Date.now()`, `window`, and reminder state.
- Sidebar score noise: keep Decision Score logic and storage active, but hide the large score card from the sidebar.
- Sidebar history noise: keep Action History logic, storage, metrics, and component available, but hide the sidebar block until the UI is cleaner.
- Settings hydration: read `localStorage` only on the client through `settingsStore`, apply saved appearance before the full home experience loads, and update live without page reload.

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
- `components/SettingsHydrator.tsx`
- `lib/settings.ts`
- `lib/settingsStore.ts`
- `locales/`
