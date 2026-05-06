# Разговорный Опыт и Эмоциональное Взаимодействие

**Модуль:** `lib/core/conversationExperience.ts`  
**Версия:** 1.0  
**Фаза:** Эмоциональная пригодность продукта

---

## Обзор

Модуль разговорного опыта — это слой, который превращает SolveOS из технической системы принятия решений в **эмоционально пригодный продукт**.

Он отвечает не на вопрос «какой совет дать», а на вопрос **«как именно взаимодействовать с этим пользователем прямо сейчас»** — с учётом его эмоционального состояния, уровня доверия, когнитивной нагрузки и истории сессий.

```
История разговора + Энергия + Профиль + Решения
         │
         ▼
   assessConversationExperience()
         │
    ConversationExperienceResult {
      mode, toneProfile, responseDepth,
      rhythm, trust, cognitiveLoad,
      onboarding, returnContext,
      personalityStabilization
    }
```

---

## 1. Эмоциональный UX

### Принцип: адаптация, а не скрипт

SolveOS не следует заранее написанным скриптам. Вместо этого каждый ответ конструируется на основе **текущего эмоционального контекста пользователя**, выведенного из:

- Текущего вопроса / проблемы
- Истории разговора (последние N поворотов)
- Состояния энергии (из `energyStateIntelligence`)
- Долгосрочных паттернов (из `trajectoryEngine`)
- Профиля пользователя

### Эмоциональные состояния сессии

Система отслеживает следующие состояния:

| Состояние | Когда | Реакция системы |
|-----------|-------|----------------|
| `motivated` | Активный, готов действовать | Укрепить импульс, ввести вызов |
| `hesitant` | Нерешительность, сомнения | Дать ясность, снизить количество вариантов |
| `overwhelmed` | Слишком много всего | Стабилизировать, сжать |
| `decisive` | Чёткое намерение | Поддержать решение, ускорить к действию |
| `avoidant` | Откладывание, избегание | Мягкое давление + видимость легкого пути |
| `recovering` | После неудачи или стресса | Низкое давление, восстановление уверенности |
| `burned_out` | Истощение | Минимальная глубина, максимальное тепло |
| `stable` | Нейтральный базовый уровень | Стандартный режим |

---

## 2. Разговорный Темп (Conversational Pacing)

### Четыре сигнала темпа

```
PacingSignal:
  slow_down  → один шаг за раз, меньше вариантов
  maintain   → текущий темп работает
  accelerate → пользователь готов к большему
  pause      → создать дыхательное пространство
```

### Ритм разговора (`ConversationRhythm`)

Объект ритма управляет структурой ответа:

```typescript
ConversationRhythm {
  pacing: PacingSignal

  idealResponseLength:
    very_short  // 1–3 предложения
    short       // 1 параграф
    medium      // 2–3 параграфа
    long        // полная аналитика

  turnsBeforeActionPush:
    execution_coach    → 1 ход  (сразу к действию)
    momentum_builder   → 2 хода
    advisor            → 3 хода
    reflective_analyst → 4 хода
    stabilizer         → 6 ходов (не торопи)

  questionCadence:
    none                // не задавай вопросов
    one_per_response    // один вопрос в конце
    close_with_question // завершить вопросом для самоотражения

  summaryFrequency:
    none               // не резюмируй
    end_of_exchange    // краткое резюме в конце
    every_3_turns      // при высоком количестве смен темы
}
```

---

## 3. Петли Привязанности (Attachment Loops)

### Что такое петля привязанности?

Петля привязанности — это **позитивный цикл возвращения**: пользователь получает ценность → возвращается → доверие растёт → ценность увеличивается.

Система отслеживает три уровня привязанности:

```
AttachmentSignals {
  returnFrequency:
    first_time  → нет данных
    occasional  → 1–2 сессии
    regular     → 3–8 сессий
    habitual    → 9+ сессий

  engagementDepth:
    shallow    → <3 решений
    moderate   → 3–9 решений
    deep       → 10+ решений

  openLoopCount      // нерешённых прошлых решений
  emotionalInvestment // личный/эмоциональный контент
  trustIncidents     // раз когда пользователь не согласился
}
```

**Счёт привязанности** (0–100) в аналитике дашборда:
```
30 базовых баллов
+ до 30 за количество сессий
+ 15 за завершение онбординга
+ 15 за habitual / 10 за regular использование
+ 10 за здоровое количество событий стабилизации
```

---

## 4. Построение Доверия (Trust Building)

### Уровни доверия

```
TrustLevel:
  building    → новый пользователь (score < 55)
  established → регулярный, без инцидентов (score 55–74)
  strong      → проверенные советы, высокая точность (score ≥ 75)
  fragile     → было плохих советов ≥ 2 или score упал
```

### Как доверие строится

| Источник | Баллы |
|---------|-------|
| Каждая сессия | +4 (макс 25) |
| Точность прогнозов ≥ 65% | +15 |
| Постоянное возвращение | +10 |
| ≥2 плохих исходов | -20 |
| Перерыв >60 дней | -10 |

### Как уровень доверия влияет на поведение

| Уровень | Тон | Давление | Глубина | Вызовы |
|---------|-----|----------|---------|--------|
| `building` | Тёплый | Минимальное | Тактический | Только при ставках |
| `established` | Нейтральный | Умеренное | Аналитический | Регулярно |
| `strong` | Прямой | Твёрдое | Полная | Часто |
| `fragile` | Очень тёплый | Нулевое | Короткий | Никогда |

### Сохранение доверия при переходах

При смене режима (например, с `stabilizer` на `execution_coach`) система:
1. Отрабатывает 2+ поворота в текущем режиме перед переключением
2. Избегает резкого изменения тона в одном ответе
3. Использует мягкие мосты: «Ты говоришь, что готов — давай разберёмся с первым шагом»

---

## 5. Когнитивный Комфорт

### Когнитивная нагрузка

Система оценивает **нагрузку на сессионном уровне**, а не только по одному сообщению:

```
CognitiveLoadAssessment {
  level: low | medium | high | critical

  signals:                 // что вызвало уровень
    - "3 смены темы обнаружено"
    - "2 нерешённых вопроса"
    - "energy:overload"
    - "9 ходов сессии — расширенная"
    - "явный язык перегрузки"

  unresolved              // нерешённых тем/вопросов
  topicShifts             // смен темы за сессию
  overloadRisk            // bool: high или critical
  preventionActive        // bool: система уже снизила нагрузку
}
```

### Управление нагрузкой

| Уровень | Действие |
|---------|---------|
| `low` | Нет изменений, полная глубина |
| `medium` | Используй `tactical` глубину |
| `high` | Переключись на `short`, сигнал темпа → `slow_down` |
| `critical` | Принудительный режим `stabilizer`, темп → `pause` |

---

## 6. Эмоциональная Стабилизация

### Когда стабилизация активируется

Система автоматически переключается в режим `stabilizer`, если:
- Когнитивная нагрузка `critical`
- Уровень доверия `fragile`
- Пользователь вернулся после >14 дней отсутствия (`warmReconnect`)
- Энергетическое состояние `OVERLOAD` или `RECOVERY`

### Что делает режим стабилизации

```
Тон:        warmth 0.8, pressure 0.05, validationRatio 0.7
Глубина:    short
Ритм:       pause или slow_down
Вопросы:    один за ответ (открытые, не давящие)
Действия:   не подталкивать минимум 6 ходов
Юмор:       запрещён
Тишина:     разрешена (не заполнять пространство)
```

---

## 7. Адаптивные Тональные Системы

### Профиль эмоционального тона

```typescript
EmotionalToneProfile {
  warmth: 0–1          // 0 = клинический, 1 = эмпатичный
  directness: 0–1      // 0 = исследовательский, 1 = напористый
  pressure: 0–1        // 0 = нет, 1 = твёрдая ответственность
  validationRatio: 0–1 // 0 = только вызов, 1 = только поддержка
  energyLevel:         // low | neutral | elevated
  allowHumor: bool
  allowSilence: bool
}
```

### Базовые профили по режиму

| Режим | Тепло | Прямота | Давление | Поддержка |
|-------|-------|---------|----------|-----------|
| `advisor` | 0.50 | 0.65 | 0.30 | 0.40 |
| `strategist` | 0.30 | 0.85 | 0.50 | 0.25 |
| `stabilizer` | 0.80 | 0.40 | 0.05 | 0.70 |
| `execution_coach` | 0.45 | 0.90 | 0.70 | 0.20 |
| `reflective_analyst` | 0.55 | 0.50 | 0.15 | 0.50 |
| `momentum_builder` | 0.60 | 0.75 | 0.45 | 0.50 |

### Модуляции

Базовый профиль изменяется в зависимости от контекста:

```
trust:fragile    → warmth +0.2, pressure -0.2
trust:strong     → directness +0.1, pressure +0.1
load:high|crit.  → warmth +0.15, pressure -0.3, validationRatio +0.2
energy:IMPULSIVE → pressure -0.2, directness +0.15
```

---

## 8. Темп Ответа (Response Pacing)

### Динамическая глубина ответа

Четыре уровня:

```
short          → 1–3 предложения. Прямой ответ, ничего лишнего.
tactical       → 1 параграф + одно немедленное действие.
analytical     → Структурированный анализ. 2–3 угла зрения.
deep_reasoning → Полный разбор. Долгосрочный горизонт. Высокие ставки.
```

### Сигналы перехода глубины

| Сигнал | Эффект |
|--------|--------|
| `user_compressed` | → `short` |
| `overload_detected` | → `short` |
| `fatigue_signal` | → `short` |
| `momentum_window` (онбординг) | → `tactical` |
| `explicit_deep_request` | → `deep_reasoning` |
| `high_stakes_escalation` | → `deep_reasoning` |

### Правило детекции высоких ставок

Высокие ставки обнаруживаются по ключевым словам проблемы:
```
quit, resign, fire, funding, debt, health,
marriage, divorce, mortgage, lawsuit, visa,
co-founder, runway
```
При обнаружении (и если нет перегрузки) → обязательная глубина `deep_reasoning`.

---

## 9. Переходы Эмоциональных Состояний Пользователя

### Диаграмма переходов

```
first_message ──► calibrating ──► oriented ──► established
                      │               │
                      ▼               ▼
                  stabilizer      advisor
                   (если              (если
                  перегруз)         стабильно)

OVERLOAD ──► stabilizer ──► (нагрузка снижена) ──► advisor
RECOVERY ──► stabilizer ──► (через 6 ходов) ──► advisor / momentum_builder
EXECUTION ──► execution_coach
IMPULSIVE ──► strategist (замедление)
HESITATION ──► advisor (ясность)
EXPLORATION ──► reflective_analyst
```

---

## 10. Режимы Разговора

### 6 режимов взаимодействия

#### `advisor` — Советник
Сбалансированный, стратегически ориентированный, нейтральный по умолчанию.
- **Когда**: Стабильная энергия, любой уровень доверия
- **Глубина**: Тактическая
- **Ритм**: 3 хода до давления действием
- **Тон**: Нейтральный, 50% тепла

#### `strategist` — Стратег
Долгосрочное мышление, ставит предположения под сомнение, вскрывает скрытые допущения.
- **Когда**: Сильное доверие + стабильная энергия
- **Глубина**: Глубокое рассуждение
- **Ритм**: 3 хода до давления
- **Тон**: Холодный, прямой (30% тепла, 85% прямоты)

#### `stabilizer` — Стабилизатор
Эмоциональное заземление, снижение давления, расширение перспективы.
- **Когда**: Перегрузка, выгорание, хрупкое доверие, длинный перерыв
- **Глубина**: Короткая
- **Ритм**: Пауза, 6+ ходов до действия
- **Тон**: Максимально тёплый (80%), минимальное давление (5%)

#### `execution_coach` — Коуч по исполнению
Ответственность, уклон к действию, отслеживание follow-through.
- **Когда**: Режим EXECUTION, высокое доверие
- **Глубина**: Тактическая
- **Ритм**: 1 ход до давления действием
- **Тон**: Прямой, твёрдый (90% прямоты, 70% давления)

#### `reflective_analyst` — Рефлексивный аналитик
Интроспекция, нахождение паттернов, медленное и обдуманное.
- **Когда**: Режим EXPLORATION, возможно первый глубокий анализ
- **Глубина**: Аналитическая
- **Ритм**: 4 хода, закрывать вопросом
- **Тон**: Умеренный, медленный (55% тепла, 50% прямоты)

#### `momentum_builder` — Строитель импульса
Усиление энергии, движение вперёд, короткие победы.
- **Когда**: Низкий score исполнения (<0.3), нужна перезагрузка
- **Глубина**: Тактическая
- **Ритм**: 2 хода, разрешён юмор
- **Тон**: Умеренно тёплый, активная энергия

---

## 11. Онбординг Интеллект

### Четыре фазы

```
first_message  → 0 решений, 0–1 сообщений
                 Открыть заземляющим вопросом. Не погружаться сразу.

calibrating    → <3 решений, <5 сообщений
                 Короткие ответы. Узнать что нужно пользователю.

oriented       → 3–9 решений
                 Пользователь понял систему. Полная глубина по необходимости.

established    → 10+ решений
                 Полная оперативность. Никаких объяснений как работает система.
```

### Интеллект первой сессии

При `first_message`:
- `introductionNeeded = true`
- `framingHint`: «Открыть заземляющим вопросом»
- Режим принудительно: `advisor`
- Темп принудительно: `slow_down`
- Глубина принудительно: `tactical`

Система определяет ожидание пользователя из первого сообщения:
```
"quick" / "short" / "just tell me" → Пользователь хочет краткость
"deep" / "explain" / "thorough"    → Пользователь хочет глубокий анализ
"help" / "lost" / "confused"       → Нужна ориентация
(иначе)                             → Есть конкретная проблема
```

---

## 12. Система Возврата Пользователя

### Детекция возврата

```typescript
ReturnUserContext {
  isReturn: bool
  daysSinceLast: number
  lastProblemSummary: string     // первые 80 символов последней проблемы
  lastMoodSignal: EmotionalState // настроение из последнего решения
  openActionsCount: number       // нерешённых действий
  continuityMessage: string      // «В прошлый раз: ...»
  shouldAcknowledgeReturn: bool  // перерыв ≥ 3 дней
  warmReconnect: bool            // перерыв ≥ 14 дней
}
```

### Поведение при возврате

| Перерыв | Поведение |
|---------|----------|
| <3 дней | Нет особого приветствия |
| 3–13 дней | Упомянуть открытые действия если есть |
| 14+ дней | `warmReconnect = true` → `stabilizer` режим, мягкий мост |

---

## 13. Стабилизация Личности AI

### Риски дрейфа

Система проверяет 7 типов личностного дрейфа:

| Дрейф | Сигнал обнаружения | Коррекция |
|-------|-------------------|-----------|
| `sycophancy` | ≥4 аффирмаций в последних ответах | Снизить validationRatio |
| `over_mirroring` | ≥3 фраз «я понимаю как это тяжело» | Ограничить эмпатию, перейти к действию |
| `pressure_creep` | execution_coach + высокая нагрузка | Снизить давление |
| `guru_drift` | «Правда в том...», «Глубоко в душе ты знаешь» | Вернуться к операционному языку |
| `clinical_drift` | stabilizer + тепло < 0.5 | Применить минимум тепла |
| `mode_bleed` | Смешанные сигналы двух режимов | Выбрать один, держать 2+ хода |
| `identity_loss` | Нет чёткого голоса | Принудительно вернуть к advisor |

### Правило ограничения зеркального отражения

Система никогда не отражает эмоциональный дистресс более **одного раза** в серии ответов. После одного признания — переход к заземлению и движению вперёд.

### Запрещённый язык (при обнаружении дрейфа)

```
great, excellent, perfect, absolutely  → sycophancy
"the truth is", "deep down you know"   → guru_drift
"i understand how hard"               → over_mirroring (>1 раза)
"you need to", "you must"             → pressure_creep (при нагрузке)
```

---

## 14. Аналитика Эмоций Дашборда

### `EmotionalAnalyticsDashboard`

```typescript
EmotionalAnalyticsDashboard {
  sessionCount: number
  returnFrequency: first_time | occasional | regular | habitual

  dominantModeHistory: ConversationMode[]   // один режим на сессию
  emotionalStateHistory: EmotionalState[]   // одно состояние на сессию
  trustProgression: TrustLevel[]            // уровень в конце каждой сессии

  avgCognitiveLoad: CognitiveLoadLevel
  overwhelmIncidents: number               // сессий с предотвращением перегрузки
  stabilizationEvents: number              // сессий в которых стабилизатор сработал

  attachmentScore: 0–100                   // составной балл вовлечённости
  onboardingComplete: bool
  mostUsedDepthLevel: ResponseDepthLevel

  topInsights: string[]                    // читаемые аналитические выводы
}
```

### Пример автоматических инсайтов

```
"Пользователь часто начинает сессии в состоянии стресса — stabilizer доминирует."
"Выгорание зафиксировано в нескольких сессиях — давление снижать последовательно."
"Доверие сильное — система может бросать вызов напрямую."
"Повторные инциденты перегрузки — проактивно снижать нагрузку раньше."
"Высокий процент нерешённых решений — поощрять логирование исходов."
```

---

## 15. Поток Данных

```
ConversationExperienceInput {
  conversationHistory   → история поворотов {role, content}
  decisions             → история решений пользователя
  profile               → UserDecisionProfile
  energy                → EnergyAssessment (из energyStateIntelligence)
  currentProblem        → текущий вопрос
}
         │
         ▼ Sequential pipeline

detectOnboardingPhase()     → OnboardingState
buildReturnUserContext()     → ReturnUserContext
buildTrustProfile()          → TrustProfile
assessCognitiveLoad()        → CognitiveLoadAssessment
assessAttachment()           → AttachmentSignals
         │
selectConversationMode()     → ConversationMode + rationale
calibrateEmotionalTone()     → EmotionalToneProfile
computeResponseDepth()       → ResponseDepthLevel + DepthTransitionSignal[]
checkPersonalityStabilization() → PersonalityStabilizationResult
         │
computeConversationRhythm()  → ConversationRhythm
buildExperienceExplanation() → ExperienceExplanation
         │
         ▼
ConversationExperienceResult
```

---

## 16. API

### Вызов

```typescript
import { assessConversationExperience, buildEmotionalDashboard } from '@/lib/core/conversationExperience';

const result = assessConversationExperience({
  conversationHistory,
  decisions,
  profile,
  energy,            // от assessEnergyState()
  currentProblem,
});

// Для аналитики дашборда
const dashboard = buildEmotionalDashboard(decisions, sessionHistory);
```

### Использование результата в оркестровке

```typescript
// Режим разговора
result.mode              // ConversationMode

// Адаптация тона
result.toneProfile.warmth       // сколько тепла
result.toneProfile.pressure     // сколько давления
result.toneProfile.directness   // насколько прямо

// Глубина ответа
result.responseDepth     // short | tactical | analytical | deep_reasoning

// Ритм
result.rhythm.pacing            // slow_down / maintain / pause
result.rhythm.questionCadence   // нужен ли вопрос в конце

// Контекст возврата
result.returnContext.continuityMessage  // мост к прошлой сессии

// Стабилизаторы
result.personalityStabilization.guardrails  // активные защиты
result.personalityStabilization.appliedCorrections  // что изменено
```

---

## 17. Архитектурные Решения

### Почему 6 режимов, а не больше?

6 режимов покрывают **весь диапазон эмоциональных потребностей** без избыточного дробления:
- Стресс/кризис → `stabilizer`
- Возможности/анализ → `advisor`, `strategist`, `reflective_analyst`
- Действие/исполнение → `execution_coach`, `momentum_builder`

Больше 6 режимов привело бы к `mode_bleed` — одной из ключевых защитных угроз.

### Почему когнитивная нагрузка на уровне сессии, а не сообщения?

`energyStateIntelligence.ts` уже обрабатывает per-message сигналы. `ConversationExperience` обрабатывает **накопленную нагрузку** — то, что нельзя увидеть в одном сообщении: количество ходов без разрешения, смены темы, исторические паттерны.

### Почему стабилизатор может переопределить другие режимы?

Потребность в стабилизации — это **физиологический приоритет**. Если пользователь перегружен, любой другой режим (даже execution_coach) будет неэффективен или вреден. Стабилизация — это необходимое условие для всех остальных режимов.

---

## Связанные Файлы

| Файл | Связь |
|------|-------|
| [`lib/core/conversationExperience.ts`](../../lib/core/conversationExperience.ts) | Основной модуль |
| [`lib/energyStateIntelligence.ts`](../../lib/energyStateIntelligence.ts) | Поставщик EnergyAssessment |
| [`lib/core/trajectoryEngine.ts`](../../lib/core/trajectoryEngine.ts) | Поставщик EmotionalState и траектории |
| [`lib/identityKernel.ts`](../../lib/identityKernel.ts) | Смежный слой личностных инвариантов |
| [`lib/pressureEngine.ts`](../../lib/pressureEngine.ts) | Смежный слой давления сессии |
| [`lib/restraintIntelligence.ts`](../../lib/restraintIntelligence.ts) | Ограничения ответа |
| [`lib/synthesis/responseSynthesizer.ts`](../../lib/synthesis/responseSynthesizer.ts) | Потребитель тона и глубины |
| [`lib/orchestration/orchestrationEngine.ts`](../../lib/orchestration/orchestrationEngine.ts) | Главный потребитель результата |
