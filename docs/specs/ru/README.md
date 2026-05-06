# SolveOS — Спецификации на русском языке

Этот каталог содержит русские переводы всех активных спецификаций.
Исходники на английском языке находятся в `docs/specs/`.

Переводы предназначены для чтения и обслуживания фаундером.
**Код, имена файлов, типы TypeScript, пути к файлам и API-контракты остаются на английском языке без изменений.**

---

## Индекс спецификаций

| Файл | Что описывает |
|------|--------------|
| [0000-functional-map.md](0000-functional-map.md) | Функциональная карта продукта |
| [0001-project-overview.md](0001-project-overview.md) | Обзор проекта |
| [0002-user-flow.md](0002-user-flow.md) | Пользовательский путь |
| [0003-decision-engine.md](0003-decision-engine.md) | Движок принятия решений |
| [0004-action-system.md](0004-action-system.md) | Система действий |
| [0005-identity-and-pressure.md](0005-identity-and-pressure.md) | Идентичность и давление |
| [0006-data-and-storage.md](0006-data-and-storage.md) | Данные и хранилище |
| [0007-ui-structure.md](0007-ui-structure.md) | Структура интерфейса |
| [0008-future-roadmap.md](0008-future-roadmap.md) | Дорожная карта |
| [0008-monetization.md](0008-monetization.md) | Монетизация |
| [0009-spec-consistency.md](0009-spec-consistency.md) | Правила согласованности |

---

## Глоссарий архитектурных терминов

Используй эти переводы везде одинаково.

| Английский термин | Русский перевод |
|-------------------|----------------|
| Identity Kernel | Ядро идентичности |
| Intelligence Arbitration | Арбитраж интеллекта |
| Trust Calibration | Калибровка доверия |
| Memory Decay | Затухание памяти |
| Restraint Intelligence | Интеллект сдержанности |
| Narrative Intelligence | Нарративный интеллект |
| Intent Routing | Маршрутизация намерений |
| Response Compression | Сжатие ответа |
| Execution Capacity | Исполнительная ёмкость |
| Self Evaluation | Самооценка ответа |
| Energy State Intelligence | Интеллект энергетического состояния |
| Decision | Решение |
| Action | Действие |
| Verdict | Вердикт |
| Pressure Layer | Слой давления |
| Identity Engine | Движок идентичности |
| Decision Journal | Журнал решений |
| Session Pressure | Сессионное давление |
| Blocker Category | Категория блокера |

---

## Правила перевода

- Имена функций, переменных, типов остаются на английском: `assessIntent()`, `ActionReminder`, `DecisionBlueprint`
- Пути к файлам остаются на английском: `lib/engine.ts`, `app/api/solve/route.ts`
- Код в блоках ` ```ts ``` ` не переводится
- Таблицы данных с ключами хранилища остаются на английском: `solveos_action_pressure_v1`
- Технические термины, где перевод снижает точность, остаются на английском
