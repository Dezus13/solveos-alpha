# Productization Phase

Дата: 2026-05-06  
UI слой: `components/dashboard/ArchitectureDashboard.tsx`

## Назначение

Productization phase переводит внутреннюю архитектуру SolveOS в видимый интерактивный AI product experience. Цель не просто иметь orchestration, synthesis, explainability и pipeline inspector внутри системы, а показать их пользователю как понятный слой доверия.

Главный переход:

```text
internal AI architecture -> visible AI operations console
```

Пользователь должен видеть, что SolveOS не просто “ответил”, а прошел управляемый pipeline: intent, memory, arbitration, synthesis, safety, output.

## AI Productization

AI productization означает упаковку intelligence-систем в UX:

- скрытая orchestration logic становится timeline;
- priority arbitration становится выбранным intelligence;
- suppressed modules становятся объяснимыми rejected signals;
- confidence breakdown становится readable metrics;
- system health становится operational indicator;
- pipeline inspector становится debug surface;
- explainability становится trust layer.

Это не раскрытие hidden prompts. Это визуализация decision metadata.

## Architecture To UX Transition

Архитектура SolveOS теперь имеет видимый продуктовый слой:

```text
orchestrationEngine
  -> priorityArbitration
  -> explainabilityReport
  -> responseSynthesizer
  -> pipelineInspector
  -> ArchitectureDashboard
```

Dashboard читает безопасный pipeline report:

- `decisions.orchestrationPriority`;
- `decisions.priorityArbitration`;
- `decisions.explainability`;
- `decisions.synthesis`;
- `systemHealth`;
- `events`.

Он не вызывает intelligence-модули напрямую и не меняет response synthesis.

## Visible Intelligence Systems

Dashboard показывает:

- selected intelligence;
- suppressed intelligences;
- confidence metrics;
- arbitration result;
- pipeline stages;
- reasoning trace;
- latency metrics;
- architecture health score.

Пример selected intelligence:

```json
{
  "winningIntelligence": "risk-calibration",
  "why": "risk-calibration won with CRITICAL priority and weighted score 84."
}
```

Пример suppressed intelligence:

```json
{
  "id": "session-pressure",
  "suppressedBy": "risk-calibration",
  "reason": "Risk outranks urgency when downside sizing is primary."
}
```

## Interactive Explainability

Dashboard имеет четыре режима:

1. **Normal mode**  
   Показывает health, orchestration flow, selected intelligence, latency и response authority.

2. **Debug mode**  
   Добавляет suppressed intelligences и confidence metrics.

3. **Explainability mode**  
   Показывает reasoning trace: arbitration, synthesis, escalation triggers.

4. **Pipeline mode**  
   Показывает timeline событий pipeline inspector.

Переключатели не меняют backend behavior. Они только меняют видимость безопасного debug metadata.

## Trust-Oriented UI

Trust-oriented UI отвечает на вопросы:

- какая система выиграла;
- почему она выиграла;
- какие сигналы были подавлены;
- насколько стабильна архитектура;
- какой response mode выбран;
- где был применен compression или risk handling;
- сколько времени занял pipeline.

Важно: доверие строится не через “магическую уверенность”, а через наблюдаемость ограничений.

## Debug UX

Debug UX должен быть полезен инженеру и понятен продуктовой команде:

- timeline показывает event order;
- panels показывают normalized decisions;
- confidence bars показывают signal strength;
- health score показывает architecture stability;
- suppressed list показывает conflict prevention.

Debug UX не должен:

- раскрывать hidden prompts;
- показывать raw chain-of-thought;
- dump memory payloads;
- позволять inspector изменять routing.

## Enterprise AI Visibility

Enterprise layout нужен для более плотной операционной видимости:

- больше health sub-scores;
- больше suppressed modules;
- полная pipeline timeline;
- synthesis authority details;
- explainability trace.

Это важно для enterprise AI, где покупатель хочет видеть:

- governance;
- auditability;
- safety boundaries;
- deterministic modules;
- architecture health;
- model behavior traceability.

## Orchestration Visualization

Dashboard использует animated orchestration flow:

```text
input -> intent -> memory -> arbitration -> synthesis -> output
```

Когда SolveOS обрабатывает запрос, стадии мягко анимируются как live flow. После получения inspector report dashboard переключается с running state на конкретные pipeline stages.

## Real-Time Pipeline Inspector UI

Во время streaming ответа dashboard показывает live state:

```text
Pipeline is collecting live signals
```

Когда debug-enabled JSON response доступен, dashboard показывает реальные inspector events:

- `intent_detected`;
- `orchestration_started`;
- `priority_arbitration_completed`;
- `explainability_report_generated`;
- `synthesis_selected`;
- `final_response_generated`.

Текущая интеграция получает real inspector data через advanced analysis request с `debugPipeline: true`.

## System Health Indicators

Architecture health panel показывает:

- overall score;
- modularity score;
- orchestration complexity score;
- synthesis stability score;
- pipeline safety score;
- status: stable/watch/unstable.

Пример:

```json
{
  "status": "stable",
  "overallScore": 100,
  "modularityScore": 100,
  "synthesisStabilityScore": 100
}
```

## Compact And Enterprise Layouts

### Compact

Compact layout оптимизирован для постоянного присутствия рядом с чатом:

- health;
- flow;
- selected intelligence;
- latency;
- response authority.

### Enterprise

Enterprise layout раскрывает больше operational деталей:

- all health sub-scores;
- confidence metrics;
- suppressed modules;
- reasoning trace;
- pipeline inspector events.

Переключение layout находится в dashboard header.

## UI Boundaries

Dashboard является presentation layer:

```text
allowed:
  read safe pipeline report
  visualize orchestration
  display explainability metadata
  show health scores

forbidden:
  call intelligence modules
  modify orchestration result
  change synthesis strategy
  expose hidden prompts
  display raw memory payloads
```

## Russian UI Explanation

Dashboard можно объяснять пользователю так:

```text
Это операционная панель SolveOS. Она показывает, какие внутренние AI-системы участвовали в ответе, какая система получила приоритет, какие сигналы были подавлены, и насколько стабильна архитектура ответа.
```

Для enterprise:

```text
Это слой наблюдаемости и доверия: governance, routing, arbitration, synthesis и safety visible в одном интерфейсе.
```

## Product Philosophy

SolveOS должен ощущаться не как чат-бот, а как decision operating system. Для этого intelligence должен быть не только мощным, но и видимым:

```text
answer quality + operational transparency = product trust
```

Productization phase делает архитектуру частью продукта, а не только внутренней инженерной системой.
