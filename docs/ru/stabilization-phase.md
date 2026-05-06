# Stabilization Phase

Дата: 2026-05-06  
Файл правил: `lib/core/architectureRules.ts`

## Назначение

Stabilization phase — это режим защиты архитектуры SolveOS от uncontrolled intelligence growth. Его цель не добавить еще один умный слой, а зафиксировать правила, по которым новые intelligence-модули могут появляться без превращения системы в spaghetti pipeline.

Стабилизация отвечает на один вопрос: **можно ли расширять систему дальше, не ломая управление, память, синтез и наблюдаемость?**

## Architecture Stabilization

SolveOS уже имеет несколько слоев: intent, memory, arbitration, calibration, identity, self-evaluation, orchestration, synthesis, pipeline inspection. Без явных границ каждый новый модуль начинает частично повторять соседей:

- один слой определяет intent;
- другой тоже пытается выбрать route;
- третий меняет tone;
- четвертый добавляет предупреждения;
- пятый повторяет diagnosis другими словами.

Stabilization phase вводит deterministic validation helpers и system health report. Они не меняют финальный ответ пользователя напрямую. Они показывают, сохраняется ли архитектура управляемой.

## Complexity Management

Главная опасность SolveOS — не количество файлов само по себе, а скрытые связи между ними.

Плохой рост выглядит так:

- intelligence A напрямую вызывает intelligence B;
- response module сам решает final frame;
- memory используется без relevance gate;
- debug inspector начинает влиять на routing;
- self-evaluation запускает новый reasoning loop;
- несколько слоев одновременно считают себя владельцами synthesis.

Хороший рост выглядит так:

- модуль производит нормализованный signal;
- orchestration engine решает, активен ли signal;
- response synthesizer превращает активные signals в одну strategy;
- pipeline inspector только записывает события;
- architecture rules проверяют границы.

## Anti-Spaghetti Principles

1. **Один владелец маршрутизации**  
   Все routing decisions проходят через `orchestration-engine`.

2. **Один владелец финального синтеза**  
   `response-synthesizer` выбирает mode, tone, depth, compression и dominant frame.

3. **Intelligence-модули не вызывают друг друга**  
   Они могут быть источниками сигналов, но не должны становиться скрытыми координаторами.

4. **Memory не имеет прямого права на output**  
   Memory relevance проходит через controlled access: arbitration, decay, orchestration.

5. **Inspector пассивен**  
   `pipeline-inspector` может показать, что произошло, но не может менять ответ.

6. **Response modules deterministic**  
   Они работают от нормализованных contracts, а не от ad hoc side effects.

## Architecture Rules

### No intelligence may directly call another intelligence

Модуль `pressure-engine` не должен напрямую вызывать `energy-state-intelligence`, а `memory-decay` не должен напрямую вызывать `identity-kernel`.

Правильная схема:

```text
intelligence signal -> orchestration-engine -> activation/suppression -> response-synthesizer
```

Неправильная схема:

```text
pressure-engine -> energy-state-intelligence -> trust-calibration -> response instruction
```

### All routing must pass through orchestration engine

Любой route, priority, suppression или activation должен быть видим в `orchestrationEngine.ts`. Если модуль сам решает “я главный frame”, это architecture drift.

### Synthesis layer must stay centralized

`responseSynthesizer.ts` — единственный владелец:

- `selectedMode`;
- `finalTone`;
- `responseLength`;
- `dominantFrame`;
- `supportingFrames`;
- `suppressedFrames`;
- `compressionLevel`;
- `actionableFocus`.

Другие модули могут дать signal, но не финальную стратегию ответа.

### Memory access must be controlled

Memory может участвовать только если:

- есть relevance;
- freshness не провален;
- callback безопасен;
- orchestration разрешает memory-aware frame;
- synthesis не подавляет memory ради compression или safety.

### Pipeline inspector must remain passive

Inspector пишет timeline:

- `intent_detected`;
- `orchestration_started`;
- `architecture_health_checked`;
- `intelligence_suppressed`;
- `synthesis_selected`;
- `final_response_generated`.

Он не должен:

- менять priority;
- запускать intelligence;
- добавлять prompt instruction;
- переписывать response strategy;
- читать sensitive memory payloads.

### Response modules must stay deterministic

Response behavior должен быть результатом данных:

```text
orchestration result + active signals -> synthesis result -> final prompt instruction
```

Если response module начинает сам эвристически менять tone или depth, он нарушает centralized synthesis.

## Orchestration Safety

Orchestration safety означает, что система всегда может ответить на вопросы:

- почему intelligence активировался;
- почему другой intelligence подавлен;
- кто владеет primary frame;
- кто имеет право менять response depth;
- где был предотвращен duplicate diagnostic;
- есть ли риск recursive loop.

`lib/core/architectureRules.ts` добавляет проверки:

- `detectCircularOrchestration`;
- `detectDuplicatedResponsibility`;
- `detectConflictingSynthesisAuthority`;
- `detectUncontrolledEscalation`;
- `detectRecursiveOrchestrationLoops`.

## Intelligence Isolation

Каждый intelligence-модуль должен иметь:

- один owned responsibility;
- понятный trigger;
- forbidden overlap;
- deterministic output;
- отсутствие прямых вызовов других intelligence.

Пример допустимой изоляции:

```text
trust-calibration owns risk calibration.
It must not own urgency pressure, memory callbacks, or final response tone.
```

Пример нарушения:

```text
trust-calibration detects high risk, directly triggers pressure-engine,
then writes a warning style into final response.
```

В правильной архитектуре trust signal идет в orchestration, а synthesis решает, насколько заметным будет предупреждение.

## Dependency Boundaries

Разрешенные зависимости:

```text
route.ts -> intelligence modules
route.ts -> orchestration-engine
route.ts -> response-synthesizer
route.ts -> pipeline-inspector
orchestration-engine -> architectureRules
pipeline-inspector -> architectureRules types/report
```

Запрещенные зависимости:

```text
intelligence module -> intelligence module
pipeline-inspector -> response-synthesizer decisions
response-synthesizer -> memory store
self-evaluation -> orchestration-engine recursive call
memory module -> final response framing
```

## Architecture Health Scoring

System health report возвращает четыре оценки:

- `modularityScore` — насколько модули изолированы и не дублируют responsibility;
- `orchestrationComplexityScore` — насколько routing остается централизованным и без циклов;
- `synthesisStabilityScore` — есть ли только один владелец final synthesis;
- `pipelineSafetyScore` — безопасны ли memory access и passive inspection.

Также считается `overallScore` и статус:

- `stable` — архитектура чистая;
- `watch` — есть предупреждения или умеренное усложнение;
- `unstable` — есть critical issue или низкая общая оценка.

Пример debug output:

```json
{
  "status": "stable",
  "scores": {
    "modularityScore": 100,
    "orchestrationComplexityScore": 100,
    "synthesisStabilityScore": 100,
    "pipelineSafetyScore": 100,
    "overallScore": 100
  },
  "summary": "Architecture health is stable: 100/100 overall, 0 critical issue(s), 0 warning(s)."
}
```

## Integration

### Orchestration Engine

`orchestrationEngine.ts` создает `architectureHealth` через `buildSystemHealthReport()` и добавляет его в normalized orchestration result.

Важно: этот report не добавляется в пользовательский prompt как видимая инструкция. Он существует для стабилизации и observability, а не для изменения поведения ответа.

### Pipeline Inspector

`pipelineInspector.ts` добавляет событие:

```text
architecture_health_checked
```

Inspector сохраняет:

- status;
- scores;
- issue count;
- critical/warning counts;
- sanitized issue metadata.

Он остается passive: capture health report, but never enforce it during response generation.

## Future Scalability Rules

Перед добавлением нового intelligence-модуля нужно ответить:

1. Какой responsibility он владеет уникально?
2. Какой existing module он может дублировать?
3. Какие forbidden overlaps нужно явно записать?
4. Как orchestration engine будет активировать или подавлять его?
5. Может ли response synthesizer выразить его signal без нового mode?
6. Требуется ли memory access, и кто его контролирует?
7. Может ли он вызвать recursive orchestration или conflicting synthesis authority?
8. Как pipeline inspector покажет его решение без sensitive payloads?

Если на эти вопросы нет ответов, модуль не готов к добавлению.

## Stabilization Philosophy

SolveOS должен становиться глубже, а не шумнее. Централизация не запрещает новые intelligence-системы; она заставляет каждую новую систему войти в общий contract:

```text
signal -> orchestration -> synthesis -> output
```

Это защищает продукт от архитектурного расползания: меньше скрытых зависимостей, меньше повторных диагнозов, меньше конфликтующих тонов, больше предсказуемости.
