# Intelligence Priority System

Дата: 2026-05-06  
Файл реализации: `lib/core/intelligencePriority.ts`

## Назначение

Intelligence Priority System — это слой weighted governance для SolveOS. Он решает, какие intelligence-сигналы получают право влиять на ответ, какие остаются supporting signals, а какие подавляются, чтобы не создавать конфликтный framing.

Этот слой не заменяет orchestration engine и не заменяет response synthesis. Его роль уже:

```text
intelligence signals -> priority arbitration -> orchestration result -> response synthesis -> output
```

То есть priority system определяет вес и конфликтность сигналов, orchestration выбирает response frame, а synthesis формирует единую стратегию ответа.

## Priority Hierarchy

Система использует пять уровней приоритета:

1. **CRITICAL**  
   Сигналы, которые могут изменить главный frame ответа: high-stakes risk, hard route override, overload, identity drift.

2. **HIGH**  
   Сильные сигналы, которые обычно получают видимое влияние, если не конфликтуют с CRITICAL: execution failure, compression, pressure level 2.

3. **NORMAL**  
   Полезные рабочие сигналы: execution readiness, normal pressure, standard semantic routing.

4. **LOW**  
   Поддерживающие сигналы, которые не должны забирать response authority: narrative continuity, contradiction check, structured tooling.

5. **PASSIVE**  
   Сигналы, которые должны работать почти незаметно: private self-evaluation, observability, quality pass.

Принцип: высокий priority не означает автоматическую видимость. Он означает право участвовать в arbitration. Финальная видимость все равно проходит через synthesis.

## Confidence Scoring

Каждый intelligence получает breakdown:

- `confidence` — насколько надежен сам signal;
- `stability` — насколько signal устойчив, а не случайная вспышка;
- `semanticRelevance` — насколько он относится к текущему запросу;
- `riskLevel` — насколько сильна downside/safety component;
- `escalationPressure` — насколько signal пытается поднять срочность, жесткость или вмешательство.

Weighted score считается из:

```text
basePriorityScore
+ priority level weight
+ confidence
+ stability
+ semantic relevance
+ risk level
+ escalation pressure
```

Это защищает систему от двух ошибок:

- слабый, но громкий signal не должен захватывать ответ;
- важный high-risk signal не должен потеряться среди обычных stylistic preferences.

## Weighted Routing

Weighted routing делает три шага:

1. **Normalize**  
   Каждый intelligence signal получает priority level, confidence breakdown и weighted score.

2. **Suppress unstable routing**  
   Если confidence или stability слишком низкие, signal подавляется до visible response. Он может оставаться metadata, но не должен управлять framing.

3. **Sort by synthesis precedence**  
   Активные signals сортируются по weighted score. Первый становится dominant intelligence. Остальные либо поддерживают его, либо подавляются при конфликте.

Пример:

```json
{
  "winningIntelligence": "overload-intelligence",
  "why": "overload-intelligence won with CRITICAL priority and weighted score 86.",
  "confidenceBreakdown": {
    "confidence": 86,
    "stability": 78,
    "semanticRelevance": 78,
    "riskLevel": 72,
    "escalationPressure": 76
  }
}
```

## Arbitration Strategy

Arbitration engine выполняет:

- `detect intelligence conflicts`;
- `select dominant intelligence`;
- `merge compatible outputs`;
- `suppress unstable routing`;
- `reduce synthesis chaos`.

Конфликт возникает, если:

- один signal явно перечислил другой в `conflictsWith`;
- responsibility одного signal попадает в forbidden overlap другого;
- два signals претендуют на один visible conclusion.

Совместимость возникает, если:

- один signal перечислен в `compatibleWith`;
- он может поддерживать dominant intelligence без владения response authority.

## Conflict Resolution

### Overload vs execution failure

Если активны оба:

```text
overload-intelligence
execution-failure
```

Побеждает более сильный weighted signal. В типичном overload-сценарии `overload-intelligence` подавляет `execution-failure`, потому что пользователь не должен услышать два диагноза одного состояния: “ты перегружен” и “ты не исполняешь”.

Правильный output:

```text
Сначала уменьшаем нагрузку. Один следующий шаг.
```

Неправильный output:

```text
Ты перегружен, у тебя execution failure, проблема в дисциплине, давай сделаем полный план.
```

### Compression vs structured tooling

Если response-compression активен, structured-tooling может быть подавлен.

Причина:

```text
короткий ответ и сложная структура часто конфликтуют
```

### Risk calibration vs session pressure

Если risk-calibration сильнее pressure, система не должна подталкивать к действию раньше downside sizing.

Правильный порядок:

```text
risk -> reversibility -> verification -> action
```

Неправильный порядок:

```text
urgency -> action -> late warning
```

## Response Authority

Priority arbitration не пишет финальный ответ. Она отвечает только за governance:

- кто выиграл;
- почему выиграл;
- какие signals подавлены;
- какие можно merge как supporting;
- какой порядок synthesis precedence.

Response authority остается централизованным:

```text
responseSynthesizer.ts owns final mode, tone, length, dominant frame, suppressed frames
```

Это важно: даже CRITICAL intelligence не должен сам писать style или prompt. Он дает signal; synthesis решает, как этот signal выразить.

## Synthesis Precedence

`synthesisPrecedence` — это отсортированный список активных signals:

```json
[
  "risk-calibration",
  "identity-kernel",
  "response-compression"
]
```

Synthesis использует этот порядок как подсказку:

- главный frame идет первым;
- supporting frames не спорят с первым;
- suppressed frames не возвращаются через wording;
- warnings не stack-ятся;
- emotional calibration не превращается в recursive reassurance.

## Escalation Control

Escalation pressure измеряет, насколько signal пытается усилить срочность, жесткость, предупреждение или вмешательство.

Примеры high escalation:

- high-stakes legal/medical/financial risk;
- impulsive action state;
- severe overload;
- identity drift, который может сломать SolveOS tone.

Правило:

```text
high escalation must win only through weighted arbitration, not through direct module authority
```

Это защищает систему от uncontrolled escalation, где несколько модулей одновременно начинают давить на пользователя.

## Pipeline Inspector Visibility

Pipeline inspector показывает debug visualization:

- `winningIntelligence`;
- `why`;
- `confidenceBreakdown`;
- `synthesisPrecedence`;
- `mergedIntelligences`;
- `conflicts`;
- `suppressedModules`.

Пример:

```json
{
  "winningIntelligence": "response-compression",
  "why": "response-compression won with HIGH priority and weighted score 76.",
  "suppressedModules": [
    {
      "id": "structured-tooling",
      "suppressedBy": "response-compression",
      "reason": "response-compression has higher synthesis precedence; structured-tooling is suppressed to reduce duplicated or conflicting framing.",
      "weightedScore": 51
    }
  ]
}
```

Inspector остается passive. Он показывает arbitration, но не меняет routing.

## Architecture Explanation

Новая архитектурная граница:

```text
individual intelligence module:
  produces signal

intelligencePriority:
  scores, compares, suppresses, merges

orchestrationEngine:
  builds normalized orchestration result

responseSynthesizer:
  creates final response strategy

pipelineInspector:
  records sanitized decisions
```

Запрещено:

```text
intelligence module -> final response authority
intelligence module -> another intelligence module
pipeline inspector -> routing decision
priority arbitration -> visible user wording
```

Разрешено:

```text
priority arbitration -> dominant signal
priority arbitration -> suppressed modules
priority arbitration -> synthesis precedence
orchestration -> normalized result
synthesis -> coherent final strategy
```

## Почему это снижает chaos

Без weighted arbitration новые modules начинают конкурировать через prompt wording. Это создает:

- повторные диагностики;
- stacked warnings;
- tone drift;
- over-analysis;
- conflicting next actions;
- hidden escalation.

Priority system переводит конкуренцию из prompt в deterministic governance. Модули больше не “кричат громче”. Они получают score, проходят conflict resolution и только потом попадают в synthesis.

Итоговая философия:

```text
many signals, one authority, one response
```
