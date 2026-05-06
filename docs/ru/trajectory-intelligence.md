# Траекторный Интеллект и Адаптивная Память

**Модуль:** `lib/core/trajectoryEngine.ts`  
**Версия:** 1.0  
**Фаза:** Долгосрочный когнитивный интеллект

---

## Обзор

Траекторный интеллект — это слой, который превращает SolveOS из реактивной системы принятия решений в **адаптивный долгосрочный когнитивный партнёр**.

Вместо того чтобы анализировать каждое решение изолированно, система накапливает данные о **траектории пользователя** — направлении движения, скорости изменений, поведенческих паттернах и стратегических отклонениях — и адаптирует свои ответы в реальном времени на основе этого контекста.

```
Решения → Точки траектории → Вектор → Паттерны → Дрейф → Предсказание → Адаптация
```

---

## 1. Модель Траектории

### Что такое траектория?

Траектория — это **временной ряд качественных сигналов** из всех решений пользователя. Каждое решение создаёт точку (`TrajectoryPoint`) с набором метрик:

| Поле | Тип | Описание |
|------|-----|----------|
| `score` | 0–100 | Качество решения на момент принятия |
| `executionRate` | 0–1 | Коэффициент исполнения на данный момент |
| `emotionalState` | enum | Определённое эмоциональное состояние |
| `decisionQuality` | 0–100 | Составная оценка (60% score + 40% outcomeAccuracy) |
| `riskProfile` | low/medium/high | Профиль риска конкретного решения |
| `hasOutcome` | bool | Зафиксирован ли исход |
| `outcomeAccuracy` | 0–100 | Точность прогноза исхода |

### Траекторный вектор (`TrajectoryVector`)

Вектор определяет **направление и скорость изменения качества** через линейную регрессию по всем точкам:

```
TrajectoryVector {
  slope: number          // изменение за 30 решений (может быть отрицательным)
  direction: ascending | descending | flat | volatile
  confidence: 0–100      // статистическая уверенность в тренде
  sampleSize: number     // количество точек для расчёта
}
```

**Алгоритм:**
1. Строится линейная регрессия: `score = a + b * index`
2. Наклон нормализуется к 30 решениям: `slope = b * 30`
3. Направление определяется порогами: `|slope| < 2` → flat, `slope > 0` → ascending, `slope < -15` → volatile
4. Уверенность = `min(90, sampleSize * 5)`

---

## 2. Поведенческая Адаптация

### Детектирование поведенческих паттернов

Система анализирует **9 типов поведенческих паттернов** по всей истории решений:

| Паттерн | Идентификатор | Сигнал обнаружения |
|---------|---------------|-------------------|
| Серийная нерешительность | `serial_hesitation` | ≥2 решений с `emotionalState = 'hesitant'` |
| Поиск высокого риска | `high_risk_seeking` | >40% решений с `riskProfile = 'high'` |
| Петля избегания | `avoidance_loop` | ≥3 нерешённых решений в одной домене |
| Коллапс исполнения | `execution_collapse` | Высокая уверенность + низкая точность исхода |
| Всплеск активности | `burst_activity` | 3 решения за <3 дня, повторяющиеся кластеры |
| Доменная концентрация | `domain_concentration` | >60% решений в одной области |
| Усталость от решений | `decision_fatigue` | Деградация качества при высоком объёме |
| Построение импульса | `momentum_build` | Устойчивый рост slope > 3 за 30 дней |
| Идентичная последовательность | `identity_consistency` | ≥70% решений соответствуют профилю риска |

Каждый паттерн содержит:
- **`strength`** — сила сигнала (0–1)
- **`implication`** — что это говорит о пользователе
- **`adaptationHint`** — как должна адаптироваться оркестровка

---

## 3. Адаптивные Слои Памяти

Система поддерживает **5 независимых слоёв памяти**, каждый с разным временным горизонтом и назначением:

### 3.1 Краткосрочная память (7 дней)
```
ShortTermMemory {
  windowDays: 7
  points: TrajectoryPoint[]
  avgScore: number
  dominantEmotionalState: EmotionalState
  activeDecisionCount: number
  executionRate: number
}
```
**Назначение:** Определяет текущее настроение и режим взаимодействия. Используется для немедленной адаптации тона и глубины ответа.

### 3.2 Среднесрочная память (30 дней)
```
MediumTermMemory {
  windowDays: 30
  avgScore: number
  avgExecutionRate: number
  topDomain: string
  patternSignals: BehavioralPatternType[]
  qualityVector: TrajectoryVector
}
```
**Назначение:** Выявляет текущие поведенческие паттерны и основную область фокуса пользователя.

### 3.3 Долгосрочная память (90 дней)
```
LongTermMemory {
  windowDays: 90
  avgScore: number
  avgExecutionRate: number
  domainDistribution: Record<string, number>
  qualityVector: TrajectoryVector
  executionVector: TrajectoryVector
  peakScore: number
  troughScore: number
}
```
**Назначение:** Формирует стратегический контекст. Содержит исторический диапазон (peak/trough), распределение по доменам, и два вектора — качества и исполнения.

### 3.4 Память идентичности (`IdentityMemory`)
```
IdentityMemory {
  corePatterns: BehavioralPattern[]
  consistencyScore: 0–100
  identityLabel: string
  riskPersona: 'risk_averse' | 'balanced' | 'risk_seeking' | 'impulsive'
  executionPersona: 'executor' | 'planner' | 'procrastinator' | 'inconsistent'
  dominantDomains: string[]
  lastUpdated: string
}
```
**Назначение:** Хранит устойчивый профиль идентичности. Отвечает на вопрос «Кто этот пользователь?» — не из формы, а из поведения.

Классификация `riskPersona`:
- `riskTolerance > 0.7` → `risk_seeking`
- `riskTolerance < 0.3` → `risk_averse`
- `riskTolerance > 0.55` → `balanced`
- иначе → `impulsive`

### 3.5 Стратегическая память (`StrategicMemory`)
```
StrategicMemory {
  recurringThemes: string[]
  openLoops: string[]          // нерешённые проблемы >30 дней
  strategicGoals: string[]     // выведенные цели из паттернов доменов
  driftSignals: DriftSignal[]
  alignmentScore: 0–100        // соответствие между целями и последними решениями
  lastDriftCheck: string
}
```
**Назначение:** Отслеживает стратегическую согласованность. Определяет, двигается ли пользователь к своим целям, или начался стратегический дрейф.

---

## 4. Долгосрочный Интеллект

### Отслеживание эволюции пользователя

Эволюция пользователя отслеживается через три ключевых вектора:

```
Качество решений:   [score₁, score₂, ..., scoreₙ] → qualityVector
Исполнение:         [exec₁,  exec₂,  ..., execₙ]  → executionVector
Эмоциональный тон:  [emo₁,   emo₂,   ..., emoₙ]   → emotionalDrift
```

Система задаёт вопросы:
- Улучшается ли качество решений в долгосрочной перспективе?
- Становится ли пользователь более последовательным в исполнении?
- Смещается ли эмоциональный тон в сторону мотивации или выгорания?

---

## 5. Детектирование Привычных Паттернов

Привычные паттерны — это поведения, которые повторяются **систематически**, а не случайно. Алгоритм проверяет каждый тип паттерна независимо и возвращает список `BehavioralPattern[]`, отсортированный по силе сигнала.

**Сила сигнала** (`strength`) рассчитывается как:
```
strength = count(supporting_decisions) / total_decisions
```
с корректировкой для тех паттернов, где важна относительная доля.

---

## 6. Детектирование Стратегического Дрейфа

Дрейф — это **нежелательное или неосознанное изменение** в поведении пользователя. Система детектирует 5 типов дрейфа:

### Алгоритм детекции

Для каждого типа дрейфа данные делятся на две половины (старшие и новые точки) и сравниваются средние:

```
baseline = avg(firstHalf.metric)
current  = avg(secondHalf.metric)
delta    = current - baseline

if |delta| > threshold → DriftSignal
```

### Пороги детекции

| Тип дрейфа | Метрика | Порог mild | Порог moderate | Порог significant |
|-----------|---------|-----------|---------------|------------------|
| `risk_drift` | riskProfile (0–1) | — | Δ > 0.2 | Δ > 0.35 |
| `execution_drift` | executionRate (0–1) | Δ > 0.15 | Δ > 0.2 | Δ > 0.3 |
| `emotional_drift` | emotionScore (0–1) | — | Δ > 0.2 | Δ > 0.4 |
| `domain_drift` | top domain | смена домена | смена домена | — |
| `strategic_drift` | qualityVector.slope | — | slope < -5 | slope < -10 |

Каждый `DriftSignal` содержит объяснение и рекомендацию, что делать дальше.

---

## 7. Анализ Импульса

Импульс (`MomentumScore`) — это **текущая скорость и направление изменений**, не путать с трендом (который смотрит на длинный горизонт).

```
MomentumScore {
  raw: 0–100               // итоговый балл
  direction: building | declining | stalled | recovering
  executionMomentum: 0–100 // тренд исполнения (сравнение 30d vs 30–60d)
  qualityMomentum: 0–100   // тренд качества
  volumeMomentum: 0–100    // активность vs историческая норма
  streakDays: number        // дней подряд с хотя бы одним решением
  inactiveDays: number      // дней без решений
}
```

**Формула:**
```
raw = (executionMomentum + qualityMomentum + volumeMomentum) / 3

direction:
  raw ≥ 65 → 'building'
  raw ≥ 45 → 'recovering'
  qualityMomentum < 40 AND executionMomentum < 40 → 'declining'
  иначе → 'stalled'
```

---

## 8. Когнитивные Траекторные Системы

### Двигатель предсказания траектории

Предсказание строится на трёх горизонтах: **30, 60, 90 дней**.

```
predictedScore = currentAvg + vector.slope * (horizon / 30)
predictedExecutionRate = currentExecution ± execDelta
predictedEmotionalState ← из direction:
  ascending  → 'motivated'
  descending → 'hesitant'
  иначе      → dominantEmotion (последние 5 точек)
```

Уверенность предсказания:
- `high` → ≥10 точек и confidence > 60%
- `medium` → ≥5 точек
- `low` → <5 точек

### Помощники симуляции будущих состояний

Система генерирует **6 сценариев** возможного будущего пользователя:

| Сценарий | Описание | Когда рекомендуется |
|---------|---------|-------------------|
| `maintain_current` | Продолжить как есть | Восходящий тренд |
| `increase_execution` | Улучшить исполнение на 20% | Низкий executionRate (<0.5) |
| `reduce_risk` | Более осторожные решения | Импульсивный профиль |
| `increase_volume` | Увеличить частоту решений | Низкая активность (<2/мес) |
| `domain_focus` | Сконцентрироваться на топ-домене | Профиль "planner" |
| `strategic_reset` | Пересмотреть цели и направление | ≥2 сигналов дрейфа |

Каждый сценарий содержит прогноз на 30 и 90 дней, ключевые риски и возможности.

---

## 9. Адаптивная Оркестровка

### Как траектория меняет ответы системы

`OrchestrationHints` — это выходной сигнал траекторного движка для слоя оркестровки. Он управляет тем, **как** строится ответ, а не что содержится.

```
OrchestrationHints {
  primaryAdaptation:     // главная адаптация тона и содержания
  responseDepthBias:     shorter | deeper | neutral
  toneAdjustment:        warmer | colder | neutral
  shouldSurfacePattern:  bool   // показывать ли паттерн пользователю
  shouldSurfaceDrift:    bool   // предупреждать ли о дрейфе
  momentumMessage:       string // сообщение об импульсе (если есть)
}
```

### Таблица адаптаций

| Условие | `primaryAdaptation` | Глубина | Тон |
|---------|--------------------|---------|----|
| >14 дней без решений | `encourage_action` | neutral | neutral |
| Выгорание обнаружено | `acknowledge_burnout` | shorter | warmer |
| Восходящий тренд, стрик | `celebrate_momentum` | neutral | neutral |
| Значимый дрейф | `flag_drift` | deeper | neutral |
| Серийная нерешительность | `encourage_action` | neutral | neutral |
| Высокий риск паттерн | `slow_down` | deeper | colder |
| Зона комфорта | `challenge_comfort` | deeper | colder |
| Идентичная последовательность | `reinforce_identity` | neutral | neutral |

---

## 10. Дашборд и Визуализация

### `TrajectoryDashboardData`

Хелпер `buildTrajectoryDashboardData()` трансформирует `TrajectoryIntelligence` в структуру для компонентов UI:

```typescript
TrajectoryDashboardData {
  trajectoryGraph:         // до 30 точек {date, score, executionRate}
  momentumScore:           // 0–100
  momentumDirection:       // building | declining | stalled | recovering
  consistencyIndicator:    // 0–100 из IdentityMemory
  executionTrend:          // последние 10 значений executionRate
  strategicAlignmentScore: // 0–100 из StrategicMemory
  topBehavioralPattern:    // название топ-паттерна
  driftAlerts:             // объяснения сигналов (severity ≠ mild)
  predictionAt30:          // прогноз качества на 30 дней
  predictionAt90:          // прогноз качества на 90 дней
  streakDays:              // текущий стрик
}
```

### Индикаторы для UI-компонентов

```
Траекторный граф:   trajectoryGraph → линейный график score + executionRate по дате
Импульс:            momentumScore → прогресс-бар или круговой индикатор
Последовательность: consistencyIndicator → статус-бейдж
Тренд исполнения:   executionTrend → мини-искровая линия (sparkline)
Выравнивание:       strategicAlignmentScore → радарная диаграмма или шкала
Оповещения:         driftAlerts → предупреждения в разделе «Стратегический контроль»
Предсказание:       predictionAt30, predictionAt90 → карточки с горизонтами
```

---

## 11. Объяснимость

### `TrajectoryExplanation`

Каждый расчёт траектории сопровождается объяснением:

```typescript
TrajectoryExplanation {
  summary:              // краткое резюме (направление, паттерн, дрейф)
  momentumNarrative:    // нарратив об импульсе
  topPattern:           // описание главного паттерна
  topDrift:             // описание главного дрейфа
  predictionRationale:  // методология предсказания
  adaptationRationale:  // почему ответ адаптирован именно так
  confidenceLevel:      high | medium | low
  dataSufficiency:      sufficient | limited | insufficient
}
```

**Суффицентность данных:**
- `sufficient` → ≥10 решений
- `limited` → 4–9 решений
- `insufficient` → <4 решений (система работает, но с оговорками)

---

## 12. Поток Данных

```
DecisionMemoryEntry[]
    │
    ▼
buildTrajectoryPoints()
    │ TrajectoryPoint[]
    ├─→ computeTrajectoryVector() → TrajectoryVector
    ├─→ computeMomentum()         → MomentumScore
    ├─→ detectBehavioralPatterns() → BehavioralPattern[]
    ├─→ detectDrift()              → DriftSignal[]
    │
    ▼
buildAdaptiveMemory()
    │ AdaptiveMemoryLayer {
    │   shortTerm, mediumTerm, longTerm,
    │   identity, strategic
    │ }
    │
    ├─→ predictTrajectory(×3)     → TrajectoryPrediction[]
    ├─→ simulateFutureStates()    → FutureStateSimulation[]
    ├─→ buildOrchestrationHints() → OrchestrationHints
    └─→ generateTrajectoryExplanation() → TrajectoryExplanation
    │
    ▼
TrajectoryIntelligence
    │
    └─→ buildTrajectoryDashboardData() → TrajectoryDashboardData
```

---

## 13. API Входа / Выхода

### Входные данные (`TrajectoryEngineInput`)

```typescript
{
  decisions: DecisionMemoryEntry[]  // полная история решений
  profile: UserDecisionProfile      // текущий профиль пользователя
  patterns?: StrategicPattern[]     // опциональные паттерны из MemoryGraph
  userId?: string                   // идентификатор пользователя
}
```

### Вызов

```typescript
import { computeTrajectory, buildTrajectoryDashboardData } from '@/lib/core/trajectoryEngine';

const intelligence = computeTrajectory({ decisions, profile });
const dashboardData = buildTrajectoryDashboardData(intelligence);
```

---

## 14. Архитектурные Решения

### Почему 5 слоёв памяти?

Каждый слой отвечает на разный вопрос:

| Слой | Вопрос | Горизонт |
|------|--------|---------|
| Краткосрочный | Как пользователь себя чувствует прямо сейчас? | 7 дней |
| Среднесрочный | Что происходит в текущем цикле? | 30 дней |
| Долгосрочный | Какова историческая базовая линия? | 90 дней |
| Идентичности | Кто этот пользователь? | Всё время |
| Стратегический | Движется ли он к своим целям? | Всё время |

### Почему линейная регрессия для векторов?

Простота и интерпретируемость — линейный наклон легко объяснить пользователю. Более сложные модели (ARIMA, сглаживание) были отклонены из-за сложности объяснимости при малых выборках.

### Обработка недостаточных данных

При `dataSufficiency = 'insufficient'` (< 4 решений) система:
1. Возвращает baseline-значения (score=50, executionRate=0.5)
2. Устанавливает `confidence = 'low'`
3. Не генерирует сигналы дрейфа
4. Адаптация минимальна (`primaryAdaptation = 'standard'`)

---

## Связанные Файлы

| Файл | Связь |
|------|-------|
| [`lib/core/trajectoryEngine.ts`](../../lib/core/trajectoryEngine.ts) | Основной движок |
| [`lib/types.ts`](../../lib/types.ts) | Базовые типы (DecisionMemoryEntry, StrategicPattern) |
| [`lib/userProfile.ts`](../../lib/userProfile.ts) | UserDecisionProfile, detectBiases |
| [`lib/longitudinalMemory.ts`](../../lib/longitudinalMemory.ts) | Долгосрочная классификация решений |
| [`lib/orchestration/orchestrationEngine.ts`](../../lib/orchestration/orchestrationEngine.ts) | Слой, потребляющий OrchestrationHints |
| [`lib/core/explainabilityEngine.ts`](../../lib/core/explainabilityEngine.ts) | Параллельный слой объяснимости |
| [`components/WarRoomDashboard.tsx`](../../components/WarRoomDashboard.tsx) | Основной потребитель дашборд-данных |
