# AiVS critical-test retention matrix

## Purpose

This document is the binding test policy for PR 01 and every later PR in this package.

AiVS should have a **small, fast, green suite that protects expensive failures**. It should not have a large suite that prevents harmless changes to wording, spacing, dropdown direction, control order, or Tailwind classes.

The goal is not maximum test count or maximum line coverage. The goal is confidence in:

- persisted user work;
- generation request correctness;
- safe file operations;
- critical editing logic;
- cancellation and lifecycle cleanup;
- security boundaries;
- a few high-value user workflows.

## Decision rule

Keep or add an automated test only when a regression would meet at least one of these conditions:

1. **Data loss/corruption:** project, timeline, asset, take, generated output, or user setting can be lost or saved into the wrong project.
2. **Wrong generation contract:** AiVS can send the wrong endpoint, model profile, media role, crop/reframe recipe, prompt, duration, seed, or compatibility field.
3. **Unsafe native operation:** AiVS can read, move, overwrite, delete, or reveal a path outside the permitted boundary, or can leave files in a dangerous partial state.
4. **Critical workflow failure:** a primary action cannot be completed, such as generate/cancel, import/delete, save/reopen, copy settings, or timeline edit.
5. **Non-trivial pure logic:** the implementation contains branching/geometry/timing/normalisation logic whose correctness is hard to establish by inspection.
6. **Lifecycle/resource leak:** polling, listeners, timers, media playback, decoding, or an active operation can survive beyond its owner or run twice.
7. **Accessibility behaviour:** keyboard activation, focus restoration, semantic disabled state, or an essential accessible name can break the workflow—not merely change copy.
8. **A previously escaped high-severity bug:** the regression reached a user and is likely to recur; the test should target the smallest stable contract that would have caught it.

If none apply, prefer manual review and the build/type gates.

## Keep, rewrite, or delete

### Keep — high-value test classes

| Area | Keep | Why |
|---|---|---|
| Generation transport | Pure request builders, response parsing, progress normalisation, cancellation/terminal-state guards | A wrong request can waste minutes of compute or produce the wrong output |
| Backend handlers/services | Profile validation, role mapping, crop/reframe/edit recipes, temporary-file cleanup, error translation | These are product/runtime contracts |
| Project persistence | Migration, atomic write, save coalescing, deletion, project scoping, reopening | Protects user work |
| Asset file safety | Root validation, duplicate strategy, safe trash/delete, copy/move fallback, path normalisation | Protects files and security boundary |
| Editor pure logic | Overlap resolution, trim/ripple/roll/slip/slide, track ordering, time conversion, undo transaction rules | Dense branching and difficult edge cases |
| Director pure logic | Sequence normalisation, validation, frame conversion, request compilation | Core authored output contract |
| Asset Library critical interactions | One concise test for selection + confirmed bulk deletion; one for keyboard activation if not covered elsewhere | User-visible destructive workflow |
| Floating menu geometry | Pure edge-flip/clamp algorithm | Non-trivial geometry; independent of CSS/DOM shape |
| Backend lifecycle | One subscription, reconnect transition, retry cancellation, unmount cleanup | Prevents duplicate work and timer leaks |
| Performance structure | Small source/bundle assertion only when it protects a deliberate boundary, such as workspace dynamic entries | Prevents accidental eager re-imports without asserting generated filenames |

### Rewrite — preserve the behaviour, remove presentation coupling

| Current style | Rewrite as |
|---|---|
| “Footer left contains Seed and footer right contains Camera” | Remove unless the position is required to complete the workflow. Test each action independently only if critical. |
| “Dropdown has `data-preferred-placement=top-end`” | Test that the menu opens, remains interactive near a viewport edge in the shared geometry test, and the intended option can be selected. |
| “Model readiness text has `text-red-400`” | Test that a missing model remains selectable/downloadable and that its semantic status is exposed. Do not assert the colour class. |
| “These ten Tool labels render in this exact order” | Test one representative tool transition and the request/state outcome. Pure tool registry tests may assert IDs if the list is a backend contract. |
| “Global/Region/Style disclosures are DOM siblings in this order” | Remove. Test region prompt serialization and that a user can add/edit a region. |
| “Grid card contains one image with `object-cover`” | Remove. Visual/manual concern. |
| “Scrollbar uses `.gallery-scrollbar`” | Remove. CSS implementation detail. |
| “Exact title/placeholder/help copy appears” | Query by stable role or dedicated accessible label only when needed to perform the action. Avoid full sentence matching. |
| “Component X is mounted in this exact parent” | Test lifecycle outcome: inactive workspaces pause; visited workspaces preserve state; unopened workspaces are not initialised. |
| Large component fixture repeating every controller field | Prefer pure logic tests or a thin workflow harness. Delete fixtures that exist only to inspect markup. |

### Delete — do not migrate

Delete tests whose only purpose is to assert:

- exact Tailwind class names;
- text size, width, height, gap, padding, margin, border radius, colour, opacity, z-index, or object-fit;
- exact dropdown direction/alignment at a particular call site;
- exact DOM sibling/parent order;
- component-private `data-testid` layout structure;
- the presence of decorative icons or empty text content;
- exact user-facing wording that is not a protocol/legal/accessibility requirement;
- a control’s current visual grouping;
- snapshots of component markup;
- all options/labels rendered when a typed registry or backend contract already covers the data;
- dead/disabled/hidden UI that is intentionally not shipped;
- source-style policy such as “tests may not use mocks”; review/lint should own policy;
- TypeScript/Pyright execution from inside Vitest/pytest; type checking is a separate gate;
- fallback tests that test a duplicate implementation rather than production code;
- whether a memo/component exists rather than the user-visible or performance outcome.

## Current-file triage guide

This is a starting rubric for the pinned baseline, not an instruction to preserve file boundaries.

### `frontend/components/GalleryAssetLibrary.test.tsx`

Keep/rewrite:

- pure gallery filter semantics;
- one concise multi-select + bulk-delete workflow;
- one marquee geometry test only if marquee remains and its pure intersection helper is extracted;
- stacked audio variation selection only if it changes the active take correctly.

Delete:

- icon-only markup/text-content checks;
- title/class/scrollbar checks;
- exact grid slider display mapping if the slider itself is not a product-critical contract;
- model/time metadata placement;
- aspect-square, image count, and object-fit assertions;
- tests for actions no longer rendered in grid cards.

### `frontend/views/genspace/components/GenSpaceControls.test.tsx`

Keep/rewrite:

- Enter submits while Shift+Enter inserts a newline;
- disabled Generate cannot submit;
- gallery/file drops produce the correct typed media input/role;
- removing an occupied input clears the correct state.

Delete:

- footer-side placement;
- per-call-site dropdown placement;
- exact menu/header positioning;
- tests that only confirm a label is visible.

### `frontend/components/SettingsDropdown.test.tsx`

Keep/rewrite:

- disabled trigger does not open or change value;
- selecting an option calls `onChange` with the typed value;
- model availability remains actionable according to product rules.

Delete:

- theme-ignore selector/class checks;
- semantic colour Tailwind class checks;
- exact top/bottom/end placement at this component level;
- `maxHeight`/portal styling assertions already covered by shared menu behaviour.

### `frontend/components/FloatingMenu.test.tsx`

Keep:

- pure flip/clamp geometry tests;
- one portal/interactivity test;
- focus/escape/outside-click behaviour if implemented centrally and user-critical.

Delete:

- exact z-index class and exact CSS `calc(...)` strings;
- duplicate tests in every consumer.

### `frontend/views/genspace/music/MusicGenPanel.test.tsx`

Keep/rewrite:

- choosing presets mutates editable prompt data correctly;
- key/time signature/language/voice selections update typed settings;
- Instrumental/Auto/Custom compile to the correct music request in pure compiler tests.

Delete:

- model/tabs/media/prompt DOM order;
- exact portal/max-height checks;
- assertions that a specific control implementation is a button rather than a native select unless keyboard behaviour requires it.

### `frontend/views/genspace/video/VideoGenPanel.test.tsx`

Keep/rewrite:

- duration bounds as a pure settings rule/request-builder contract;
- switching Video Tools retains the canonical source and trim/framing state;
- tool selection produces the correct typed request;
- source removal clears submission readiness.

Delete:

- exact tool chip order and sibling placement;
- exact classes/borders/rounded markup;
- exact header/control-row composition;
- exact number/location of aspect controls;
- exact menu placement.

### Backend test meta-files

- Delete `backend/tests/test_pyright.py`; run `uv run pyright` as a validation command/CI step.
- Delete `backend/tests/test_no_mock_usage.py`; permit targeted fakes/mocks at process/network boundaries where they make a critical test deterministic.
- Keep backend domain tests focused on public handler/service outcomes.

### `scripts/test-project-asset-import.mjs`

Delete the fallback function that reimplements suffix naming. A test that cannot import the production module must fail or skip with an explicit prerequisite; it must not pass by testing copied logic.

## Critical workflow budget

For a normal feature PR, use this default budget:

- pure/domain tests for each meaningful branch of new critical logic;
- **zero** new component tests for a visual-only change;
- at most **one** component/integration test per critical workflow changed;
- at most **one** escaped-regression test per root cause, not per reported symptom;
- no snapshots.

The budget can be exceeded for data migration, native file safety, or complex editor timing logic, but the PR must explain why.

## Validation layers

Automated tests are only one layer.

### Always-required gates

1. `tsc --noEmit` for renderer code.
2. TypeScript check for Electron/Vite code via the project reference/build.
3. `uv run pyright` for backend source.
4. Vite renderer/Electron/preload production build.
5. Critical frontend test suite.
6. Critical backend test suite.

These gates should be direct scripts and CI jobs, not tests inside another runner.

### Manual UI smoke matrix

Use manual checks for presentation and exploratory interaction:

- Home opens and project cards render.
- Open/create project.
- Quick Gen mode switching and one request validation path per media type.
- Asset import, select, favourite/bin, preview, and confirmed deletion.
- Director open/play/timeline selection.
- Video Editor open, play/pause, trim/move one clip, save/reopen.
- Settings/Model Manager open and close.
- Logs open and close.
- Resize panels and inspect at the supported minimum window size.

A CSS/layout PR should update this checklist—not create brittle DOM tests.

## Escaped-bug test template

Before adding a regression test, write:

```md
Failure severity: [data loss | wrong generation | unsafe file operation | critical workflow | resource leak]
Stable contract: [smallest observable outcome]
Why existing tests/gates missed it: ...
Why this test will survive harmless UI refactors: ...
```

If the failure is only visual, fix it and add it to the manual smoke checklist or a design review note instead.

## PR 01 completion target

PR 01 should produce:

- zero failing retained tests;
- zero unhandled jsdom media errors;
- direct typecheck/build gates that run independently;
- at least a **20% reduction** in frontend test cases from the pinned baseline unless Codex documents why fewer cases could be safely removed;
- a materially smaller set of UI component tests;
- no loss of coverage for generation contracts, project/file safety, editor pure logic, or destructive workflows.

Do not chase a line-coverage percentage. Track retained test count, runtime, and the risk categories protected.
