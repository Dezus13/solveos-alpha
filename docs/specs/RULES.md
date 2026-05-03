# SolveOS Workflow Rules

Every change must follow this workflow:

1. Implement the change in code
2. Update all affected specs:
   - 0001-project-overview.md
   - 0003-decision-engine.md
   - 0004-action-system.md
   - 0006-data-and-storage.md
3. Check for contradictions across specs
4. Update docs/decision-log.md:
   - what changed
   - why
   - what problem it solves
5. Create a commit:
   type: short message

Rules:
- Specs must always reflect real system behavior
- No outdated logic allowed
- No contradictions between files
- If unsure, update specs anyway
- One logical change = one commit

Example commit:
docs: update execution pressure logic in specs
