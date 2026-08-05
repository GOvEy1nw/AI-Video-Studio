# Reusable Codex start prompt

Copy this prompt into Codex and replace `<PR_FILE>` with exactly one implementation file from this package.

---

Work on **one AiVS code-health/performance PR only**, using the current `dev` branch of `GOvEy1nw/AI-Video-Studio` as the integration baseline.

Selected plan: `<PR_FILE>`

Audit baseline used to create the plan: `c405f8224a8a510140591a9b76a568f3a78b49ad`.

## Before changing code

1. Read the repository `AGENTS.md`, Backlog workflow/config, current project map/summary, the selected PR file, `00_AUDIT_REPORT.md`, `references/TEST_RETENTION_MATRIX.md`, and the relevant section of `references/BENCHMARK_PROTOCOL.md`.
2. Inspect the current `dev` head and compare it with the audit baseline. Treat current code as source of truth; record material drift and adapt the plan without broadening its intent.
3. Check existing Backlog tasks/dependencies and create or select the task described by the PR file. Move only that task to `In Progress` before implementation.
4. Capture the PR-specific before baseline. Do not invent performance figures when a measurement cannot be run.
5. Confirm the working tree and preserve unrelated user/agent changes. Never discard or overwrite unrelated work.

## Implementation rules

- Implement only the selected PR. Create separate Backlog tasks for useful out-of-scope discoveries.
- Follow the commit sequence in the selected file; keep commits independently reviewable where practical.
- Prefer deletion, direct ownership, and small pure helpers over new frameworks or generic abstraction layers.
- Do not modify WanGP/Wan2GP performance or model code unless the selected file explicitly says to; none of the supplied PR plans requires it.
- Preserve project schema, generation compatibility, intended path-validation boundaries, context isolation, and active-generation continuity unless the selected PR explicitly defines a safe migration. Do not preserve a documented validation gap.
- Keep visited-workspace state where required, but do not initialise unopened workspaces.
- Do not add snapshot tests, exact text/layout/placement tests, Tailwind-class assertions, DOM-order assertions, or a test merely because a component was moved.
- Apply `references/TEST_RETENTION_MATRIX.md`: retain tests for critical data, generation, file, lifecycle, editor logic, and destructive workflows only.
- Run typecheck and build as direct gates. Do not wrap TypeScript/Pyright in Vitest/pytest.
- Add performance instrumentation only when necessary, keep it development-only, and remove noisy temporary instrumentation before completion.

## Verification

1. Run the selected PR’s focused critical tests.
2. Run the lean full frontend and backend critical suites after PR 01 establishes them.
3. Run renderer/Electron/preload TypeScript checks and backend Pyright directly.
4. Run the production renderer/Electron/preload build.
5. Run the selected manual smoke checks.
6. Repeat the relevant benchmark and report before/after raw values, median, slowest run, environment, and limitations.
7. Verify every acceptance criterion and explicit non-goal.

## Completion record

Update the Backlog task with:

- implementation summary;
- commits and modified files;
- tests/typechecks/builds run and exact results;
- manual smoke result;
- before/after benchmark table or an honest explanation of what could not be measured;
- any known limitations or follow-up task IDs.

Move the task to `Human Review` only after all achievable criteria are complete. Do not silently mark blocked validation as passed.

---

## Suggested assignments

- `00_PR_ELECTRON_PATH_BOUNDARY_HARDENING.md` first.
- `01_PR_LEAN_CRITICAL_TEST_BASELINE.md` next.
- Then `02` and `03` may proceed independently after rebasing on `00` and `01`.
- Follow the dependency table in `README.md` for later plans.
- `11_PR_CONDITIONAL_LAZY_PROJECT_LOADING.md` must not be implemented until its measurement gate is met.
