# Testing Policy

Tests protect user work, generation contracts, native file safety, destructive workflows, lifecycle cleanup, and non-trivial pure logic. They do not freeze harmless presentation.

## Retention rules

Keep or add a test only when failure risks data loss, wrong generation request, unsafe file operation, primary workflow failure, lifecycle leak, accessibility break, or complex pure logic regression. Prefer one focused test per critical workflow and pure-domain tests over component markup tests.

Do not add snapshots, exact Tailwind/class assertions, pixel/layout assertions, DOM-order assertions, or implementation-placement assertions by default. Delete obsolete tests when a feature changes unless they still protect a retained contract.

Use fakes or narrow mocks only at heavyweight/process/network boundaries when they make a critical test deterministic. Prefer real pure collaborators and composed application handlers.

## Validation matrix

| Change | Required local validation |
| --- | --- |
| CSS, classes, copy, layout | TypeScript when TypeScript changed, production build, and manual visual smoke; no new automated test unless behaviour changes |
| Component interaction | Focused critical test, TypeScript, production build |
| Pure domain/request logic | Focused unit test and TypeScript |
| Project persistence/schema | Focused integration test, TypeScript, production build |
| Electron IPC/file handling | Focused Electron/Node test and production build |
| Backend handler/profile mapping | Focused pytest and Pyright |
| Shared generation lifecycle | Focused suite; full frontend/backend suite before PR review |

Run full suites at PR completion or CI, not after each small edit. Use direct TypeScript and Pyright gates; do not invoke them from Vitest or pytest.

## Removing stale tests

When product behavior changes, identify test's protected contract. Rewrite it around stable observable behavior if it remains critical; otherwise delete it. Do not keep stale markup assertions or test-only production attributes solely to preserve coverage.
