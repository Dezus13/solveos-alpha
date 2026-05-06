# Centralized Response Synthesis

Дата: 2026-05-06  
Файл реализации: `lib/synthesis/responseSynthesizer.ts`

## Назначение

Centralized Response Synthesis — это финальный слой перед генерацией ответа SolveOS. Orchestration решает, какие intelligence-системы активны и какие подавлены. Synthesis превращает этот результат в одну coherent response strategy:

- выбранный response mode;
- финальный тон;
- длина ответа;
- dominant frame;
- supporting/suppressed frames;
- actionable focus;
- advisory intensity;
- emotional pressure;
- compression level;
- contradiction filtering;
- safeguards против повторов и распада framing.

Цель слоя — не добавить еще одну диагностику, а собрать уже выбранные сигналы в один ответ, который звучит цельно.

## Почему orchestration alone недостаточно

Orchestration отвечает на вопрос: “Какие системы должны говорить, а какие молчать?”  
Synthesis отвечает на другой вопрос: “Как должен звучать финальный ответ, если эти системы уже отобраны?”

Без synthesis даже хороший orchestration может оставить слишком много конкурирующих стилей:

- risk-first просит осторожность;
- execution-first просит действие;
- compression просит коротко;
- memory-aware просит continuity;
- identity kernel просит спокойный anti-hype tone.

Если эти требования просто сложить в prompt, ответ может получиться фрагментированным. Synthesis выбирает один режим и переводит supporting frames в ограниченную роль.

## Response modes

Synthesis поддерживает семь response modes:

- `fast-direct` — быстрый прямой ответ, минимум структуры, действие впереди.
- `strategic` — стандартный SolveOS-режим: frame, tradeoff, risk, next move.
- `reflective` — аккуратная continuity/memory-aware стратегия без surveillance эффекта.
- `containment` — режим перегруза: меньше анализа, стабилизация, один маленький шаг.
- `execution` — операторский режим: next action, owner, timebox, stop condition.
- `analytical` — risk/verification режим: downside, reversibility, threshold.
- `motivational-light` — легкая поддержка движения без hype, identity labels или театральности.

Mode выбирается из `primaryFrame`, `riskLevel`, `responseDepth` и активных intelligence-сигналов.

## Как формируется coherent response

Synthesis делает последовательность решений:

1. **Primary framing selection**  
   Dominant frame приходит из orchestration. Synthesis превращает его в response mode.

2. **Response depth selection**  
   `short | medium | deep` из orchestration переводится в practical length: `very short`, `short`, `medium`, `deep`.

3. **Advisory intensity calibration**  
   Execution/fast-direct могут быть более жесткими. Containment/high-risk снижают intensity.

4. **Emotional pressure calibration**  
   Pressure может быть firm, но overload/risk уменьшают emotional pressure.

5. **Compression level**  
   Compression становится high/medium/low и управляет длиной, структурой и повторением reasoning.

6. **Actionability score**  
   Synthesis оценивает, насколько ответ должен быть action-first. Execution и fast-direct повышают actionability; deep/reflection понижают.

7. **Contradiction filtering**  
   Contradiction либо подавляется, либо допускается как один мягкий вызов, либо разрешается только если это центральный риск.

## Anti-fragmentation logic

Главное правило: пользователь должен услышать один dominant frame.

Supporting frames могут влиять на ответ, но не должны создавать отдельные мини-ответы. Например:

- Если dominant frame — `overload-reduction`, risk может появиться только как причина уменьшить scope.
- Если dominant frame — `execution-first`, memory может появиться только если меняет next action.
- Если dominant frame — `risk-first`, pressure не должен подталкивать к срочности.
- Если dominant frame — `compressed-answer`, structured tooling не должен раздувать формат.

Так ответ остается одним куском мышления, а не набором внутренних систем.

## Anti-repetition safeguards

Synthesis явно включает safeguards:

- **Prevent repeated wording**  
  Не повторять один и тот же diagnosis другими словами.

- **Prevent recursive framing**  
  Не объяснять framing ради framing. Ответ должен сразу помогать.

- **Prevent over-analysis**  
  Не расширять глубину, если compression или containment активны.

- **Prevent stacked warnings**  
  Risk warnings должны быть объединены в один decisive risk, а не список тревог.

- **Prevent AI therapist loop**  
  При overload/containment нельзя уходить в эмоциональную валидацию, псевдотерапию или labels. Нужно стабилизировать решение и уменьшить нагрузку.

- **Avoid surveillance-like memory callbacks**  
  Memory-aware режим может звучать как хороший контекст, но не как tracking.

## Текущая интеграция

В `app/api/solve/route.ts` порядок теперь такой:

1. `arbitrateIntelligence`
2. `applyIdentityKernel`
3. `runSelfEvaluationStage`
4. `orchestrateSolveIntelligence`
5. `synthesizeResponseStrategy`
6. `buildResponseSynthesisInstruction`
7. final prompt assembly
8. final answer generation

Это сохраняет существующее поведение, но добавляет последний coherence gate перед генерацией.

## Философия synthesis

SolveOS должен ощущаться как один ум, а не как много слоев, спорящих в одном ответе. Orchestration выбирает, кто имеет право влиять. Synthesis выбирает, как все это превращается в человеческий, последовательный, полезный ответ.

Итоговый принцип:

> One dominant frame. Few supporting signals. One actionable ending.

