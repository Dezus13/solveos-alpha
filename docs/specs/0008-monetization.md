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

- FullResponse: the streamed text shown before the gate. Contains the verdict, reasoning, and next action. The full answer is shown freely.
- DecisionGate: UI component shown after the full response. Pre-unlock: deeper analysis paywall. Post-unlock: hidden motivation map + risk analysis + 24h commitment tracker.
- UnlockState: local React state (`isUnlocked: boolean`) per turn. Resets on page reload.
- PaymentSignal: a click on "Unlock full blueprint — €5" counts as a positive signal.

## 4. Flow (step-by-step)

1. User submits a decision.
2. API returns the full blueprint (unchanged).
3. `buildAssistantAnswer` produces the full useful answer:
   - Verdict (from `blueprint.recommendation`)
   - Reasoning (from `blueprint.diagnosis.coreProblem`)
   - Next action (from `blueprint.actionPlan.today` or `forcedAction`)
4. The full answer streams as the assistant message.
5. After streaming completes, `DecisionGate` renders below the message.
6. Pre-unlock state shows:
   - "Want to see what's actually driving this?"
   - "Unlock the hidden motivation map and 24h commitment tracker."
   - Button: "Unlock full blueprint — €5"
   - Helper text: "See what could break — before it does."
7. User clicks the button → `isUnlocked = true`.
8. Post-unlock state shows:
   - What you're avoiding (from `blueprint.hiddenPain`)
   - What could break (from `blueprint.skepticView.whatCouldBreak`)
   - `ExecutionPressure` component with 24h commitment button

## 5. What is NOT included (yet)

- No Stripe integration.
- No server-side payment validation.
- No user account or session tied to unlock state.
- No analytics event on unlock click — measure manually for now.
- Unlock state resets on page reload — intentional for this test phase.

## 6. Tone rules

- The paywall copy is direct, not apologetic.
- "Want to see what's actually driving this?" — curiosity, not accusation. The full answer is already given; this is genuinely optional depth.
- No "upgrade to premium", no feature comparison, no trial language.

## 7. Signal to watch

If users click "Unlock full blueprint — €5" consistently, the gate validates:
- Users receive real value from the free answer and want to go deeper.
- The framing ("hidden motivation map", "what could break") creates enough curiosity to motivate the click.
- €5 is an acceptable price point for supplementary depth, not just the verdict.

## 8. Next steps (if signal is positive)

- Add real Stripe checkout for €5 one-time unlock.
- Or add subscription: unlimited unlocks for €X/month.
- Track unlock rate per session and per decision type.

## 9. Files involved

- `components/DecisionConsole.tsx` — `DecisionGate` component
- `components/HomeExperience.tsx` — `buildAssistantAnswer` produces partial content
