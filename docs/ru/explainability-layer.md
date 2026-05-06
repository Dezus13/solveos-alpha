# Explainability Layer

Дата: 2026-05-06  
Файл реализации: `lib/core/explainabilityEngine.ts`

## Назначение

Explainability layer делает reasoning pipeline SolveOS наблюдаемым без раскрытия hidden prompts, raw chain-of-thought или sensitive memory payloads.

Его задача — показать не “внутренние мысли модели”, а безопасную decision trace:

- какой intelligence выбран;
- какие intelligences отклонены;
- почему routing пошел именно так;
- какой confidence breakdown был у победителя;
- какой arbitration outcome получился;
- какие synthesis decisions сформировали финальную стратегию;
- какие escalation triggers были замечены;
- какие pipeline snapshots доступны для debugging.

Философия:

```text
explain decisions, not hidden reasoning
```

## Explainable Orchestration

Orchestration становится explainable, когда каждый этап можно восстановить как metadata:

```text
input -> intent -> memory -> arbitration -> calibration -> identity -> self-evaluation -> synthesis -> output
```

Explainability report фиксирует:

- `routingPath` — порядок стадий;
- `selectedIntelligence` — кто выиграл priority arbitration;
- `rejectedIntelligences` — кто был подавлен;
- `arbitrationOutcome` — почему победитель получил precedence;
- `escalationTriggers` — что подняло risk/priority/escalation pressure.

Пример:

```json
{
  "selectedIntelligence": "risk-calibration",
  "routingPath": [
    "intent routing",
    "memory relevance",
    "identity relevance",
    "pressure evaluation",
    "execution evaluation",
    "risk evaluation",
    "self-evaluation eligibility",
    "response compression eligibility"
  ],
  "escalationTriggers": [
    "high risk level",
    "risk-calibration critical priority"
  ]
}
```

## Transparent Routing

Transparent routing означает, что route не спрятан в prompt wording. Он представлен как структурированный результат:

```text
candidate intelligences
  -> weighted priority
  -> conflict checks
  -> dominant intelligence
  -> suppressed modules
  -> primary frame
```

Если `overload-intelligence` подавляет `execution-failure`, report показывает:

```json
{
  "id": "execution-failure",
  "suppressedBy": "overload-intelligence",
  "reason": "overload-intelligence has higher synthesis precedence; execution-failure is suppressed to reduce duplicated or conflicting framing."
}
```

Пользователь не видит эти labels в обычном ответе. Debug pipeline может увидеть их безопасно.

## Reasoning Visibility

Reasoning visibility в SolveOS — это visibility of decisions, not visibility of hidden thoughts.

Разрешено показывать:

- выбранный route;
- confidence score;
- weighted score;
- frame selection;
- synthesis mode;
- compression level;
- suppression reason;
- safety policy.

Запрещено показывать:

- hidden prompts;
- raw model chain;
- full conversation payload;
- sensitive memory;
- API keys, tokens, credentials;
- private prompt instructions.

## Intelligence Traceability

Каждый intelligence trace имеет понятную судьбу:

1. **Selected**  
   Получил dominant authority in arbitration.

2. **Active**  
   Прошел routing и может поддерживать ответ.

3. **Merged**  
   Совместим с победителем, но не владеет response authority.

4. **Rejected / suppressed**  
   Подавлен threshold, conflict prevention или instability filter.

Диаграмма:

```text
intent-router ─────┐
identity-kernel ───┼──> orchestration -> primaryFrame
risk-calibration ──┘          |
                              v
                    responseSynthesizer
                              |
                              v
                            output

execution-failure --suppressed by--> overload-intelligence
```

## Synthesis Transparency

После orchestration synthesis layer добавляет:

- `selectedMode`;
- `finalTone`;
- `responseLength`;
- `dominantFrame`;
- `supportingFrames`;
- `suppressedFrames`;
- `compressionLevel`;
- `actionabilityScore`;
- `contradictionFiltering`.

Пример:

```json
{
  "selectedMode": "analytical",
  "finalTone": "analytical-clear",
  "responseLength": "medium",
  "dominantFrame": "risk-first",
  "compressionLevel": "medium",
  "contradictionFiltering": "allow-if-central"
}
```

Это показывает, как orchestration result стал response strategy, не раскрывая текст hidden prompt.

## Confidence Explainability

Explainability report включает confidence breakdown победителя:

```json
{
  "confidence": 82,
  "stability": 78,
  "semanticRelevance": 78,
  "riskLevel": 86,
  "escalationPressure": 76
}
```

Смысл полей:

- `confidence` — надежность signal;
- `stability` — устойчивость signal;
- `semanticRelevance` — связь с текущим запросом;
- `riskLevel` — вес downside/safety;
- `escalationPressure` — насколько signal пытается усилить вмешательство.

## Arbitration Trace

Arbitration trace отвечает на вопросы:

- кто выиграл;
- почему выиграл;
- кто подавлен;
- какие conflicts были найдены;
- какие signals можно merge;
- какой `synthesisPrecedence` передан дальше.

Пример:

```json
{
  "winningIntelligence": "response-compression",
  "why": "response-compression won with HIGH priority and weighted score 76.",
  "synthesisPrecedence": [
    "response-compression",
    "identity-kernel"
  ],
  "conflicts": [
    {
      "modules": ["response-compression", "structured-tooling"],
      "dominantIntelligence": "response-compression",
      "suppressedIntelligences": ["structured-tooling"]
    }
  ]
}
```

## Pipeline Observability

Pipeline trace snapshots показывают timeline без unsafe payloads:

```json
[
  {
    "stage": "orchestration",
    "summary": "Primary frame risk-first; 3 active, 8 suppressed."
  },
  {
    "stage": "priority arbitration",
    "summary": "risk-calibration won with CRITICAL priority and weighted score 84."
  },
  {
    "stage": "response synthesis",
    "summary": "Mode analytical; tone analytical-clear; compression medium."
  }
]
```

Inspector добавляет событие:

```text
explainability_report_generated
```

Оно включает только sanitized metadata.

## Debug Modes

### compact

Минимальный report:

- selected intelligence;
- первые rejected intelligences;
- routing path;
- arbitration outcome;
- compact snapshots.

Используется по умолчанию в orchestration integration.

### verbose

Расширенный report:

- полный список rejected intelligences;
- synthesis decisions;
- visualization nodes/edges;
- all standard snapshots.

Используется после response synthesis.

### full reasoning trace

Максимальный безопасный trace:

- все decision metadata;
- safety filtering snapshot;
- explicit policy: hidden prompts excluded, raw chain exposure excluded.

Важно: даже `full-reasoning-trace` не раскрывает private chain-of-thought. Это “full explainability trace”, а не raw thought transcript.

## Safety Filtering

Explainability engine фильтрует поля с ключами:

```text
prompt
secret
token
password
authorization
credential
cookie
session
raw
payload
conversation
memory
content
problem
history
chain
```

Если такой ключ появляется в debug object, значение заменяется:

```text
[filtered]
```

Пример:

```json
{
  "hiddenPromptsExcluded": true,
  "rawReasoningExcluded": true,
  "sensitivePayloadsExcluded": true
}
```

## Orchestration Visualization Objects

Visualization object состоит из:

```json
{
  "nodes": [
    {
      "id": "risk-calibration",
      "kind": "active",
      "label": "risk-calibration",
      "score": 84
    },
    {
      "id": "session-pressure",
      "kind": "suppressed",
      "label": "session-pressure",
      "score": 68
    }
  ],
  "edges": [
    {
      "from": "risk-calibration",
      "to": "risk-first",
      "relation": "routes-to"
    },
    {
      "from": "risk-calibration",
      "to": "session-pressure",
      "relation": "suppresses"
    }
  ]
}
```

Эти объекты можно использовать для debug UI, logs или future inspector panels.

## Integration

### Orchestration Engine

`orchestrationEngine.ts` генерирует compact explainability report после priority arbitration и system health report.

Он показывает:

- routing path;
- selected intelligence;
- rejected intelligences;
- arbitration outcome;
- escalation triggers.

### Response Synthesizer

`responseSynthesizer.ts` обновляет explainability до verbose report, добавляя synthesis decisions:

- selected mode;
- tone;
- response length;
- compression;
- contradiction filtering;
- actionability score.

### Pipeline Inspector

`pipelineInspector.ts` сохраняет sanitized summary:

- selected intelligence;
- rejected count;
- routing path;
- arbitration outcome;
- synthesis decisions;
- escalation triggers;
- visualization node/edge count;
- safety policy.

Inspector остается passive: он объясняет pipeline, но не меняет output.

## Philosophy

Explainability in SolveOS must improve trust without exposing unsafe internals.

Плохая прозрачность:

```text
show raw hidden reasoning
leak prompts
dump memory
expose private chain
```

Хорошая прозрачность:

```text
show what was selected
show what was rejected
show confidence and routing
show synthesis decisions
show safety filtering
```

Итог:

```text
transparent enough to debug, filtered enough to remain safe
```
