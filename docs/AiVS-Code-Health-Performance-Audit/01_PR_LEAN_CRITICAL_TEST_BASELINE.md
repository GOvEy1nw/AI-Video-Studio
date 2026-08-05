---
suggested_backlog_id: AIVS-016
title: Restore a lean, green, critical-only validation baseline
status: Draft
priority: critical
type: chore
baseline_commit: c405f8224a8a510140591a9b76a568f3a78b49ad
dependencies: []
---

# PR 01 — Restore a lean, green, critical-only validation baseline

## Pull request intent

Make the test/typecheck signal trustworthy before changing performance-sensitive architecture. Delete presentation-coupled tests and dead production residue instead of updating stale assertions to the latest markup.

This PR is intentionally allowed to have a large **negative** line count.

## Evidence at the pinned baseline

Project records at `c405f8224a8a510140591a9b76a568f3a78b49ad` report:

- 50 frontend test files;
- 197 passing tests;
- 11 failing tests;
- one unhandled jsdom `HTMLMediaElement.play` error;
- 12 strict-TypeScript unused-symbol diagnostics in:
  - `frontend/components/GalleryAssetLibrary.tsx`
  - `frontend/views/genspace/video/ReframePanel.tsx`
  - `frontend/views/genspace/video/VideoGenPanel.tsx`

Known brittle-test examples include:

| File | Presentation coupling to remove |
|---|---|
| `frontend/components/GalleryAssetLibrary.test.tsx` | exact icon/title markup, scrollbar class, grid slider details, card aspect/object-fit classes, model/time/action metadata that is no longer rendered |
| `frontend/components/SettingsDropdown.test.tsx` | exact theme classes, placement data attributes, portal styling |
| `frontend/views/genspace/components/GenSpaceControls.test.tsx` | exact footer child placement and internal container ownership |
| `frontend/views/genspace/music/MusicGenPanel.test.tsx` | `compareDocumentPosition`, exact popover order/height/placement |
| `frontend/views/genspace/video/VideoGenPanel.test.tsx` | exact sibling order, full tool label list, placement attributes, border/aspect classes |
| `frontend/components/FloatingMenu.test.tsx` | exact z-index/max-height/max-width strings rather than geometry/interaction invariants |
| `backend/tests/test_pyright.py` | invokes a first-class static check as a pytest case |
| `backend/tests/test_no_mock_usage.py` | scans style policy as though it were product behaviour |
| `scripts/test-project-asset-import.mjs` | can test its own fallback implementation instead of production output |

## Required policy outcome

A retained automated test must protect at least one of these:

1. data integrity or persisted-schema compatibility;
2. security/path validation;
3. backend request/response mapping;
4. generation lifecycle, cancellation, idempotency, or result ownership;
5. pure domain logic with meaningful edge cases;
6. a critical user interaction whose failure would prevent or corrupt work;
7. accessibility behaviour that cannot be covered by a simpler domain test;
8. a previously escaped, user-visible regression with a stable behavioural boundary.

The following are **not** sufficient reasons for an automated test:

- an element moved above/below another;
- a Tailwind class changed;
- a width, spacing, icon size, border, or exact aspect class changed;
- a popover uses a specific portal/placement implementation;
- wording changed without changing an accessibility or business contract;
- a component was split or reordered internally;
- “coverage went down.”

## Scope

### Production cleanup required before test deletion

#### `frontend/components/GalleryAssetLibrary.tsx`

Remove code that the current grid card no longer renders:

- `AssetCardActionButton` if no live caller remains;
- unused card action/model-name variables and props;
- unused icon imports;
- unused hover state if the hover gradient can use CSS `group-hover` or is itself dead;
- duplicated favourites filtering ownership;
- any test-only `data-*` attributes that no retained critical test needs.

Do **not** remove list-view actions from `GenSpaceGallery`.

#### `frontend/views/genspace/video/VideoGenPanel.tsx`

Remove `LegacyPromptMedia` and its private imports/state if it has no live render path. Do not preserve unused compatibility UI “just in case”; saved request compatibility belongs in typed request builders/backend handling.

#### `frontend/views/genspace/video/ReframePanel.tsx`

Remove unused imports/calculations such as `formatTrimTimecode` and any unused computed aspect value. Remove unused props only after checking every caller.

### Frontend test reduction

#### Keep or consolidate

- pure gallery-filter semantics;
- one Asset Library test covering:
  - entering multi-select;
  - pointer/keyboard toggle;
  - clear;
  - bulk-delete callback with selected IDs;
- one marquee regression test if the selection geometry is extracted as a pure function; otherwise retain only the minimum direct pointer regression;
- request builders and settings restore;
- generation cancellation/result persistence/project ownership;
- media crop/reframe geometry;
- Director validation/request compilation;
- critical editor timeline operations such as overwrite/ripple/trim if already pure;
- pure `FloatingMenu` flip/clamp geometry and one portal interaction test.

#### Delete

- exact Tailwind/class assertions;
- exact DOM sibling/order assertions;
- exact text-size/spacing/width assertions;
- component tests whose only purpose is to preserve the current layout;
- duplicate “renders label X” cases when one workflow test already proves the control is usable;
- tests for intentionally hidden or removed UI;
- stale tests for model/time/action card metadata;
- tests that inspect `data-preferred-placement` rather than the pure placement algorithm;
- tests that assert the entire list and order of Video Tools unless the list itself is a stable product contract. Prefer one pure registry test if such a contract is required.

### Backend and tooling reduction

1. Delete `backend/tests/test_pyright.py`.
   - Keep `pnpm typecheck:py` / `uv run pyright` as a separate gate.
2. Delete `backend/tests/test_no_mock_usage.py`.
   - Retain the “prefer real pure collaborators” guidance in `AGENTS.md`; do not scan test source at runtime.
3. Rewrite `scripts/test-project-asset-import.mjs` so it either:
   - imports and tests the real built module; or
   - exits with a clear “build required” failure.
   It must not test a duplicate fallback implementation.
4. Remove nested `corepack pnpm` calls from package scripts invoked by pnpm:
   - `typecheck`
   - `validate:frontend`
   Use direct `pnpm run ...` or underlying binaries so a local project command does not re-enter Corepack signature verification.
5. Add one lightweight Vitest setup file only if required to make retained media-interaction tests deterministic. It may stub unsupported jsdom media methods globally; it must not emulate playback behaviour.

## New testing policy document

Create `docs/TESTING_POLICY.md` with:

- the retention criteria above;
- a table of validation by change type;
- an explicit ban on snapshots, exact class assertions, and layout-order tests by default;
- the rule that CSS-only/manual UI edits require:
  - TypeScript when TS changed;
  - production build;
  - manual visual smoke;
  - **no new automated test** unless behaviour changed;
- the rule that full suites run at PR completion/CI, not after every small edit;
- a process for deleting obsolete tests when a feature changes.

Update `AGENTS.md` to reference this file and replace broad “test every UI change” wording with the risk-based matrix.

## Risk-based validation matrix

| Change | Required local validation |
|---|---|
| CSS/classes/copy/layout only | build + manual smoke |
| Component interaction | focused critical test + typecheck + build |
| Pure domain/request logic | focused unit test + typecheck |
| Project persistence/schema | focused integration tests + typecheck + build |
| Electron IPC/file handling | focused Node/Electron test + build |
| Backend handler/profile mapping | focused pytest + pyright |
| Shared generation lifecycle | focused suite + full frontend/backend suite before PR review |

## Commit plan

### Commit 1 — `chore(frontend): remove dead UI residue blocking strict typecheck`

- Clean the three known files.
- Run TypeScript.
- Do not touch tests yet except imports made invalid by deleted dead exports.

### Commit 2 — `test(frontend): retain critical behavior and remove presentation assertions`

- Apply the retention matrix to the named component suites.
- Consolidate repeated setup into small helpers only when it reduces test code.
- Prefer deletion over rewriting the same brittle assertion in another form.

### Commit 3 — `test(backend): remove static-policy tests from pytest`

- Delete `test_pyright.py` and `test_no_mock_usage.py`.
- Keep direct Pyright as a documented gate.
- Fix the project-asset import test so it exercises production code only.

### Commit 4 — `docs(tooling): codify risk-based validation and simplify scripts`

- Add `docs/TESTING_POLICY.md`.
- Update `AGENTS.md`, `package.json`, and any current validation docs.
- Record before/after test file and test case counts.

## Acceptance criteria

- [ ] `pnpm run typecheck:ts` has zero diagnostics.
- [ ] `pnpm run test:frontend` has zero failures and zero unhandled errors.
- [ ] Backend focused tests pass and `pnpm run typecheck:py` passes independently.
- [ ] Frontend test-case count is reduced by **at least 20%** from the pinned 208-case head baseline, without deleting the named critical contract areas.
- [ ] Frontend test-file count is lower; empty/one-trivial-assertion files are removed.
- [ ] No retained frontend test asserts exact Tailwind classes, pixel dimensions, sibling order, or implementation-only placement data unless the file is testing a pure geometry algorithm.
- [ ] No backend pytest case invokes a linter/type checker or scans test source for style rules.
- [ ] `scripts/test-project-asset-import.mjs` never reports success after testing only fallback code.
- [ ] `docs/TESTING_POLICY.md` and `AGENTS.md` agree.
- [ ] Production renderer/Electron/preload build succeeds.
- [ ] A short manual smoke covers Home, project open, Quick Gen controls, Director open, Video Editor open, Settings, and Asset Library multi-select.

## Non-goals

- Do not add visual regression/screenshot testing.
- Do not add coverage thresholds.
- Do not rewrite product logic to make tests easier.
- Do not preserve stale test-only attributes.
- Do not delete backend generation/profile/persistence tests merely to meet a percentage.
- Do not turn build/typecheck into new Vitest/pytest wrappers.

## Codex completion record

The Backlog task must include:

- before/after test files and test cases;
- exact deleted suites/cases by category;
- retained critical contract list;
- TypeScript, frontend, backend, and build commands;
- manual smoke result;
- any test retained despite presentation coupling and the explicit reason.
