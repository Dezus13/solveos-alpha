# Centralized Orchestration Engine

Дата: 2026-05-06  
Файл реализации: `lib/orchestration/orchestrationEngine.ts`

## Назначение

Centralized Orchestration Engine — это единый слой координации перед финальным синтезом ответа SolveOS. Его задача не заменить существующие intelligence-модули, а привести их к одному нормализованному контракту:

- какие intelligence-слои активны;
- какие подавлены;
- какой framing является главным;
- какой глубины должен быть ответ;
- какой уровень риска доминирует;
- какие приоритеты должен соблюдать финальный синтез.

До этого часть логики жила в отдельных модулях, а часть — внутри `app/api/solve/route.ts`. Новый слой создает один авторитетный coordination pass перед генерацией, чтобы модули не спорили между собой в prompt.

## Pipeline order

Оркестратор фиксирует следующий порядок стадий:

1. **Intent routing**  
   Сначала определяется, что пользователь вообще просит: обычное решение, review, red-team/risk/scenario mode, debug/literal/architect route, semantic intent family.

2. **Memory relevance**  
   Затем определяется, имеет ли история право участвовать в ответе: freshness, callback permission, durable patterns, narrative relevance.

3. **Identity relevance**  
   Далее применяется behavioral identity SolveOS: спокойный, полезный, без hype, без fake certainty, без performance tone.

4. **Pressure evaluation**  
   После этого учитывается session pressure: есть ли hesitation loop, нужно ли сжимать анализ и вести к действию.

5. **Execution evaluation**  
   Затем оценивается execution frame: пользователь готов действовать, перегружен, восстанавливается или показывает execution failure.

6. **Risk evaluation**  
   Потом оцениваются stakes, reversibility, impulsive risk, verification need, confidence behavior.

7. **Self-evaluation eligibility**  
   Решается, должен ли финальный ответ пройти один приватный quality pass.

8. **Response compression eligibility**  
   Последней проверяется необходимость короткого ответа, подавления структуры и удаления повторных диагностик.

## Activation model

Каждая intelligence activation имеет одинаковую структуру:

- `triggerConditions` — почему слой активировался;
- `ownedResponsibility` — что этот слой имеет право решать;
- `forbiddenOverlap` — куда ему нельзя залезать;
- `priorityScore` — насколько высоко он стоит в текущем запросе;
- `confidenceScore` — насколько надежен сигнал;
- `stage` — к какой стадии pipeline он относится.

Нормализованный результат возвращает:

- `activeIntelligences`;
- `suppressedIntelligences`;
- `primaryFrame`;
- `responseDepth`;
- `riskLevel`;
- `synthesisPriority`;
- `stageOrder`;
- `conflictNotes`.

## Conflict prevention

Оркестратор предотвращает не все возможные конфликты мира, а самые опасные для качества ответа:

- **Overload vs execution failure**  
  Если активны оба слоя, overload получает видимый framing. Execution failure может тихо информировать reasoning, но не должен дублировать вывод вида “ты не исполняешь”. Это предотвращает повторную диагностику одного и того же состояния.

- **Compression vs structured tooling**  
  Если ответ должен быть коротким, structured tooling подавляется. Нельзя одновременно просить модель “коротко и без структуры” и “используй tool mode/table/sections”.

- **Risk calibration vs session pressure**  
  Если high-stakes risk важнее hesitation pressure, риск получает приоритет. Нельзя давить на действие, когда главный frame — downside sizing или verification.

Правило философии: если два модуля ведут к одному видимому выводу, пользователь должен увидеть его один раз, через primary frame.

## Orchestration philosophy

SolveOS не должен звучать как набор конкурирующих внутренних систем. Пользователь должен получить один цельный ответ: ясный, плотный, честный и применимый.

Поэтому orchestration engine делает три вещи:

1. **Назначает ownership**  
   Каждый слой получает свою зону ответственности. Например, `risk-calibration` владеет downside/reversibility, но не pressure escalation.

2. **Выбирает главный frame**  
   Ответ не должен одновременно быть overload-reduction, risk-first, execution-first и pressure-managed. Один frame главный, остальные могут поддерживать его тихо.

3. **Ограничивает диагностический шум**  
   Модули могут заметить похожие сигналы, но финальный ответ не должен повторять одну мысль под разными названиями.

## Почему централизованная координация важна

Без центрального orchestration слоя новые intelligence-модули будут добавляться “рядом” с существующими. Это быстро приводит к проблемам:

- prompt получает слишком много равноправных директив;
- pressure может спорить с restraint;
- memory callbacks могут появляться там, где compression просит короткий ответ;
- risk calibration может конфликтовать с aggressive challenge;
- identity kernel может исправлять уже возникший drift вместо предотвращения его раньше.

Централизация делает систему расширяемой: новый модуль должен не просто добавить prompt instruction, а описать trigger, responsibility, forbidden overlap, priority и confidence. После этого orchestration layer решает, как он вписывается в общий ответ.

## Текущая интеграция

В `app/api/solve/route.ts` orchestration вызывается после:

- `arbitrateIntelligence`;
- `applyIdentityKernel`;
- `runSelfEvaluationStage`;
- вычисления финального `pressureLevel`.

Затем `buildOrchestrationInstruction()` добавляется в `conversationContext` перед финальной генерацией ответа.

Поведение существующих модулей не удалено и не переписано. Новый слой добавляет центральный coordination contract поверх уже существующих assessment-результатов.

