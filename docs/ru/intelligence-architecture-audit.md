# Аудит intelligence-архитектуры SolveOS

Дата: 2026-05-06  
Статус: архитектурный аудит, без изменения поведения.

## Цель

Этот документ фиксирует текущие intelligence-модули SolveOS перед добавлением новых функций. Главный вывод: система уже имеет центральный арбитраж (`lib/intelligenceArbitration.ts`), но вокруг него накопилось несколько параллельных слоев, которые независимо регулируют намерение, память, давление, глубину, уверенность, идентичность и формат ответа.

## Текущий runtime-порядок

Фактический порядок в `app/api/solve/route.ts` сейчас выглядит так:

1. Вход: чтение `problem`, языка, режима, `conversationHistory`, локальной conversation memory и user profile.
2. Предварительная маршрутизация: `detectSolveRequestIntent`, review mode, verdict loop recovery.
3. Память: `getDecisionHistory`, затем `assessMemoryDecay`.
4. Intent: `buildIntentInstruction` из `semantic-guards` и `assessIntent` / `buildIntentDifferentiationInstruction`.
5. Давление и flow-сигналы: session pressure, follow-up, response style, adaptive response, conversational flow, architecture, contradiction, tool mode, compression, execution capacity.
6. Restraint / energy / trust: сначала на decayed history, затем повторно внутри memory-enrichment блока.
7. Memory enrichment: memory graph context, network intelligence, calibration context, outcome learning, longitudinal memory, narrative intelligence, execution capacity with history.
8. Arbitration: `arbitrateIntelligence`.
9. Identity: `applyIdentityKernel`.
10. Self-evaluation: `runSelfEvaluationStage`.
11. Final assembly: инструкции собираются в `conversationContext`; memory/profile/calibration собираются в `fullContext`.
12. Output: streaming text или blueprint generation.
13. Post-processing: normalize blueprint, review hard routing, intent enforcement, benchmark calibration, profile adjustments, save decision.

Главная архитектурная проблема: шаги 5-7 содержат много самостоятельных регуляторов, а арбитраж получает только часть их состояния. Поэтому некоторые инструкции фильтруются контрактом, а некоторые попадают в финальный prompt независимо.

## Intelligence-related файлы

| Файл | Уникальная ответственность | Не должен делать | Возможные конфликты |
|---|---|---|---|
| `app/api/solve/route.ts` | Главный orchestrator solve-запроса: читает вход, вызывает intelligence-модули, собирает prompt/context, запускает engine, нормализует и сохраняет результат. | Не должен содержать новую доменную intelligence-логику как inline helper; не должен становиться вторым brain beside `lib/*`. | Конфликтует почти со всеми модулями, потому что внутри уже есть inline `Adaptive Response`, `Conversational Flow`, `Strategic Architecture`, `Contradiction`, `Tool Mode`, `Compression`. |
| `lib/engine.ts` | Исполнение LLM/LangGraph: language detection, streaming, council nodes, fallback, final generation. | Не должен решать routing, memory permission, pressure, identity или calibration. | Может конфликтовать с `prompts.ts` и `solve/route.ts`, если начнет добавлять свои поведенческие правила. |
| `lib/prompts.ts` | Базовые system/user prompts и глобальная иерархия инструкций. | Не должен владеть конкретными heuristics; должен только объявлять, как следовать уже собранным directives. | Конфликтует с `identityKernel`, `intelligenceArbitration`, `selfEvaluation`, если в нем появляются правила с другим приоритетом. |
| `lib/types.ts` | Общие контракты данных: blueprint, memory entries, response/request, calibration objects. | Не должен содержать поведение или inference. | Низкий риск; конфликт только при дублировании shape между local/server memory. |
| `lib/semantic-guards.ts` | Жесткая pre/post маршрутизация: literal/debug/architect bypass, review mode, verdict classes, verdict loop recovery, intent-specific hard overrides. | Не должен делать мягкую семантическую диагностику, tone calibration или response-depth routing. | Пересекается с `intentDifferentiation.ts` по intent family и с `intelligenceArbitration.ts` по intent ambiguity. |
| `lib/intentDifferentiation.ts` | Семантическая классификация intent family, mixed intent routing, diversity enforcement по framing/verdict. | Не должен принудительно менять final verdict после генерации; это зона `semantic-guards.ts`. | Дублирует intent family с `semantic-guards.ts`; пересекается с `restraintIntelligence.ts`, `energyStateIntelligence.ts`, `executionCapacity.ts` по overload/confusion/procrastination. |
| `lib/memory.ts` | Server-side decision memory: read/write `data/decisions.json` или remote KV, normalize entries, save snapshots, outcomes, reviews, search, graph/intelligence access. | Не должен решать, как именно память влияет на prompt, кроме tag extraction and normalized storage. | Пересекается с `savedDecisions.ts` localStorage и `actionReminders.ts` как другая память о решениях/действиях. |
| `lib/memoryDecay.ts` | Временное старение memory signals: half-life, stale suppression, callback permission, durable pattern preservation. | Не должен искать semantic relevance заново или генерировать narrative interpretation. | Пересекается с `restraintIntelligence.ts` по allowMemory, с `narrativeIntelligence.ts` / `longitudinalMemory.ts` по durable patterns, с `pressureEngine.ts` по stale pressure suppression. |
| `lib/memory-graph.ts` | Graph/network view of decision memory: edges, patterns, strategic memory score, relevant decisions, strategic context string. | Не должен управлять response pressure/depth или identity. | Дублирует pattern/score logic с `benchmarks.ts` и relevance logic с `memory.ts` / `memoryDecay.ts`. |
| `lib/benchmarks.ts` | Outcome-based calibration, network intelligence, domain benchmarks, score calibration, decision accuracy. | Не должен управлять prompt tone или user identity labels. | Пересекается с `trustCalibration.ts` и `profileEngine.ts`: все влияют на confidence/firmness. |
| `lib/outcomeLearning.ts` | Prompt instruction из прошлых outcomes: execution reliability, learning patterns, recent outcome summaries. | Не должен быть источником хранения outcomes; это `memory.ts`. Не должен показывать labels пользователю. | Пересекается с `benchmarks.ts`, `profileEngine.ts`, `executionCapacity.ts`, `userProfile.ts` по follow-through/accuracy. |
| `lib/longitudinalMemory.ts` | Долгосрочная память о high-signal life decisions: stage evolution, planning loops, commitments, cross-decision risk. | Не должен решать общий allowMemory; должен подчиняться arbitration/kernel gating. | Пересекается с `narrativeIntelligence.ts`, `memoryDecay.ts`, `executionCapacity.ts`. |
| `lib/narrativeIntelligence.ts` | Narrative continuity: recurring themes, directional drift, false resets, story pressure, narrative tags. | Не должен превращаться в personality/profile diagnosis; не должен ссылаться на историю без разрешения. | Пересекается с `longitudinalMemory.ts`, `identityKernel.ts`, `restraintIntelligence.ts`. |
| `lib/patternInsight.ts` | Client/local pattern insight from saved decisions. | Не должен становиться вторым server-side memory intelligence. | Пересекается с `memory-graph.ts`, `benchmarks.ts`, `userProfile.ts`. |
| `lib/savedDecisions.ts` | Client-side localStorage journal for saved decisions and status. | Не должен подменять server `memory.ts` как canonical outcome store. | Конфликтует с `memory.ts`, `userProfile.ts`, `HomeExperience.ts` local memory. |
| `lib/actionReminders.ts` | Client-side action pressure memory: pending actions, 2h/12h/24h states, blocker categories, smaller action reset. | Не должен управлять LLM session pressure напрямую; это prompt/runtime слой. | Конфликтует с `pressureEngine.ts`, `energyStateIntelligence.ts`, `userProfile.ts`, `identityEngine.ts`. |
| `lib/pressureEngine.ts` | Session-level hesitation pressure from recent conversation turns; builds pressure directive. | Не должен знать persistent action deadlines or identity score. | Дублирует pressure language with `actionReminders.ts`; регулируется `energyStateIntelligence.ts` and `intelligenceArbitration.ts`. |
| `lib/energyStateIntelligence.ts` | Operational state estimate: execution, hesitation, overload, exploration, recovery, impulsive, stable; adjusts pressure/pacing/depth/optionality. | Не должен independently emit final pressure if arbitration overrides it. | Сильно пересекается с `pressureEngine.ts`, `restraintIntelligence.ts`, `executionCapacity.ts`, route-level conversational flow. |
| `lib/restraintIntelligence.ts` | Решает, когда подавлять memory, pattern insight, contradiction, narrative, deep analysis. | Не должен сам становиться final arbiter; final gating должен идти через `intelligenceArbitration.ts`. | Пересекается с `memoryDecay.ts`, `identityKernel.ts`, `selfEvaluation.ts`, compression logic in route. |
| `lib/trustCalibration.ts` | Evidence/ambiguity/stakes calibration: confidence level, firmness, uncertainty behavior, verification. | Не должен post-process numeric blueprint score. | Пересекается с `benchmarks.ts` numeric calibration и `profileEngine.ts` confidence caps/verdict downgrades. |
| `lib/intelligenceArbitration.ts` | Центральный конфликт-резолвер: dominant state, pressure/depth/pacing, suppressions, allow flags. | Не должен заниматься low-level detection; должен принимать готовые assessments. | Конфликтует с route inline modules, которые не все проходят через его allow flags. |
| `lib/identityKernel.ts` | Stable behavioral core: anti-hype, anti-drift, pressure cap, max depth, tone invariants. | Не должен быть user identity/profile score. Это identity of SolveOS behavior, not identity of user. | Название конфликтует с `identityEngine.ts` / `userProfile.ts`; пересекается с `selfEvaluation.ts` по anti-fluff/fake certainty. |
| `lib/selfEvaluation.ts` | One-pass private quality check instruction: clarity, usefulness, restraint, pacing, anti-fluff. | Не должен запускать recursive revision или влиять на verdict/data post-processing. | Пересекается с `identityKernel.ts`, `prompts.ts`, route compression intelligence. |
| `lib/profileEngine.ts` | Deterministic user profile adjustments to blueprint: confidence, verdict downgrade, next move scope, profile note. | Не должен хранить profile or compute localStorage profile. | Конфликтует с `benchmarks.ts` post-score calibration and `trustCalibration.ts` firmness; final order сейчас делает profile последним. |
| `lib/userProfile.ts` | Client-side user profile store and updates: risk tolerance, execution score, bias patterns, decision score, labels. | Не должен генерировать LLM prompt directly except via passed profile data/context. | Пересекается с `identityEngine.ts`, `profileEngine.ts`, `savedDecisions.ts`. |
| `lib/identityEngine.ts` | Legacy/action-based identity signal helpers and label bridge to `userProfile`. | Не должен быть вторым source of truth для identity labels. | Часть logic устарела: `identityLabel(signals)` имеет labels, но `generateIdentityLabel()` уже делегирует `userProfile`. |
| `lib/executionCapacity.ts` | Execution capacity and sequencing: mode, overload signals, priority collision, sequencing errors, history backlog. | Не должен регулировать session pressure напрямую; должен отдавать capacity instruction only. | Пересекается с `energyStateIntelligence.ts`, `restraintIntelligence.ts`, `outcomeLearning.ts`, `longitudinalMemory.ts`. |
| `lib/inactionPain.ts` | Lightweight hidden cost/inaction phrasing helper. | Не должен стать отдельным pressure system. | Может конфликтовать с `pressureEngine.ts` и UI paywall/pressure copy if expanded. |
| `lib/i18n.ts` | Language detection and UI copy. | Не должен владеть intelligence routing beyond language. | Низкий риск; может конфликтовать only if language-specific prompts diverge from runtime directives. |
| `app/api/memory/route.ts` | Public memory API: history/search/similar/patterns/graph. | Не должен mutate intelligence behavior. | Depends on `memory.ts`; can expose graph/patterns that differ from solve-time decayed memory. |
| `app/api/outcomes/route.ts` | Outcome logging and pending review scheduling API. | Не должен compute broad calibration beyond verdict accuracy for outcome write. | Feeds `memory.ts`, `benchmarks.ts`, `outcomeLearning.ts`, profile UI through separate channels. |
| `app/api/benchmarks/route.ts` | Exposes network intelligence from `benchmarks.ts`. | Не должен create alternate calibration. | Risk if UI treats benchmark score as solve-time confidence source. |
| `app/api/reviews/route.ts` | Exposes due/pending reviews from memory. | Не должен decide review-mode output. | Related to `semantic-guards.ts` review detection and `memory.ts` pending review state. |
| `components/HomeExperience.tsx` | Client orchestration: thread persistence, request body, conversationMemory extraction, local outcome memory, streaming UI. | Не должен infer deep intelligence beyond compact local context; server should own final orchestration. | Large overlap with server memory/outcome learning; sends local conversation memory that can duplicate server history. |
| `components/DecisionConsole.tsx` | Chat input/output surface and streaming presentation. | Не должен own decision logic or pressure logic. | Low current risk; earlier pressure/gate behavior appears removed. |
| `components/DecisionBlueprint.tsx` | Blueprint display: diagnosis, evidence, calibration, risks, plans, trust layer. | Не должен recalculate intelligence. | Can visually overstate fields if multiple calibrations already modified the blueprint. |
| `components/IntelligenceRail.tsx` | Presentation rail for probabilities, risk, path, memory score. | Не должен be canonical intelligence. | Current labels may imply exact probabilities despite heuristic/generated inputs. |
| `components/JournalView.tsx` | Client decision journal and profile update on outcome status. | Не должен be the only outcome store if server memory exists. | Conflicts with `app/api/outcomes` / `memory.ts`; updates `userProfile` from local decisions. |
| `components/OutcomeLogger.tsx` | UI for server outcome logging and pending review. | Не должен update local profile unless explicitly synchronized. | Can diverge from `JournalView.tsx` local outcome/profile path. |
| `components/ActionHistory.tsx` | UI over `actionReminders` metrics and action history. | Не должен redefine execution score. | Related to `IdentityWidget.tsx`, `userProfile.ts`, `identityEngine.ts`. |
| `components/PersistentActionBanner.tsx` | UI pressure loop for pending actions and blocker reset. | Не должен affect LLM session pressure without explicit handoff. | Persistent pressure may conflict with `pressureEngine.ts` session pressure and `energyStateIntelligence.ts` recovery suppression. |
| `components/IdentityWidget.tsx` | UI for user decision score/identity label. | Не должен define labels; should read from `userProfile.ts`. | Name can be confused with `identityKernel.ts`; visual identity score can conflict with behavioral identity kernel language. |
| `components/MemoryGraphPanel.tsx` | Visualizes memory graph/patterns. | Не должен decide prompt memory. | May display patterns that solve-time `memoryDecay` suppresses. |
| `components/SimulationResults.tsx` | Presents result/blueprint simulation. | Не должен compute intelligence. | Low risk; relies on normalized blueprint. |
| `components/WarRoomDashboard.tsx` | Presents council/debate style intelligence. | Не должен own council truth. | Can conflict if `engine.ts` council metrics are heuristic but UI reads them as real agent consensus. |
| `components/EnterpriseDashboard.tsx` | Dashboard surface for broader intelligence metrics. | Не должен feed solve-time routing unless explicitly wired. | Potential overlap with benchmark/network/memory displays. |
| `components/AgentEngine.tsx` | UI/visual agent simulation surface. | Не должен be confused with runtime `lib/engine.ts`. | Naming conflict with actual engine; presentation can imply real agents beyond current heuristics. |

## Дублированная и пересекающаяся логика

1. **Intent routing is split in two.**  
   `semantic-guards.ts` owns hard verdict enforcement and also imports `classifyIntentFamily` from `intentDifferentiation.ts`. `intentDifferentiation.ts` owns richer semantic intent, confidence, mixed routing and response diversity. Result: intent family affects both pre/post verdict and prompt instruction, but only part of it is visible to arbitration.

2. **Pressure exists at three levels.**  
   `pressureEngine.ts` scores hesitation in the current session. `actionReminders.ts` creates persistent 2h/12h/24h action pressure. `energyStateIntelligence.ts` lowers or raises pressure by operational state. `intelligenceArbitration.ts` then creates a final pressure governor. These should be explicitly separated as session pressure, commitment pressure, and pressure governor.

3. **Confidence/calibration is duplicated.**  
   `trustCalibration.ts` calibrates qualitative confidence before generation. `benchmarks.ts` recalibrates numeric blueprint score after generation. `profileEngine.ts` then applies user-profile caps and verdict downgrades after benchmark calibration. This order is defensible, but the ownership is not obvious and the names all sound like “calibration.”

4. **Memory has multiple stores.**  
   `memory.ts` is server/KV/file memory. `savedDecisions.ts`, `actionReminders.ts`, and `userProfile.ts` are client localStorage stores. `HomeExperience.tsx` also builds conversation memory and local outcome learning from those stores. This creates parallel histories that can disagree.

5. **History interpretation is fragmented.**  
   `memory-graph.ts`, `benchmarks.ts`, `outcomeLearning.ts`, `longitudinalMemory.ts`, `narrativeIntelligence.ts`, `executionCapacity.ts`, and `memoryDecay.ts` all interpret decision history. They are not identical, but several compute relevance, unresolved loops, performance patterns, or stale signals independently.

6. **Restraint/compression/anti-fluff appears in several places.**  
   `restraintIntelligence.ts`, `selfEvaluation.ts`, `identityKernel.ts`, `prompts.ts`, and route-level `buildCompressionIntelligenceInstruction` all suppress over-analysis, generic phrasing, and excessive structure. This is useful, but it should have one final owner.

7. **Identity naming is ambiguous.**  
   `identityKernel.ts` is the identity of SolveOS behavior. `identityEngine.ts` / `userProfile.ts` are user behavior identity. `profileEngine.ts` adjusts recommendations from user profile. The word “identity” currently names two different domains.

8. **Execution capacity overlaps with energy and outcome learning.**  
   `executionCapacity.ts` detects overload, recovering, executing, scaling, sequencing errors and backlog. `energyStateIntelligence.ts` detects overload/recovery/execution/impulsive. `outcomeLearning.ts` detects follow-through patterns. These should feed one execution assessment or be more clearly layered.

9. **Route-level inline intelligence hides architecture.**  
   `buildAdaptiveResponseInstruction`, `buildConversationalFlowInstruction`, `buildStrategicArchitectureInstruction`, `buildContradictionIntelligenceInstruction`, `buildStrategicToolInstruction`, `buildFirstResponseQualityInstruction`, and `buildCompressionIntelligenceInstruction` live inside `app/api/solve/route.ts`. They are real intelligence modules but are not visible as separate files.

## Что объединить, упростить или оставить отдельно

### Объединить

- Move route-level inline intelligence builders into `lib/responseFlowIntelligence.ts` or split into small modules. `solve/route.ts` should orchestrate, not contain detection logic.
- Merge `semantic-guards` intent-family hard routing with `intentDifferentiation` through one public intent contract:
  - `requestIntent`: literal/debug/architect/normal.
  - `decisionIntent`: contrarian/capital/conditional/standard.
  - `semanticFamily`: procrastination/fear/etc.
  - `confidence`: high/medium/low.
- Consolidate memory relevance into one `MemoryContextAssessment` that includes decay, relevance, callback permission, and allowed memory products.
- Rename or merge user identity surfaces:
  - Keep `identityKernel.ts` for SolveOS behavior.
  - Rename `identityEngine.ts` to something like `actionIdentitySignals.ts` or fold it into `userProfile.ts`.

### Упростить

- Make pressure layering explicit:
  - `pressureEngine.ts`: session hesitation only.
  - `actionReminders.ts`: commitment deadline state only.
  - `energyStateIntelligence.ts`: operational modifier only.
  - `intelligenceArbitration.ts`: only final pressure governor.
- Reduce duplicate anti-fluff instructions by letting `identityKernel.ts` define invariants and `selfEvaluation.ts` enforce one-pass cleanup. Route compression should focus only on length/format, not global style.
- Avoid running restraint/energy/trust twice unless memory enrichment materially changes inputs. If the rerun is intentional, document it as “pre-memory assessment” and “memory-enriched assessment.”

### Оставить отдельно

- Keep `trustCalibration.ts` and `benchmarks.ts` separate. One is qualitative pre-generation confidence behavior; the other is outcome-based numeric post-processing.
- Keep `memoryDecay.ts` separate from `memory.ts`. Storage and temporal signal aging are different responsibilities.
- Keep `identityKernel.ts` separate from `profileEngine.ts`. SolveOS behavioral identity and user behavioral profile should not be coupled.
- Keep `selfEvaluation.ts` separate, but only as a final bounded quality gate.
- Keep UI components separate from intelligence. They may display scores and histories, but should not own inference.

## Рекомендуемый чистый orchestration order

Target pipeline:

1. **Input**  
   Normalize request: problem, language, mode, conversation history, client memory payload, user profile payload.

2. **Intent**  
   One intent contract:
   - request intent: literal/debug/architect/normal.
   - mode intent: review/red-team/risk/scenarios/strategy.
   - decision intent: contrarian/capital/conditional/standard.
   - semantic family and confidence.
   Hard bypasses happen here. No memory or pressure decisions yet.

3. **Memory**  
   Read canonical history, merge allowed client memory carefully, apply decay, compute relevance, outcome learning, longitudinal/narrative candidates. Output a single memory assessment with:
   - decayed history.
   - memory products.
   - callback permission.
   - stale pressure suppression.
   - relevance confidence.

4. **Arbitration**  
   Feed intent, memory assessment, restraint, energy, pressure, trust, contradiction/narrative/compression candidates into one arbitration contract. This is the only place that decides:
   - dominant state.
   - pressure governor.
   - depth.
   - pacing.
   - allowMemory / allowNarrative / allowContradiction / allowStructuredTool.
   - suppressions.

5. **Calibration**  
   Apply qualitative trust calibration after arbitration has chosen depth/pressure, because confidence behavior depends on final stakes/ambiguity. Numeric benchmark calibration remains post-generation.

6. **Identity**  
   Apply SolveOS identity kernel after arbitration/calibration to cap tone drift, pressure excess, depth excess, hype, fake certainty and theatrical language. User profile should not live here; it should be a separate profile adjustment stage.

7. **Self-evaluation**  
   Add exactly one bounded private quality pass based on the final arbitration + identity contract. It should enforce clarity, compression, signal density and identity compliance only.

8. **Output**  
   Build final prompt/context, generate streaming answer or blueprint, normalize output, enforce hard routing, apply numeric calibration, apply user profile deterministic adjustments, save memory.

## Proposed final responsibility map

| Stage | Primary owner | Supporting modules |
|---|---|---|
| Input | `app/api/solve/route.ts` | `i18n.ts`, `types.ts` |
| Intent | `semantic-guards.ts` + `intentDifferentiation.ts` under one contract | review routing tests |
| Memory | `memory.ts` + `memoryDecay.ts` | `memory-graph.ts`, `outcomeLearning.ts`, `longitudinalMemory.ts`, `narrativeIntelligence.ts` |
| Arbitration | `intelligenceArbitration.ts` | `restraintIntelligence.ts`, `energyStateIntelligence.ts`, `pressureEngine.ts`, `executionCapacity.ts` |
| Calibration | `trustCalibration.ts` before generation; `benchmarks.ts` after generation | `profileEngine.ts` as final user-profile modifier |
| Identity | `identityKernel.ts` | `selfEvaluation.ts` |
| Self-evaluation | `selfEvaluation.ts` | `identityKernel.ts`, arbitration contract |
| Output | `engine.ts`, `prompts.ts`, `solve/route.ts` normalization | UI display components |

## Architecture risks before adding features

- Adding another module directly to `solve/route.ts` will increase hidden orchestration debt.
- Adding another memory source without canonical merge rules will widen local/server divergence.
- Adding another pressure or identity rule without routing it through arbitration will make behavior harder to predict.
- Adding another confidence adjustment without documenting order will make final scores feel unstable.
- Adding UI intelligence labels can expose internal labels that prompts explicitly tell the model not to reveal.

## Recommended next cleanup before new features

1. Extract inline route intelligence builders into `lib/responseFlowIntelligence.ts`.
2. Introduce a single `IntentContract` type and make both hard routing and semantic intent write into it.
3. Introduce a single `MemoryAssessment` type that wraps decay, relevance, graph context, outcome learning, longitudinal and narrative candidates.
4. Rename user identity modules to avoid collision with `identityKernel`.
5. Document post-processing order as fixed:
   - normalize blueprint.
   - review/intent hard enforcement.
   - benchmark numeric calibration.
   - user profile deterministic adjustment.
   - save memory.

