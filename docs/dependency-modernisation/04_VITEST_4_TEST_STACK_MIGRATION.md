# Phase 4 — Vitest 2 → Vitest 4 Frontend Test-Stack Migration

## Objective

Upgrade AiVS's frontend testing stack after Vite 8 is proven stable, repair any changed test semantics, and strengthen focused coverage around the Electron/file-import migration.

This phase is test-infrastructure work. It must not change production behaviour merely to accommodate tests.

## Target dependency family

Resolve the newest stable versions compatible with Vite 8 and React 18 at execution time:

```text
vitest                         4.1.x
jsdom                          current compatible stable
@testing-library/react         current compatible stable
@testing-library/user-event    current compatible stable
@testing-library/dom           resolved compatible version
```

Do not adopt Vitest 5 beta or any prerelease.

Do not upgrade React to 19 in this phase.

## Phase inputs

- Phase 3: `PASSED`
- Vite 8 development and production builds work
- Electron 43 file workflows pass
- Clean worktree
- Starting SHA recorded
- Current complete frontend test suite passes under the baseline Vitest

## Step 1 — Inventory existing tests and setup

Run:

```powershell
rg --files frontend |
  Where-Object { $_ -match '\.(test|spec)\.(ts|tsx)$' } |
  Sort-Object

rg -n --hidden --glob '!node_modules/**' `
  "from ['""]vitest['""]|vi\.|describe\(|test\(|it\(" frontend

rg -n --hidden --glob '!node_modules/**' `
  "createObjectURL|revokeObjectURL|ResizeObserver|matchMedia|HTMLMediaElement|IntersectionObserver" frontend vitest.config.ts
```

Inspect:

- `vitest.config.ts`
- any `vitest.setup.*` file;
- shared test helpers;
- tests added in Phase 2;
- generation hooks tests;
- GenSpace tests;
- gallery tests;
- music tests.

Record:

- number of test files;
- number of tests;
- baseline command;
- baseline duration;
- any existing console warnings;
- any tests that are skipped or flaky.

Do not rely on stale `AGENTS.md` text that says no frontend tests exist.

## Step 2 — Read the Vitest 4 migration guide

Review and record applicability for:

- changed mock construction and restoration semantics;
- `vi.restoreAllMocks`;
- mock names and snapshots;
- removed deprecated config options;
- third-argument test options;
- changed browser-mode API, if not used;
- V8 coverage changes, if not used;
- custom environment or pool settings, if not used.

AiVS currently uses a minimal jsdom configuration, so many changes may be `NOT USED`. Still record the review.

## Step 3 — Upgrade the test cluster

Use explicit commands:

```powershell
pnpm add -D vitest@<EXACT_REVIEWED_4_1_PATCH>
pnpm add -D jsdom@<EXACT_REVIEWED_COMPATIBLE_PATCH>
pnpm add -D @testing-library/react@<EXACT_REVIEWED_COMPATIBLE_PATCH>
pnpm add -D @testing-library/user-event@<EXACT_REVIEWED_COMPATIBLE_PATCH>
```

Do not explicitly add transitive packages unless required by a peer dependency or direct import.

Inspect:

```powershell
pnpm list vitest jsdom @testing-library/react @testing-library/user-event --depth 0
pnpm why vitest
pnpm why vite
git diff -- package.json pnpm-lock.yaml
```

Replace every placeholder with an exact reviewed stable version. Do not use an unbounded `latest` tag. At this phase React is still 18.3, so verify the selected Testing Library and user-event releases support both the current React 18 baseline and the planned React 19 phase.

## Step 4 — Keep the Vitest config minimal

The existing configuration is approximately:

```ts
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'jsdom',
  },
})
```

Do not add broad configuration merely because the new version offers it.

Only add a setup file when repeated browser shims genuinely benefit from centralisation.

Potential justified config:

```ts
test: {
  environment: 'jsdom',
  setupFiles: ['./vitest.setup.ts'],
}
```

Do not turn on global APIs unless tests already depend on globals. Prefer explicit imports from `vitest`.

Do not enable coverage in this migration unless coverage was already part of project policy.

## Step 5 — Run the complete suite before editing tests

Run:

```powershell
pnpm test:frontend -- --reporter=verbose
```

Categorise every failure:

1. actual production regression exposed by new tooling;
2. Vitest mock semantics;
3. jsdom API/environment difference;
4. Testing Library query/timing behaviour;
5. React warning;
6. stale test expectation;
7. type-only compile failure;
8. flaky timing/concurrency.

Do not immediately update snapshots or assertions. Understand why output changed.

## Step 6 — Repair mock semantics

Audit patterns such as:

```ts
vi.restoreAllMocks()
vi.resetAllMocks()
vi.clearAllMocks()
vi.fn(...)
vi.spyOn(...)
```

Rules:

- `restoreAllMocks` should restore manual spies, not be relied upon to reset every automock;
- clear call history explicitly where a test depended on old cross-test behaviour;
- preserve original mock implementations intentionally;
- avoid tests sharing mutable mock state;
- do not make test order significant;
- update snapshots only when the production output is genuinely correct.

Add `afterEach` cleanup in the smallest relevant scope.

## Step 7 — Consolidate browser API shims only where useful

AiVS tests may need jsdom shims for:

- `URL.createObjectURL`;
- `URL.revokeObjectURL`;
- `ResizeObserver`;
- media element methods;
- `matchMedia`;
- drag/drop `DataTransfer`;
- Electron preload API mocks.

If the same shim appears in three or more files, move it into a typed `vitest.setup.ts` or a shared test helper.

Example approach:

```ts
Object.defineProperty(URL, 'createObjectURL', {
  configurable: true,
  value: vi.fn(() => 'blob:test'),
})
```

Reset mock call state between tests.

Do not globally fake APIs whose per-test behaviour needs to vary.

## Step 8 — Strengthen file-import regression coverage

Electron 43's removed `File.path` is a high-value regression boundary.

Ensure tests cover:

### Native path helper

- returns the preload bridge result;
- returns `null` when bridge is unavailable;
- trims/rejects an empty path;
- does not inspect a non-standard `file.path` in final production implementation.

### Gallery import

- normal Electron file calls `getPathForFile`;
- native path is passed to `importToProjectAssets`;
- `no-path` is returned only when the bridge has no path;
- unsupported file types still return `unsupported`;
- duplicate prompt/reuse/suffix/cancel still behaves;
- existing asset by path is reused;
- file URL conversion remains correct on Windows.

### Input attachment

- native file imported into gallery first;
- existing project asset is reused;
- browser-only/pathless File gets an object URL;
- owned object URLs are revoked when appropriate;
- gallery drags bypass unnecessary copies.

Use typed `window.electronAPI` test fixtures rather than `as any` across tests. A narrowly typed partial helper is acceptable.

## Step 9 — Add a preload API contract test where practical

Do not attempt to run Electron's actual preload in jsdom.

Instead, keep the renderer-facing API type testable:

- compile-time contract includes `getPathForFile`;
- test helper creates a complete or intentionally typed partial `electronAPI`;
- production call sites do not use undocumented properties.

If a small pure factory or type extraction makes this easier without redesigning preload, add it. Avoid a large preload refactor.

## Step 10 — Testing Library migration discipline

When queries fail:

Prefer:

```text
getByRole
findByRole
getByLabelText
within
userEvent.setup()
```

Avoid adding implementation-detail selectors merely to silence failures.

Use `await user.click(...)`, `await user.type(...)`, and async queries when the UI updates asynchronously.

Do not insert arbitrary sleeps. Use observable state and `waitFor` only where needed.

If a component lacks an accessible role/label and adding one improves the real product, a small accessibility fix is acceptable and should be documented as such.

## Step 11 — Run focused suites during repairs

Use valid file filters, for example:

```powershell
pnpm exec vitest run frontend/lib/native-file-path.test.ts
pnpm exec vitest run frontend/lib/media-import.test.ts
pnpm exec vitest run frontend/hooks/generation
pnpm exec vitest run frontend/views/genspace
```

Do not rely solely on focused tests. The complete suite is mandatory at exit.

## Step 12 — Check for open handles and accidental watch mode

Run:

```powershell
pnpm test:frontend
```

Expected:

- process exits;
- no watch mode;
- no orphan Vite/esbuild/Rolldown process;
- no unhandled promise rejection;
- no repeated timers left active;
- no network call to the real backend.

If a test hangs:

- identify open timers/listeners;
- clean them up;
- do not globally force process exit.

## Step 13 — Run Tier A

```powershell
git diff --check
pnpm typecheck:ts
pnpm test:frontend
pnpm build:frontend
```

Phase 4 does not require a full installer build unless test-stack changes unexpectedly alter the Vite dependency tree. Still launch `pnpm dev` once to confirm the application was not affected.

## Step 14 — Review test quality

Before committing, verify:

- no test deleted without replacement and explanation;
- no assertion weakened from exact behaviour to mere existence without cause;
- no broad `vi.mock` added to hide integration behaviour;
- no global `any` fixture;
- no test marked `skip` or `todo` to obtain green;
- no real filesystem/project data used;
- no backend/model download triggered;
- tests are deterministic on Windows path separators.

## Step 15 — Diff review

Expected changes:

- `package.json`
- `pnpm-lock.yaml`
- `vitest.config.ts`
- optional `vitest.setup.ts`
- frontend test files/helpers
- very small accessibility or production fixes proven by tests
- status documentation

Unexpected:

- Tailwind migration;
- React 19;
- production feature redesign;
- backend package changes.

## Suggested commits

```text
chore(test): migrate frontend suite to Vitest 4
test(electron): harden native file import regression coverage
test(frontend): consolidate jsdom environment shims
```

## Exit gate

Phase 4 passes only when:

- [ ] exact test package versions recorded;
- [ ] Vitest 4 migration guide reviewed;
- [ ] all existing test files accounted for;
- [ ] complete suite passes and exits;
- [ ] no tests were hidden or weakened improperly;
- [ ] native file path and media import regressions are covered;
- [ ] jsdom shims are deterministic;
- [ ] TypeScript check passes;
- [ ] Vite production build passes;
- [ ] development app still launches;
- [ ] protected runtime diff guard is clean;
- [ ] commits and evidence recorded;
- [ ] `STATUS.md` marked `PASSED`.

Do not begin Tailwind migration with flaky or incomplete frontend tests.
