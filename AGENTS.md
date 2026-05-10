<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Main Rule

This file is the main operational rulebook for AI agents and future development in this repository.

## Правило работы со спецификациями

Перед любой реализацией:

- прочитать `спецификации/бизнес-контекст.md`
- прочитать `спецификации/правила-спецификаций.md`
- прочитать `спецификации/процесс-реализации.md`
- определить связанные спецификации функций
- если задача пересекает границы продукта, прочитать связанные технические спецификации
- сравнить запрос пользователя с существующими спецификациями
- создать или обновить короткую implementation note в релевантной спецификации или рядом с ней
- только после этого реализовывать, редактировать документацию или менять требования

Нижестоящие спецификации не могут отменять вышестоящие:

- `бизнес-контекст.md` — главный источник продуктовой правды
- спецификации функций — источник функциональных требований
- технические спецификации — ограничения реализации
- истории пользователя — только примеры, не источник новых требований

Если нижестоящий документ спорит с вышестоящим, считается верным вышестоящий документ. Противоречие нужно зафиксировать в спецификациях и не реализовывать спорное поведение без решения владельца.

## Git Workflow Rules

- Every new implementation task must start from an updated `main` branch.
- Before coding, read the related specs.
- One task = one focused branch.
- Do not merge branches automatically.
- Do not push without an explicit user request.
- After finishing implementation, run:
  - `git status`
  - `npm run lint`
  - `npm run build`
- Before starting a new task:
  - return to `main`
  - pull the latest state
  - verify the working tree is clean

## Specification Authority

- Specs are the source of truth.
- Runtime behavior must follow specs.
- If implementation conflicts with specs, specs win.
- If specs are incomplete, stop and ask for clarification.
- Do not invent hidden product behavior.

## Safe Change Rules

- Prefer small commits.
- Avoid editing unrelated files.
- Avoid duplicate specs.
- Avoid duplicate `AGENTS.md` files.
- Avoid creating parallel architecture structures.

## Implementation Lifecycle

Read specs
→ Create plan
→ Create branch
→ Implement
→ Validate
→ Commit
→ Push only on request
→ PR/manual merge
→ Return to `main`
