# Phase 3 — Vite 5 → Vite 8 Toolchain Migration

## Objective

Upgrade AiVS from Vite 5 to the Vite 8.1 family and migrate its Electron/Vite integration with the smallest possible configuration change.

This phase must preserve:

- Electron 43 behaviour established in Phase 2;
- React 18.3;
- Tailwind CSS 3.4;
- current renderer output;
- CommonJS preload output;
- relative production asset paths;
- development startup, HMR, preload reload, and Electron main restart behaviour.

Do not upgrade Vitest, Tailwind, React, or TypeScript in this phase.

## Target dependency family

Resolve the newest stable patches in these families at execution time:

```text
vite                         8.1.x
@vitejs/plugin-react         6.x
vite-plugin-electron         1.x
vite-plugin-electron-renderer remove if confirmed unnecessary
```

At the time this plan was written:

- Vite 8.1 was the current stable minor;
- `vite-plugin-electron` 1.0 supported Vite 7 and Vite 8;
- the plugin adapts build config keys between `rollupOptions` and `rolldownOptions`;
- Vite 8 uses Rolldown/Oxc rather than Vite 5's esbuild/Rollup combination.

## Phase inputs

- Phase 2: `PASSED`
- Electron 43 packaged app works
- `File.path` migration complete
- Clean worktree
- Starting SHA recorded
- Node 24 LTS active
- Current Vite config backed up in git

## Step 1 — Inspect current build contract

Read:

- `vite.config.ts`
- `tsconfig.json`
- `tsconfig.node.json`
- `frontend/vite-env.d.ts`
- `package.json`
- `electron-builder.yml`
- `electron/window.ts`
- `electron/preload.ts`

Record the current invariants:

```text
renderer output: dist/
Electron output: dist-electron/
main entry: electron/main.ts
preload entry: electron/preload.ts
preload format: cjs
renderer base: ./
alias: @ -> ./frontend
production entry: dist/index.html
```

Do not change these values casually.

## Step 2 — Audit whether `vite-plugin-electron-renderer` is actually needed

AiVS is designed to communicate with Electron exclusively through `window.electronAPI`.

Search the renderer:

```powershell
rg -n --hidden --glob '!node_modules/**' --glob '!release/**' `
  "from ['""]electron['""]|require\(['""]electron['""]\)" frontend

rg -n --hidden --glob '!node_modules/**' --glob '!release/**' `
  "from ['""]node:[^'""]+['""]|require\(['""](fs|path|os|child_process|crypto|stream|buffer)['""]\)" frontend

rg -n --hidden --glob '!node_modules/**' --glob '!release/**' `
  "process\.versions\.electron|process\.platform|__dirname|__filename" frontend
```

### Removal decision

Remove `vite-plugin-electron-renderer` only if:

- no frontend source imports Electron directly;
- no frontend source imports Node built-ins;
- no renderer feature relies on its polyfills;
- development and production builds work without it.

If direct renderer imports exist:

1. Determine whether they should be migrated behind the existing preload bridge.
2. Prefer a narrow preload API rather than retaining direct renderer Node access.
3. Keep this migration tightly scoped.
4. Do not enable `nodeIntegration`.
5. If migration would become a broad feature refactor, retain the plugin temporarily and record a follow-up issue.

The likely desired end state is removal, but evidence controls the decision.

## Step 3 — Capture Vite 5 build evidence

Before changing dependencies, record:

```powershell
Measure-Command { pnpm build:frontend }
```

Capture:

- total build time;
- output file list;
- renderer bundle sizes;
- `dist-electron/main.js`;
- `dist-electron/preload.js`;
- preload format;
- source-map generation;
- startup behaviour.

This is diagnostic evidence, not a performance promise. Vite 8 may produce differently named chunks.

## Step 4 — Upgrade the Vite compatibility cluster

Use explicit package commands:

```powershell
pnpm add -D vite@<EXACT_REVIEWED_8_1_PATCH>
pnpm add -D @vitejs/plugin-react@<EXACT_REVIEWED_6_PATCH>
pnpm add -D vite-plugin-electron@<EXACT_REVIEWED_1_PATCH>
```

If the audit approved removal:

```powershell
pnpm remove vite-plugin-electron-renderer
```

Do not upgrade Vitest yet, even if peer warnings appear. Record the warning and continue only if Vite can install with the current Vitest. If the current Vitest creates an unresolvable peer conflict, stop and document whether Phase 4 must be merged into the same installation transaction while keeping code changes independently committed.

Inspect:

```powershell
pnpm list vite @vitejs/plugin-react vite-plugin-electron --depth 0
pnpm why vite
pnpm why rolldown
pnpm why @vitejs/plugin-react
pnpm why vite-plugin-electron
git diff -- package.json pnpm-lock.yaml
```

Record exact versions.

## Step 5 — Preserve the existing flat Electron plugin API first

The current config uses the flat API with two entries and custom `onstart` handlers. Do not switch to the simple or multi-environment API during the first passing migration.

Keep the architecture conceptually equivalent:

```ts
electron([
  {
    entry: 'electron/main.ts',
    onstart: async (options) => {
      if (process.env.ELECTRON_DEBUG) {
        await options.startup([
          '--inspect=9229',
          '--remote-debugging-port=9222',
          '.',
          '--no-sandbox',
        ])
      } else {
        await options.startup()
      }
    },
    vite: {
      build: {
        outDir: 'dist-electron',
        sourcemap: true,
        // initially retain compatible config, then modernise below
      },
    },
  },
  {
    entry: 'electron/preload.ts',
    onstart(options) {
      options.reload()
    },
    vite: {
      build: {
        outDir: 'dist-electron',
        sourcemap: true,
        // preload must remain cjs
      },
    },
  },
])
```

Important:

- In `vite-plugin-electron` 1.x, `startup()` returns a promise. Await it.
- Preserve the current debug argument ordering.
- Preserve the normal startup behaviour.
- Do not adopt plugin environment variables merely for novelty.
- Do not move backend startup responsibility into the Vite config.

If the renderer plugin was removed, remove its import and `renderer()` plugin invocation.

## Step 6 — Move build options to the Vite 8-native key after the first pass

The plugin can adapt old keys, but the long-term config should use Vite 8 terminology once the dependency upgrade has passed once.

Replace relevant uses under Vite 8:

```ts
build: {
  rolldownOptions: {
    external: ['electron'],
  },
}
```

For preload:

```ts
build: {
  rolldownOptions: {
    output: {
      format: 'cjs',
    },
  },
}
```

Do this as a second small config step, not simultaneously with unrelated restructuring.

If TypeScript types or plugin docs require the compatibility `rollupOptions` key for a specific nested config, follow the installed plugin's documented v1 API and record the reason. The non-negotiable result is correct output, not a cosmetic key rename.

## Step 7 — Preserve critical renderer settings

Do not remove:

```ts
base: './'
```

AiVS loads production assets from Electron's `file://` protocol. An absolute `/` base can create a blank installed renderer.

Preserve the alias:

```ts
'@': path.resolve(__dirname, './frontend')
```

Do not switch to Vite 8's optional `resolve.tsconfigPaths` in this phase. That is an independent cleanup with little current benefit.

Preserve:

```ts
build: {
  outDir: 'dist',
}
```

Do not enable experimental bundled dev mode in this migration. Vite 8.1's bundled dev mode is explicitly experimental and should be evaluated later, not used as a compatibility fix.

## Step 8 — Resolve Vite/Rolldown differences carefully

Run:

```powershell
pnpm build:frontend
```

Investigate errors in this order:

1. invalid or renamed config option;
2. Electron plugin API mismatch;
3. CJS preload output;
4. Node built-in externalisation;
5. dynamic imports;
6. asset URL handling;
7. CSS processing;
8. environment variable semantics;
9. plugin ordering;
10. package condition/export resolution.

Do not respond by:

- adding broad `external: /.*/`;
- disabling minification;
- turning off tree-shaking globally;
- bundling Electron into renderer output;
- changing application imports unrelated to the error;
- reverting Electron.

If an import relied on accidental Vite 5 resolution, make the import explicit and standards-compliant.

## Step 9 — Verify output structure

After a successful build, inspect:

```powershell
Get-ChildItem dist -Recurse | Select-Object FullName, Length
Get-ChildItem dist-electron -Recurse | Select-Object FullName, Length
```

Confirm:

- `dist/index.html` exists;
- asset URLs in `dist/index.html` are relative;
- renderer JavaScript and CSS chunks exist;
- `dist-electron/main.js` exists;
- `dist-electron/preload.js` exists;
- preload remains CommonJS;
- main/preload do not accidentally import unresolved build-only packages;
- `electron-builder.yml` still packages both output folders.

Search the built renderer for accidental Node/Electron imports:

```powershell
rg -n "require\(['""]electron['""]\)|from ['""]electron['""]|node:" dist
```

Expected: no problematic runtime imports.

## Step 10 — Typecheck

Run:

```powershell
pnpm typecheck:ts
```

Likely adjustments:

- Vite config option names;
- `onstart` async return types;
- plugin imports;
- Node path imports;
- `__dirname` typing in ESM config.

Do not migrate to the plugin's `esmShim` unless an actual `__dirname`/`__filename` runtime issue appears. The existing config currently works under ESM and should be changed minimally.

## Step 11 — Development-mode lifecycle tests

Launch:

```powershell
pnpm dev
```

Verify:

### Initial startup

- Vite starts.
- Electron main is built.
- Preload is built.
- one Electron app instance opens.
- renderer connects to the correct Vite URL.
- backend launch flow remains controlled by the renderer/Electron app, not duplicated by Vite.

### Renderer HMR

Change a harmless renderer string or development-only CSS rule.

Expected:

- renderer updates;
- app does not spawn a duplicate Electron process;
- project state behaviour remains reasonable;
- no stale port switch from 5173 to another port is silently inspected.

Revert the temporary edit.

### Preload reload

Make a harmless temporary preload log/type-safe change.

Expected:

- preload rebuild triggers reload according to the plugin;
- `window.electronAPI` remains available;
- no blank window.

Revert the temporary edit.

### Main process restart

Make a harmless temporary main-process change.

Expected:

- Electron restarts once;
- old process exits;
- backend processes do not multiply;
- single-instance lock behaves.

Revert the temporary edit.

### Debug mode

Run:

```powershell
pnpm dev:debug
```

Verify:

- inspector port 9229;
- remote debugging port 9222;
- argument order works;
- app starts only once.

## Step 12 — Run frontend tests on the old Vitest once

Run:

```powershell
pnpm test:frontend
```

Current Vitest may be old, but it must still run or produce a clearly understood peer issue. Do not repair Vitest-specific test semantics here; Phase 4 owns that.

## Step 13 — Run Tier A and Tier B

Tier A:

```powershell
git diff --check
pnpm typecheck:ts
pnpm test:frontend
pnpm build:frontend
```

Tier B:

```powershell
pnpm typecheck:py
pnpm backend:test
pnpm build:fast:win
```

Run unpacked app and repeat:

- open existing project;
- file import;
- Settings;
- Director;
- one existing generation workflow where practical;
- clean close/restart.

## Step 14 — Production path verification

Run:

```powershell
pnpm start:unpacked:win
```

Inspect DevTools or logs for:

- failed `file://` requests;
- CSP failures;
- missing CSS;
- missing preload;
- unresolved modules;
- chunk-loading errors;
- blank renderer.

Do not accept a successful `vite build` when the unpacked Electron application is blank.

## Step 15 — Optional build comparison

Record Vite 8 build duration and output size using the same method as baseline.

Do not chase performance changes in this branch unless they indicate a regression caused by incorrect bundling. The migration goal is compatibility and maintainability.

## Step 16 — Diff review

Expected changes:

- `package.json`
- `pnpm-lock.yaml`
- `vite.config.ts`
- possibly removal of `vite-plugin-electron-renderer`
- small import/config corrections
- status documentation

Unexpected changes:

- Tailwind config;
- React source rewrites;
- backend runtime versions;
- broad asset-path changes;
- Electron security changes.

Run protected path guard.

## Suggested commits

```text
chore(build): upgrade Vite toolchain to Vite 8
refactor(build): remove unused Electron renderer plugin
refactor(build): use Vite 8 Rolldown options
```

Only create the removal commit if evidence supports removal.

## Exit gate

Phase 3 passes only when:

- [ ] exact Vite/plugin versions recorded;
- [ ] `vite-plugin-electron-renderer` is either safely removed or explicitly justified;
- [ ] flat Electron plugin behaviour remains equivalent;
- [ ] `startup()` is correctly awaited;
- [ ] renderer `base: './'` remains;
- [ ] CommonJS preload is preserved;
- [ ] Vite 8 development startup works;
- [ ] renderer HMR works;
- [ ] preload reload works;
- [ ] main restart works;
- [ ] debug mode works;
- [ ] Tier A passes;
- [ ] Tier B passes;
- [ ] unpacked production app loads without missing assets;
- [ ] Electron file import from Phase 2 still works;
- [ ] protected runtime diff guard is clean;
- [ ] phase commits and evidence recorded;
- [ ] `STATUS.md` marked `PASSED`.

Do not begin the Vitest migration until both development and production Electron builds run correctly under Vite 8.
