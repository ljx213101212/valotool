# Codex Rules

- OpenSpec owns planning; Superpowers owns coding discipline.

- Use OpenSpec as the source of truth for product intent, behavior changes, ability semantics, implementation scope, and task boundaries:
  - For vague ideas or early investigation, use `openspec-explore` and do not implement application code.
  - For new features, behavior changes, or meaningful refactors, create or update an OpenSpec change with `openspec-propose` before implementation.
  - Start implementation from an active OpenSpec change with `openspec-apply-change`; read the OpenSpec context files before editing code.
  - If implementation reveals the OpenSpec plan is incomplete, wrong, or ambiguous, pause implementation and update the relevant OpenSpec artifacts before continuing.
  - When a change is implemented and verified, use `openspec-archive-change` to archive it and assess whether delta specs need syncing.

- Use Superpowers to enforce engineering discipline while executing OpenSpec work:
  - Before implementation, use the relevant Superpowers discipline for the work type instead of inventing an ad hoc process.
  - For features, bug fixes, refactors, and behavior changes, use `superpowers:test-driven-development` unless the user explicitly approves an exception.
  - For bugs, failing tests, build failures, or unexpected behavior, use `superpowers:systematic-debugging` before proposing or applying fixes.
  - Before claiming work is complete, fixed, or passing, use `superpowers:verification-before-completion` and report fresh evidence.
  - For major features, risky changes, or work near merge readiness, use `superpowers:requesting-code-review`.

- Keep the boundary clear:
  - OpenSpec artifacts define what should change and why.
  - Superpowers defines how Codex works safely while making the change.
  - Do not let Superpowers design docs replace OpenSpec artifacts for project planning in this repo.
  - Do not implement from memory when an OpenSpec change exists; re-read the relevant artifacts and tasks.

- After Codex changes files, if the change affects logic, behavior, configuration, or user-visible ability semantics, review the `specs/` folder and update the relevant spec files in the same turn.
- If no spec update is needed, mention that explicitly in the final response.
- For TypeScript 6 `baseUrl` deprecation with `paths`, remove `"baseUrl": "."`; do not silence it with `ignoreDeprecations`.
