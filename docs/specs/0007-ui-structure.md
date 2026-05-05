# 0007 UI Structure

## 1. Purpose

- Define the main UI areas.
- Show how the user moves from Decision to Verdict to Action.

## 2. First Experience Flow

### Entry point behavior

When the user opens the app with no session history:

1. The empty state shows one confrontational question: "What decision are you avoiding right now?"
2. A pulsing accent dot signals the system is live and waiting — not idle.
3. The subtext is direct: "No more overthinking. Get a decision and a next step."
4. Three example prompts are shown (if `showSuggestions` is enabled):
   - "Should I launch this?"
   - "Am I wasting time on this idea?"
   - "What am I avoiding?"
5. The input placeholder reads "Describe the decision..." — no assistant-like framing.
6. The user types anything that names a decision — no minimum length barrier.
7. On submit, the input routes immediately into the full decision engine (Strategy mode). No casual chat, no clarification loop.

### Why this matters

- The first interaction must feel like a commitment, not a chat opener.
- SolveOS is not a chatbot. The entry point must make that clear immediately.
- A confrontational question forces the user to name something real, not browse.
- Short first inputs ("quit my job", "launch?", "hire him") are valid — the engine handles them. The 20-char minimum is bypassed on first input only.
- Subsequent inputs in a thread still require 20 chars to prevent noise in ongoing analysis.

### Length rules

| Context | Minimum | Why |
|---|---|---|
| First input (no thread) | 5 chars | Lower the barrier — the title sets the tone |
| Follow-up input (thread exists) | 20 chars | Require enough context for continued analysis |

### What does NOT change

- The decision engine always runs. No casual mode, no greeting mode.
- The pressure system is unchanged — no banner on first visit.
- Score, history, and all behavior systems run silently from the first decision.

## 3. UI Direction

SolveOS uses a minimal, focused layout — clean like Claude, but SolveOS-specific in behavior.

- SolveOS is not a general chat clone.
- SolveOS is a decision-to-action system.
- The interface clears the path to one thing: the next Action.
- Score and history are internal behavior systems. They are not always visible UI blocks.
- Pressure appears only when the user has an unfinished Action.

## 4. Where it is used

- Home route.
- Journal route.
- Decision console.
- Result panels.
- Settings modal.
- Persistent action banner.
- Decision Journal.
- SettingsHydrator.

## 5. Main objects

- DecisionConsole: where user enters a Decision. Empty state shows the confrontational title "What decision are you avoiding right now?" with a live system indicator, and mode selector.
- SimulationResults: where user sees Verdict and Action.
- PersistentActionBanner: where active Action stays visible. Shows only when the user has an unfinished Action. Does not appear on first visit.
- Decision Journal: where saved Decisions appear. Visible in sidebar.
- SettingsModal: where user settings appear. Compact sidebar-nav layout with full support for theme, accent, density, and language.
- SettingsHydrator: client-only bridge that applies saved theme, accent, and density from `lib/settingsStore.ts` to `document.documentElement`.
- ActionHistory: internal behavior memory and accountability metrics. Not shown in sidebar UI. Logic and storage remain active.
- Decision Score: internal scoring system. Not shown as a sidebar card. Logic and storage remain active.

## 6. Sidebar

The sidebar contains only:
- SolveOS logo and system status
- New chat button
- Decision Journal section

Decision Score block is hidden — score logic is active but not a UI card.
Action History block is hidden — history logic is active but not a UI block.

## 7. Logic (step-by-step)

1. Home page loads.
2. Main experience renders. Empty state shows the confrontational first-experience question and a live accent dot.
3. User enters a Decision (5+ chars on first input; 20+ chars on follow-ups).
4. Console submits request. Routes immediately to full decision engine — no casual mode.
5. Results show Verdict and Action.
6. Banner waits until client mount, then reads localStorage. Shows only if the user has a pending Action.
7. Decision Journal shows saved Decisions.
8. Settings control language and preferences.
9. Decision Score stays internal for now and is not shown as a sidebar card.
10. Action History stays internal for now and is not shown as a sidebar block.
11. Appearance settings are saved in `solveos_settings`.
12. Appearance settings apply globally through `data-theme`, `data-accent`, and `data-density` attributes.
13. Every appearance update dispatches `SETTINGS_UPDATED` so mounted UI can sync live.

## 8. Stored data

- settings: user UI preferences.
- appearance.theme: `system`, `dark`, or `midnight`.
- appearance.accent: `purple`, `blue`, `emerald`, or `rose`.
- appearance.density: `compact`, `balanced`, or `calm`.
- language: selected or detected language.
- conversationHistory: visible decision thread.
- currentDecisionId: active Decision.
- refreshTrigger: signal to reload journal data.

## 9. Edge cases

- API loading: show skeleton or loading state.
- API error: show safe error message.
- No saved decisions: show empty journal state.
- Missing locale: use English fallback.
- Mobile layout: keep controls readable.
- First input too short: require at least 5 chars (not 20) — display a minimal error if below 5.
- Persistent banner hydration: render nothing until mounted on the client, then read `localStorage`, `Date.now()`, `window`, and reminder state. Show nothing if no active reminder.
- First visit: no banner, no pressure, no score card visible.
- Sidebar score noise: keep Decision Score logic and storage active, but hide the large score card from the sidebar.
- Sidebar history noise: keep Action History logic, storage, metrics, and component available, but hide the sidebar block until the UI is cleaner.
- Settings hydration: read `localStorage` only on the client through `settingsStore`, apply saved appearance before the full home experience loads, and update live without page reload.

## 10. Files involved

- `app/page.tsx`
- `app/api/solve/route.ts`
- `app/journal/page.tsx`
- `components/DeferredHomeExperience.tsx`
- `components/HomeExperience.tsx`
- `components/DecisionConsole.tsx`
- `components/SimulationResults.tsx`
- `components/DecisionJournal.tsx`
- `components/PersistentActionBanner.tsx`
- `components/SettingsModal.tsx`
- `components/SettingsHydrator.tsx`
- `components/IdentityWidget.tsx` — exists, not rendered in sidebar; reserved for future profile/settings view
- `lib/settings.ts`
- `lib/settingsStore.ts`
- `locales/`
