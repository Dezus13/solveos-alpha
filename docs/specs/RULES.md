# SolveOS Workflow Rules

Every change must follow this workflow:

1. Read the root `AGENTS.md`.
2. Read `спецификации/AGENTS.md` when changing specifications or requirements.
3. Update the affected source-of-truth specs in `docs/specs/ru/` or `спецификации/`.
4. Check for contradictions across specs.
5. Create or update a short implementation note in the relevant spec.
6. Validate with `npm run lint` and `npm run build`.
7. Create a commit:
   type: short message

Rules:
- Specs must always reflect real system behavior.
- No outdated logic allowed.
- No contradictions between files.
- If unsure, update specs anyway
- One logical change = one commit.
- Do not re-create duplicated English functional specs in `docs/specs/*.md`.

Example commit:
docs: update execution pressure logic in specs
