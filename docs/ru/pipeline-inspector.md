# Pipeline Inspector

Дата: 2026-05-06  
Файл реализации: `lib/debug/pipelineInspector.ts`

## Назначение

Pipeline Inspector — это внутренний observability layer для AI reasoning pipeline SolveOS. Он нужен не для изменения ответа, а для безопасного понимания того, как система пришла к финальной стратегии:

- какой intent был обнаружен;
- какие intelligences активировались;
- какие intelligences были подавлены;
- какой primary frame выбрал orchestration;
- какой mode выбрал response synthesis;
- какая глубина, risk level и compression level применены;
- какие duplicate-prevention или conflict-prevention правила сработали.

По умолчанию inspector выключен.

## Почему observability важна

SolveOS теперь состоит из нескольких coordination layers:

1. intent detection;
2. memory decay and relevance;
3. restraint / energy / trust;
4. arbitration;
5. identity kernel;
6. orchestration;
7. response synthesis;
8. self-evaluation;
9. final output generation.

Без прозрачного debug layer поведение становится трудно проверять: ответ может выглядеть коротким, осторожным или прямым, но непонятно, какой слой это решил. Inspector делает pipeline видимым без раскрытия hidden prompts, API keys, raw memory payloads или пользовательской истории.

## Как включается debug mode

Debug mode отключен по умолчанию.

Он может включаться двумя путями:

- env flag: `SOLVEOS_PIPELINE_DEBUG=true` или `SOLVEOS_PIPELINE_DEBUG=1`;
- request flag: `debugPipeline: true` в теле `/api/solve`.

Для обычных JSON-ответов redacted report добавляется в:

```json
{
  "debug": {
    "pipeline": {}
  }
}
```

Для streaming-ответов structured report не добавляется в текстовый stream. Вместо этого route пишет redacted report во внутренний server log и добавляет безопасный header:

```text
X-SolveOS-Pipeline-Inspector: enabled
```

## Timeline events

Inspector пишет события в timeline-style формате:

- `intent_detected`
- `orchestration_started`
- `intelligence_activated`
- `intelligence_suppressed`
- `orchestration_completed`
- `synthesis_selected`
- `compression_applied`
- `contradiction_filtered`
- `duplicate_prevention_triggered`
- `final_response_generated`

Каждое событие содержит:

- `name`
- `stage`
- `timestamp`
- `decisions`
- `reasoningMetadata`
- `suppressionMetadata`

## Structured output

Report содержит:

- `pipelineStages` — стадии, которые реально прошли;
- `timestamps` — начало и завершение;
- `decisions.detectedIntent`;
- `decisions.activatedIntelligences`;
- `decisions.suppressedIntelligences`;
- `decisions.orchestrationPriority`;
- `decisions.synthesis`;
- `reasoningMetadata`;
- `suppressionMetadata`;
- `duplicatePreventionTriggers`;
- `events`.

Это дает достаточно информации для debugging без необходимости читать hidden prompt или memory context.

## Safe redaction

Inspector никогда не должен раскрывать:

- API keys;
- secrets;
- tokens;
- passwords;
- authorization headers;
- cookies;
- hidden prompts;
- raw memory payloads;
- raw conversation content;
- raw history/context payloads.

Redaction rules применяются по ключам. Любые поля, похожие на `apiKey`, `secret`, `token`, `authorization`, `prompt`, `memory`, `conversation`, `content`, `problem`, `raw`, `payload`, `history`, `context`, заменяются на безопасные placeholders.

Пример:

```json
{
  "problem": "[redacted-payload]",
  "conversationHistory": "[redacted-payload]",
  "apiKey": "[redacted-secret]"
}
```

## Anti-black-box philosophy

SolveOS не должен быть black box для разработчика. Но transparency не означает раскрытие chain-of-thought, hidden prompts или личной истории пользователя.

Правильный уровень наблюдаемости:

- какие routing decisions произошли;
- какие modules активны;
- какие modules suppressed;
- почему выбран response mode;
- какие safeguards включились;
- где применены compression или contradiction filtering.

Неправильный уровень наблюдаемости:

- полный prompt;
- сырая память;
- приватный self-evaluation текст;
- пользовательские сообщения целиком;
- секреты окружения.

## Safe inspection principles

1. **Metadata over payloads**  
   Сохранять решения и scores, не сохранять raw text.

2. **Redaction before output**  
   Все значения проходят redaction до попадания в report.

3. **Debug disabled by default**  
   Никакой debug-информации в обычном ответе.

4. **No hidden prompt exposure**  
   Inspector показывает, какие стратегии выбраны, но не раскрывает hidden prompt content.

5. **No memory dumps**  
   Memory может быть видна как `memoryCallbackAllowed=true`, но не как список пользовательских memories.

6. **Streaming safety**  
   Streaming response остается текстовым ответом. Structured debug не смешивается с user-facing stream.

## Где интегрирован

Pipeline Inspector интегрирован в:

- `app/api/solve/route.ts` — создание inspector, intent capture, final response capture, debug output;
- `lib/orchestration/orchestrationEngine.ts` — orchestration started/completed, activated/suppressed intelligences, duplicate prevention triggers;
- `lib/synthesis/responseSynthesizer.ts` — selected synthesis mode, compression, contradiction filtering.

Inspector не меняет поведение pipeline. Он только наблюдает за уже принятыми решениями.

