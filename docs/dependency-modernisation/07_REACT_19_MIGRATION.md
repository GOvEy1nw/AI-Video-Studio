# Phase 7 — React 18.3 → React 19 Migration

## Objective

Upgrade the renderer from React 18.3 to the latest stable patch in the approved React 19.2 family while preserving all existing AiVS behaviour, project state, generation flows, Electron IPC usage, visual output, and test coverage.

This is a compatibility migration only. It does **not** authorise:

- a state-management rewrite;
- adoption of React Server Components;
- adoption of a framework;
- React Compiler enablement;
- replacement of Context with Zustand/Redux;
- component redesign;
- opportunistic hook rewrites;
- broad formatting or file moves.

At the time this plan was written, React 19.2 was the approved target family. Resolve the newest stable `19.2.x` patch at execution time and record it in `STATUS.md`. Do not jump to a later React minor or major without owner approval and a fresh release-note review.

## Why this phase is isolated

React 18.3 was intentionally designed as a warning bridge to React 19, and AiVS already uses the modern `createRoot` and automatic JSX transform. That lowers risk, but React 19 and the React 19 type packages can still expose:

- removed legacy APIs;
- stricter `ref` and callback-ref typing;
- JSX namespace assumptions;
- `useRef` calls without an initial value;
- deprecated `react-dom/test-utils` usage;
- test assumptions around `act`;
- effects or subscriptions that behave incorrectly under Strict Mode;
- third-party peer-dependency constraints.

The Vite, Vitest, and Tailwind migrations must already be complete so failures in this phase can be attributed to React rather than the surrounding toolchain.

## Phase inputs

- Phase 6: `PASSED`
- Clean worktree
- Starting SHA recorded in `STATUS.md`
- Vite 8, Vitest 4, and Tailwind 4 working
- Baseline screenshots still available
- Full frontend suite passing before the version change
- Existing app data backed up

## Required target group

Upgrade these together:

```text
react
react-dom
@types/react
@types/react-dom
```

Do not leave runtime packages on React 19 with React 18 types, or vice versa.

Keep `@testing-library/react` and `@testing-library/user-event` unchanged in the first React commit unless their existing versions do not support React 19. If peer constraints require updates, document that evidence and make the smallest compatible test-library update in a separate sub-commit within this phase.

## Step 1 — Read current migration material

Before editing, review the official React 19 upgrade guide and the release notes for the exact patch being installed.

Record in `STATUS.md`:

- exact current versions;
- intended exact versions;
- Node and TypeScript versions;
- any migration items relevant to this repository;
- any third-party package with a React peer range that excludes React 19.

Do not rely solely on a package manager's ability to install the graph.

## Step 2 — Inventory React APIs and type-risk patterns

Run repository-wide searches:

```powershell
rg -n --hidden --glob '!node_modules/**' --glob '!release/**' `
  "ReactDOM\.render|ReactDOM\.hydrate|unmountComponentAtNode|findDOMNode|createFactory" frontend electron

rg -n --hidden --glob '!node_modules/**' --glob '!release/**' `
  "react-dom/test-utils|from ['""]react-dom['""]|require\(['""]react-dom['""]\)" frontend

rg -n --hidden --glob '!node_modules/**' --glob '!release/**' `
  "string\s+ref|ref=['""][A-Za-z_$][A-Za-z0-9_$]*['""]|legacyContextTypes|childContextTypes" frontend

rg -n --hidden --glob '!node_modules/**' --glob '!release/**' `
  "defaultProps\s*=|propTypes\s*=|contextTypes\s*=" frontend

rg -n --hidden --glob '!node_modules/**' --glob '!release/**' `
  "useRef<[^>]+>\(\)|useRef\(\)" frontend

rg -n --hidden --glob '!node_modules/**' --glob '!release/**' `
  "namespace JSX|JSX\.(Element|IntrinsicElements|LibraryManagedAttributes)" frontend electron
```

Also inspect:

- `frontend/main.tsx`;
- application context providers;
- all custom hooks with subscriptions, polling, timers, object URLs, or native event listeners;
- portal/modal code;
- media preview components;
- timeline code;
- tests that render under Strict Mode or inspect exact call counts.

Record findings before changing versions.

## Step 3 — Audit package peer compatibility

Use the installed graph and registry metadata:

```powershell
pnpm why react
pnpm why react-dom
pnpm list react react-dom --depth 8
pnpm outdated
```

Pay particular attention to:

- `react-dropzone`;
- `lucide-react`;
- `class-variance-authority`;
- `tailwind-merge`;
- `@testing-library/react`;
- any newly introduced package from previous phases.

Rules:

- A peer warning must be investigated, not suppressed.
- Do not use `--force`, `--legacy-peer-deps`, or equivalent.
- Do not add a broad `pnpm.peerDependencyRules.ignoreMissing` or `allowedVersions` escape hatch merely to make installation succeed.
- Upgrade or replace a dependency only when its compatibility issue is proven and the change remains phase-scoped.

## Step 4 — Capture a final React 18 warning baseline

Before upgrading:

```powershell
pnpm typecheck:ts
pnpm test:frontend
pnpm build:frontend
```

Launch the application in development mode and inspect both the terminal and renderer console for React warnings:

```powershell
pnpm dev
```

Navigate through at least:

- Home/project selection;
- GenSpace Image;
- GenSpace Video;
- GenSpace Music;
- Settings;
- Model Manager;
- Director;
- Video Editor.

Record existing React warnings separately from new warnings. Do not misattribute a pre-existing warning to React 19.

## Step 5 — Upgrade the React group

Use exact target-family versions rather than an unbounded `latest` command. Example shape:

```powershell
pnpm add react@19.2.x react-dom@19.2.x
pnpm add -D @types/react@19.2.x @types/react-dom@19.2.x
```

Replace `x` with the exact reviewed patch. Verify:

```powershell
pnpm list react react-dom @types/react @types/react-dom --depth 0
pnpm why react
pnpm why react-dom
```

Inspect `package.json` and `pnpm-lock.yaml`. Confirm:

- one intended React runtime version;
- no accidental duplicate React 18 runtime;
- the lockfile contains no unrelated Python/runtime change;
- no unrelated package major was pulled in.

## Step 6 — Run TypeScript immediately

Run:

```powershell
pnpm typecheck:ts
```

Categorise every failure before editing:

```text
A. Removed runtime API
B. React 19 type change
C. Third-party type mismatch
D. Existing defect newly exposed
E. Unrelated regression
```

Fix only categories A–D that are necessary for React 19 compatibility.

### Common migration patterns to handle deliberately

#### `useRef` initial values

Where React 19 types require an explicit initial value, choose the semantically correct value:

```ts
const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
```

Do not silence the error with `as any`.

#### Callback refs

A concise callback ref can accidentally return the assigned value:

```tsx
// Risky
ref={(node) => map.set(id, node)}
```

Use an explicit block and cleanup where ownership requires it:

```tsx
ref={(node) => {
  if (node) {
    map.set(id, node)
  } else {
    map.delete(id)
  }
}}
```

Do not add cleanup semantics blindly; understand how the ref is used.

#### JSX namespace

Move library-style global `JSX` references to React-scoped types when required, for example:

```ts
React.JSX.Element
React.JSX.IntrinsicElements
```

Use type-only imports where appropriate.

#### Element props

If code assumes untyped `ReactElement["props"]`, add a real generic or narrow safely. Do not cast the entire value to `any`.

#### Test `act`

Use `act` from `react` or rely on Testing Library's wrapped APIs. Remove imports from `react-dom/test-utils` only where they actually exist.

#### Function component defaults

If removed/deprecated default-prop patterns exist on function components, migrate to parameter defaults without changing runtime semantics.

## Step 7 — Consider official codemods narrowly

The official React codemods may be useful for specific known transformations, but they are not permission for a repository-wide uncontrolled rewrite.

Before running any codemod:

1. Commit or stash no changes; worktree must be reviewable.
2. Record the exact codemod command in `STATUS.md`.
3. Run it only against relevant frontend paths.
4. Review every resulting line.
5. Revert unrelated formatting or speculative transformations.

Do not run a broad recipe if manual fixes are fewer and clearer.

## Step 8 — Run the focused automated gate

Run in this order:

```powershell
pnpm typecheck:ts
pnpm test:frontend
pnpm build:frontend
```

Then inspect for duplicate runtime copies:

```powershell
pnpm list react react-dom --depth 20
```

Exit criteria for this step:

- zero TypeScript errors;
- full frontend suite passes;
- production frontend/Electron bundle succeeds;
- no duplicate incompatible React runtime;
- no peer warning left unexplained.

## Step 9 — Development-runtime smoke test

Launch:

```powershell
pnpm dev
```

Validate:

### Application shell

- one window opens;
- no blank renderer;
- no uncaught render error;
- no infinite re-render;
- no new Strict Mode warning;
- routing between major views remains stable.

### Context and persistence

- create/open a project;
- project state is available in all expected views;
- settings open and save;
- a reload preserves expected project/settings state;
- no provider resets or remount loops.

### GenSpace

- switch Image/Video/Music modes repeatedly;
- prompt entry remains responsive;
- model selectors open and close;
- media inputs attach and clear;
- generation state displays and cancels correctly using a safe test or available backend;
- gallery cards render and preview.

### Director and editor

- timeline selection and playhead updates work;
- add/select/move a segment where safe;
- modal and context-menu portals mount correctly;
- keyboard shortcuts do not double-fire.

### Media lifecycle

- image/video/audio previews mount;
- object URLs are not leaked or revoked prematurely;
- waveform and video listeners do not multiply after navigation;
- file import still works through Electron's path bridge.

Watch both terminal and renderer console. New React warnings are phase failures unless documented as an upstream dependency issue with a safe mitigation.

## Step 10 — Packaged-runtime validation

Run:

```powershell
pnpm build:fast:win
pnpm start:unpacked:win
```

Confirm:

- app starts from `file://`;
- React renders identically to development;
- preload API is present;
- dialogs and file imports still work;
- navigation and state providers behave correctly;
- no production-only minification/runtime error occurs.

A frontend-only Vite build is not sufficient.

## Step 11 — Visual parity check

Compare the post-upgrade app to the Phase 6 approved screenshots for:

- GenSpace Image;
- GenSpace Video;
- GenSpace Music;
- Settings;
- Model Manager;
- Director;
- Video Editor;
- setup screen where practical.

React should not alter visual output. Any difference must be traced and fixed rather than accepted as “probably React.”

## Step 12 — Review the diff

The expected file set is small:

```text
package.json
pnpm-lock.yaml
frontend/**/*.tsx or *.ts only where React 19 compatibility requires it
tests affected by real migration changes
STATUS.md
possibly AGENTS.md if its stack description is being maintained phase-by-phase
```

Unexpected files require investigation.

Explicitly verify that this phase did not alter:

```text
backend/pyproject.toml
backend/uv.lock
scripts/wangp-stacks.json
scripts/wangp-source.json
Wan2GP/
Tailwind theme/layout code
Vite configuration except a narrowly proven React-plugin compatibility fix
```

## Step 13 — Commit

Recommended commit title:

```text
chore(deps): migrate renderer to React 19
```

The commit body should include:

- exact before/after versions;
- compatibility fixes made;
- peer-dependency findings;
- tests run;
- development and unpacked smoke results;
- any known limitation.

Update `STATUS.md` with the commit SHA and evidence before marking the phase `PASSED`.

## Exit gate

Phase 7 passes only when all are true:

- React and React DOM use the approved `19.2.x` patch;
- React types use a compatible React 19 patch;
- no incompatible duplicate React runtime exists;
- strict TypeScript passes;
- the complete frontend test suite passes;
- Vite/Electron production build passes;
- development and unpacked Electron launch correctly;
- no new React warning or error remains unexplained;
- project/context state remains stable;
- file, media, generation, Director, and editor smoke checks pass;
- visual parity is approved;
- the diff is phase-scoped;
- `STATUS.md` contains complete evidence;
- the phase is committed.

Do not begin Phase 8 before this gate is complete.

## Recovery procedure

If the app no longer renders:

1. Capture the first renderer exception and stack trace.
2. Confirm only one React runtime is installed.
3. Check provider/portal/ref compatibility before changing Vite or Electron.
4. Reproduce in a focused test.
5. Fix the smallest root cause.
6. Rerun the full phase gate.

If a dependency does not support React 19:

1. Record its exact peer range and usage.
2. Determine whether a compatible stable version exists.
3. Upgrade that dependency in an isolated sub-commit.
4. If no safe version exists, stop the phase and report the blocker; do not bypass peer validation.

Rollback only the Phase 7 commit if the root cause cannot be safely resolved. Do not roll back prior passed phases.
