# 0008 Monetization

## 1. Purpose

- Test willingness to pay before building real payment infrastructure.
- Gate the final verdict and next action behind a fake unlock.
- Measure: does the user click "Unlock decision — €5"?

## 2. Where it is used

- Every assistant turn that contains a blueprint.
- Shown in the chat area after the partial pressure response streams.
- No new page. No Stripe. No checkout.

## 3. Main objects

- PartialResponse: the streamed text shown before the gate. Contains the problem diagnosis and what the user is avoiding. Does NOT include the verdict or next action.
- DecisionGate: UI component shown after the partial response. Pre-unlock: paywall block. Post-unlock: verdict + next action + 24h commitment.
- UnlockState: local React state (`isUnlocked: boolean`) per turn. Resets on page reload.
- PaymentSignal: a click on "Unlock decision — €5" counts as a positive signal.

## 4. Flow (step-by-step)

1. User submits a decision.
2. API returns the full blueprint (unchanged).
3. `buildAssistantAnswer` produces only the partial content:
   - "The decision: [coreProblem]"
   - "What you're avoiding: [hiddenPain or keyRisks]"
4. The partial content streams as the assistant message.
5. After streaming completes, `DecisionGate` renders below the message.
6. Pre-unlock state shows:
   - "You're still avoiding the decision."
   - "Unlock the verdict + exact next step."
   - Button: "Unlock decision — €5"
7. User clicks the button → `isUnlocked = true`.
8. Post-unlock state shows:
   - Verdict (from `blueprint.recommendation`)
   - Do this next (from `blueprint.actionPlan.today` or `forcedAction`)
   - `ExecutionPressure` component with 24h commitment button

## 5. What is NOT included (yet)

- No Stripe integration.
- No server-side payment validation.
- No user account or session tied to unlock state.
- No analytics event on unlock click — measure manually for now.
- Unlock state resets on page reload — intentional for this test phase.

## 6. Tone rules

- The paywall copy is direct, not apologetic.
- "You're still avoiding the decision." — this is a pressure statement, not a sales line.
- No "upgrade to premium", no feature comparison, no trial language.

## 7. Signal to watch

If users click "Unlock decision — €5" consistently, the gate validates:
- Users perceive the verdict as valuable enough to pay for.
- The partial response creates enough tension to motivate action.
- €5 is an acceptable price point to test.

## 8. Next steps (if signal is positive)

- Add real Stripe checkout for €5 one-time unlock.
- Or add subscription: unlimited unlocks for €X/month.
- Track unlock rate per session and per decision type.

## 9. Files involved

- `components/DecisionConsole.tsx` — `DecisionGate` component
- `components/HomeExperience.tsx` — `buildAssistantAnswer` produces partial content
