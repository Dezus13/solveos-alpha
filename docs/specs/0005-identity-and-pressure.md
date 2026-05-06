# 0005 Identity Engine And Pressure Layer

## 1. Purpose

- Define the Identity Engine.
- Define the Pressure Layer.
- Define the Session Pressure System (in-session hesitation detection and tone escalation).
- Define Narrative Intelligence (long-range continuity, directional shifts, false resets, and story-pressure reduction).
- Define Restraint Intelligence (thresholding for insight, memory, complexity, interpretation, and response depth).
- Define Energy State Intelligence (operational readiness calibration for pressure, pacing, depth, and optionality).
- Define Intelligence Arbitration (central conflict resolution and final response contract).
- Define Trust Calibration (evidence, ambiguity, stakes, uncertainty, and recommendation firmness calibration).
- Define Memory Decay (signal aging, stale context suppression, and durable pattern preservation).

## 2. Where it is used

- Decision console follow-up.
- Persistent action banner.
- Home summary lines.
- User profile updates.
- AI prompt construction (session pressure directive injected per turn).
- AI prompt construction (narrative directive injected per turn when high-signal history exists).
- AI prompt construction (restraint directive injected per turn and used as the governor for other intelligence layers).
- AI prompt construction (energy directive injected per turn and used to calibrate pressure intensity and response rhythm).
- AI prompt construction (arbitration directive injected first and used as the final coordination layer).
- AI prompt construction (trust calibration directive injected per turn and used by arbitration).
- AI prompt construction (memory decay directive injected per turn and used by arbitration/history modules).

## 3. Main objects

- UserState: behavior record after Action outcomes.
- Identity Engine: system that turns UserState into identity feedback.
- Pressure Layer: system that reacts to delay based on elapsed time.
- Session Pressure System: detects in-session hesitation from conversation history and escalates AI tone.
- IdentityLabel: short behavior label for the user.
- DecisionScore: score based on follow-through.
- PressureState: current urgency level of a pending Action.
- PressureLine: message shown based on PressureState.
- SessionPressureLevel: 0 (normal) | 1 (pressure) | 2 (confrontational) — computed from conversation history per request.
- HesitationSignal: detected avoidance pattern in user messages (hedging language, short follow-ups, multiple questions, repeated turns).
- NarrativeSignal: recurring long-range theme, directional drift, false reset, stability issue, or dramatic-change pressure detected from conversation and decision memory.
- RestraintSignal: simple ask, confirmation, factual question, reassurance, emotional overload, high stakes, ambiguity, tradeoff, or weak memory relevance.
- EnergyState: operational estimate of `EXECUTION`, `HESITATION`, `OVERLOAD`, `EXPLORATION`, `RECOVERY`, `IMPULSIVE`, or `STABLE`.
- ArbitrationContract: final internal response contract containing dominant state, pressure, depth, suppressions, pacing, reasoning intensity, and exploration allowance.
- TrustCalibration: internal calibration of evidence quality, ambiguity, stakes, confidence, recommendation firmness, and uncertainty behavior.
- MemoryDecayAssessment: per-turn decayed history view, freshness score, temporal windows, callback gate, and stale pressure suppression.
- ActionStatus: `pending`, `done`, `blocked`, or `skipped`.
- BlockerCategory: reason the user did not act (`fear`, `unclear`, `lazy`, `external`).

## 4. Pressure States and Retention Loop

| State         | Trigger         | Banner shown            | Message shown                      |
|---------------|-----------------|-------------------------|------------------------------------|
| normal        | 0–2 hours       | Minimal strip (subdued) | —                                  |
| pressure_2h   | 2–12 hours      | Amber banner            | "Still not done?"                  |
| pressure_12h  | 12–24 hours     | Orange banner           | "You are avoiding this"            |
| overdue       | 24+ hours       | Red banner              | "You missed your deadline. Why?"   |

### Retention Loop via Open Commitments

SolveOS keeps the user's unfinished commitment visible at all times. There are no external notifications — the pressure is entirely internal.

**Normal state (0–2h)**: A very minimal strip at `top-0` shows:
- A small muted accent dot
- The action text, truncated, in subdued color
- A "Done" text button (muted, no border emphasis)

This strip signals "you have something open" without creating urgency. Calm but persistent.

**Re-entry behavior**: When the user opens the app with no thread and an active action exists, `DecisionConsole` replaces `EmptyState` with `OpenCommitmentView`:
- Shows the pressure-appropriate message (changes with elapsed time)
- Shows the action text
- Shows remaining time (for pressure_2h and beyond)
- Done button: marks complete, shows "Done. / Next?" for 2s, then clears

**Completion**: Marking Done anywhere (banner strip, `OpenCommitmentView`, or inline in a conversation turn) dispatches `ACTION_REMINDER_EVENT`. All surfaces update immediately. The banner briefly shows "Done." — no celebration, no streak language.

**What does NOT happen**: No celebration animations, no reward language, no gamification, no push notifications, no external reminders of any kind.

## 5. Overdue Behavior

1. Banner turns red.
2. Header shows: "You missed your deadline. Why?"
3. System shows "Why not done?" with four category buttons:
   - Fear
   - Not clear
   - No energy
   - Blocked externally
4. User picks a category.
5. System generates a smaller action (client-side, no API).
6. User sees the smaller action and can choose "I'll do this now".
7. System resets the same ActionReminder to the smaller action with a fresh 24h clock.

## 6. Blocker Categories and Smaller Actions

| Category | Smaller action prefix                |
|----------|--------------------------------------|
| fear     | "5 minutes only: {action}"           |
| unclear  | "Write what is unclear about: {action}" |
| lazy     | "First step only: {action}"          |
| external | "Name what is blocking: {action}"    |

## 6a. Identity Feedback System

The Identity Feedback System turns the score into a behavioral label and shows it in the sidebar. It is not a game. It is not a reward. It is a mirror.

### What is shown

- **Behavior Score**: score / 100, displayed as a number with a thin progress bar.
- **Identity label**: one of the four confrontational labels derived from the score.
- **Progress bar color**: reflects score range — rose (0–39), amber (40–69), emerald (70+).

### Where it is shown

- Not shown in the main UI. The score and label are internal behavior data only.
- `components/IdentityWidget.tsx` exists and is functional but is not rendered in the sidebar. It is available to place in a profile or settings view in a future iteration.

### Tone rules

- Do NOT celebrate. No congratulations, no streaks, no badges.
- Do NOT soften. "You avoid decisions" is correct. Do not euphemize it.
- The label is a statement of current behavior, not a permanent identity.
- The score changes on every action event — it is live, not historical.

### Live update mechanism

`IdentityWidget` listens to `PROFILE_UPDATED_EVENT`. Any action that changes the score (`done`, `skip`, `overdue`) dispatches this event. The widget re-reads the profile and updates the score and label without a page reload.

### Score triggers (connected systems)

| Event               | Delta | Dispatcher                                   |
|---------------------|-------|----------------------------------------------|
| Action marked done  | +5    | `updateDecisionScoreOnActionCompletion()`    |
| Action skipped      | −5    | `updateDecisionScoreOnActionSkip()`          |
| Action overdue      | −10   | `updateDecisionScoreOnActionOverdue()`       |

The overdue penalty is applied once per action via `overdueScorePenaltyApplied` flag to prevent double-deduction.

## 7. Logic (step-by-step)

1. System reads ActionStatus.
2. System counts completed Actions.
3. System counts skipped and delayed Actions.
4. Identity Engine creates identity label.
5. User chooses Done.
6. Score increases.
7. User does not act — time elapses.
8. Pressure Layer escalates PressureState at 2h, 12h, 24h thresholds.
9. At overdue: show category buttons → generate smaller action → reset clock.

## 8. Stored data

- userDecisionScore: follow-through score.
- decisionScoreTrend: score direction.
- totalDecisions: number of tracked decisions.
- status: ActionStatus used by Identity Engine.
- completedAt: proof of follow-through.
- skippedAt: proof of avoidance.
- blockerCategory: selected blocker category when action was not done.
- smallerAction: reduced action generated after blocker category is picked.

## 9. Edge cases

- No Action history: show default identity.
- Many skipped Actions: show avoidance identity.
- Overdue Action: show red banner and category buttons.
- Missing profile: use default profile.
- Browser storage blocked: keep UI usable.

## 10. Session Pressure System

Detects hesitation within a single conversation session and escalates the AI response tone. No UI change — pressure is expressed through the AI's language only.

### Hesitation signals (detected from user messages)

| Signal | Score added |
|---|---|
| 4+ turns without resolution | +4 |
| 3 turns without resolution | +2 |
| 2nd turn | +1 |
| 2+ hedging phrases in last message | +3 |
| 1 hedging phrase in last message | +2 |
| Seeking more analysis instead of deciding | +2 |
| Short follow-up (<45 chars) | +1 |
| 2+ questions in one message | +2 |

### Pressure levels

| Level | Score threshold | Mode | AI tone |
|---|---|---|---|
| 0 | 0–2 | Normal | Standard analysis |
| 1 | 3–6 | Pressure | Verdict-first, one risk, one action, no hedging |
| 2 | 7+ | Confrontational | Cost of inaction first, one sentence verdict, mirror tone |

### Session pressure is computed per request

- `computeSessionPressureLevel(conversationHistory)` runs in `app/api/solve/route.ts` on every POST.
- Skipped for Review mode (review analysis should not be confrontational).
- `buildPressureDirective(level)` returns a string injected into `conversationContext` alongside `intentInstruction` and `diversityInstruction`.
- `sessionPressureLevel` is included in the API response for future UI use.

### Stored data

- No additional storage. Pressure is derived from `conversationHistory` sent with each request.

## 11. Narrative Intelligence

Narrative Intelligence makes SolveOS respect continuity across time without adding a storytelling UI.

### What it detects

| Signal | Meaning | Response effect |
|---|---|---|
| Recurring themes | Reinvention, escape, recovery, rebuilding, direction search, scaling pressure, avoidance, instability | Advice acknowledges the underlying direction quietly and sequences the next move |
| Directional drift | Examples: startup -> relocation, discipline -> burnout, planning -> paralysis | Ask what changed before endorsing the new direction |
| False reset | User acts as if prior failures, plans, constraints, or timelines disappeared | Restore continuity calmly and ask what is materially different |
| Direction instability | Many new directions or inspiration inputs without sustained execution | Reduce expansion advice and simplify to one execution lane |
| Dramatic-change pressure | Big-move fantasies, all-or-nothing framing, romanticized transformation | Shift toward stable leverage, compounding, consistency, and operational calm |

### Memory priority

High-signal narrative memories are tagged internally with `narrative:*` tags when they involve major turning points, emotional pivots, repeated ambitions, failures, recoveries, or long-term unfinished pursuits.

Low-signal chatter, generic moods, and trivial events are not given narrative tags.

### Tone rules

- No storytelling UI.
- No therapist language.
- Never say "your narrative", "your arc", "identity pattern", "behavior profile", or "character arc".
- Use at most one continuity reference per answer.
- The answer should feel like a calm advisor remembers the trajectory, not like the app is profiling the user.

## 12. Restraint Intelligence

Restraint Intelligence prevents SolveOS from maximizing analysis on every turn.

### What it gates

| Gate | Suppressed when signal is weak |
|---|---|
| Insight threshold | Strategic observations, pattern recognition, contradiction notices, narrative references |
| Memory restraint | Prior decisions, prior conversation memory, longitudinal references, narrative continuity |
| Advice restraint | Frameworks, long explanations, excessive structure, repeated advisor cadence |
| Interpretation restraint | Mood, identity, motive, emotion, personality, hidden intent |
| Complexity threshold | Deep strategic analysis, leverage framing, multi-section synthesis |

### Restraint levels

| Level | Trigger | Response effect |
|---|---|---|
| minimal | Simple question, confirmation, factual ask, reassurance, overload, known answer | Direct answer, one practical point, no memory or pattern commentary |
| normal | Moderate decision with no major ambiguity | Useful answer with only the reasoning needed |
| deep | High stakes, meaningful ambiguity, multi-option tradeoff, explicit analysis request | Deeper analysis allowed, but still no sprawl or fake certainty |

### Runtime behavior

- `assessRestraint()` runs in `app/api/solve/route.ts` after decision history is loaded.
- The route withholds memory, longitudinal, narrative, contradiction, first-response insight, strategic architecture, and structured tool directives when restraint does not allow them.
- `RESTRAINT INTELLIGENCE` is injected before other conversation directives so it acts as the governor.
- Calibration and scoring can still run internally, but visible memory references are suppressed when memory relevance is weak.

### Tone rules

- No fake psychological certainty.
- No profiler, therapist, life guru, or motivational influencer language.
- Short answers are allowed.
- Not every response needs a lesson, insight, reframing, or optimization.
- Prefer grounded realism, quiet precision, and useful clarity.

## 13. Energy State Intelligence

Energy State Intelligence is operational calibration, not emotion detection. It adjusts pressure, pacing, depth, and optionality based on inferred execution energy.

### States

| State | Response adaptation |
|---|---|
| `EXECUTION` | Concise, direct, action-first, less reflection |
| `HESITATION` | Less theory, more decisiveness, clearer tradeoffs |
| `OVERLOAD` | Lower complexity, narrower scope, no option explosion, stabilize first |
| `EXPLORATION` | Broader thinking and comparative framing allowed |
| `RECOVERY` | No pressure escalation, no "push harder"; re-entry simplicity |
| `IMPULSIVE` | Slower pacing, downside risk, verification before commitment |
| `STABLE` | Balanced strategic reasoning |

### Signals

- Response length and short operational asks.
- Repetition and unresolved loops.
- Urgency spikes.
- Rapid topic switching.
- Reassurance seeking.
- Optimization loops.
- Commitment language.
- Action reporting.
- Unfinished plans and restart cycles from memory.
- Strategic patience signals such as validation-first language.

### Runtime behavior

- `assessEnergyState()` computes probabilistic state scores and a confidence delta.
- Low-confidence estimates collapse toward `STABLE` and may suppress the directive entirely.
- Energy assessment provides pressure, pacing, depth, and optionality inputs to the arbitration layer.
- `ENERGY STATE INTELLIGENCE` is injected after restraint and before memory/strategy directives.

### Safety rules

- Never mention the inferred state, score, or signals to the user.
- No medical framing, diagnosis language, therapy tone, or mental-health labels.
- Never emotionally steer, dependency-build, induce urgency, exaggerate stakes, or create artificial confidence.

## 14. Intelligence Arbitration

Intelligence Arbitration is the central coordination layer above restraint, energy, pressure, memory, narrative, contradiction, architecture, and tool-mode directives.

It does not detect new user traits. It resolves conflicts between existing systems and produces the final internal response contract.

### Priority categories

| Priority | Signals |
|---|---|
| `CRITICAL` | overload, impulsive risk, severe contradiction, execution collapse, recovery |
| `HIGH` | hesitation, repeated unresolved loops, strategic conflict |
| `MEDIUM` | exploration, narrative continuity, response compression, execution readiness |
| `LOW` | stylistic optimization, formatting adaptation |

### Override rules

- Overload suppresses deep analysis, option expansion, aggressive challenge, and optimization stacking.
- Impulsive risk suppresses hype amplification, high-certainty recommendations, rapid escalation, and option expansion.
- Execution readiness suppresses excessive caution, long exploratory branches, and option expansion.
- Recovery or execution collapse suppresses pressure escalation, optimization stacking, deep analysis, and aggressive challenge.
- Minimal restraint suppresses memory references, narrative continuity, contradiction challenges, and formatting flourish.

### Governors

| Governor | Output |
|---|---|
| Pressure | `MINIMAL`, `LOW`, `MODERATE`, `HIGH` |
| Depth | `short`, `medium`, `deep` |
| Pacing | `slow`, `steady`, `fast` |
| Reasoning intensity | `minimal`, `focused`, `expanded` |
| Exploration allowance | `none`, `limited`, `open` |

### Temporal stability

- The arbitration layer smooths rapid changes using recent conversation turns.
- Strong repeated overload keeps overload dominant.
- Repeated execution language can keep execution readiness dominant over compression.
- Repeated exploration language can keep exploration dominant unless a critical signal appears.

### Runtime behavior

- `arbitrateIntelligence()` runs after restraint, energy, and history-enriched directives are computed.
- The route uses the arbitration contract, not individual modules, to decide final memory, narrative, contradiction, architecture, tool-mode, and first-response permissions.
- The pressure directive is built from the arbitration pressure output.
- `INTELLIGENCE ARBITRATION` is injected first in `conversationContext`.

### Safety

- The arbitration contract remains internal only.
- No manipulative escalation.
- No fake certainty.
- No pseudo-psychology.
- No emotional steering or dependency framing.

## 15. Trust Calibration

Trust Calibration is a calibration layer used by arbitration. It decides how firm the recommendation should be based on evidence, ambiguity, and stakes.

It does not create visible labels and should never produce phrases like "confidence level", "trust calibration", or "my certainty is".

### Internal levels

| Dimension | Values |
|---|---|
| Confidence | `LOW`, `MEDIUM`, `HIGH` |
| Evidence quality | `weak`, `adequate`, `strong` |
| Ambiguity | `low`, `medium`, `high` |
| Stakes | `low`, `medium`, `high` |
| Recommendation firmness | `soft suggestion`, `clear recommendation`, `strong recommendation`, `caution-first recommendation` |

### Uncertainty behavior

| Confidence | Behavior |
|---|---|
| `LOW` | Avoid strong claims. Ask one useful question or give a safe provisional answer. |
| `MEDIUM` | State the best assumption, give a practical next step, and mention the key uncertainty briefly. |
| `HIGH` | Be direct, avoid unnecessary hedging, and give a decisive next move. |

### Stakes awareness

High-stakes topics include money, legal, health, family, career, and major business risk. For these, Trust Calibration reduces fake certainty, surfaces downside, and recommends verification when needed.

### Arbitration integration

- Low confidence can reduce pressure and suppress high-certainty recommendations.
- High-stakes caution can reduce rapid escalation and hype amplification.
- Recommendation firmness is included in the arbitration contract.
- The final answer should sound natural: "I would treat this as a working assumption", "This is enough to make the next move", or "I would not bet heavily on this yet."

## 16. Memory Decay And Signal Aging

Memory Decay prevents stale conversational states and outdated decision context from dominating future responses.

It does not delete stored decisions. It creates a decayed per-turn view of history for reasoning and arbitration.

### Half-life classes

| Decay speed | Signals |
|---|---|
| Fast | emotional urgency, temporary hesitation, short-term overload, transient excitement |
| Medium | exploration themes, tactical goals, active projects, execution pacing |
| Slow | long-term goals, repeated behavioral loops, strategic contradictions, recurring decision patterns |

### Temporal windows

| Window | Meaning |
|---|---|
| short-term | recent signals that can strongly influence current pacing |
| medium-term | active projects and tactical context |
| long-term | durable patterns only; old temporary states fade unless repeated |

### Runtime behavior

- `assessMemoryDecay()` computes freshness with half-life weighting.
- Fast-decay stale signals are suppressed.
- Recent recovery or execution evidence reduces old pressure influence.
- Durable repeated patterns can survive even when older.
- The route passes `decayedHistory` into memory, outcome learning, longitudinal memory, narrative, execution capacity, energy, restraint, and trust modules.
- Arbitration uses memory decay to suppress stale callbacks and expired pressure patterns.

### Callback restraint

- Historical references should be rare.
- High relevance only.
- Naturally woven.
- Never surveillance-like.
- Do not lock the user into old patterns if current evidence shows recovery, execution, or changed constraints.

## 17. Files involved

- `lib/identityEngine.ts`
- `lib/userProfile.ts`
- `lib/actionReminders.ts`
- `lib/pressureEngine.ts` — session pressure detection and directive building
- `lib/narrativeIntelligence.ts` — long-range continuity and narrative pressure directive building
- `lib/restraintIntelligence.ts` — insight, memory, interpretation, and complexity thresholding
- `lib/energyStateIntelligence.ts` — operational energy calibration and pressure scaling
- `lib/intelligenceArbitration.ts` — central conflict resolution and final orchestration contract
- `lib/trustCalibration.ts` — evidence, ambiguity, stakes, and firmness calibration
- `lib/memoryDecay.ts` — signal aging, decayed history view, freshness gates, and callback restraint
- `app/api/solve/route.ts` — pressure level computed and injected per request
- `components/DecisionConsole.tsx`
- `components/IdentityWidget.tsx`
- `components/PersistentActionBanner.tsx`
- `components/HomeExperience.tsx`
