# Phase 8 — TypeScript 5.9 → TypeScript 6 Bridge Migration

## Objective

Upgrade AiVS from the currently resolved TypeScript 5.9 line to the latest stable patch in the TypeScript 6.0 family, resolve genuine compatibility issues, and leave the repository ready for a later TypeScript 7 evaluation.

TypeScript 6 is the approved compiler for the main modernisation branch. **Do not install TypeScript 7 in this phase.** TypeScript 7 uses a new native implementation and has a different tool-API compatibility story; it is evaluated separately in Phase 12 on a new branch after this work merges.

This phase must preserve:

- the existing strictness level;
- `noUnusedLocals` and `noUnusedParameters`;
- the renderer's bundler-oriented module resolution;
- the CommonJS Electron preload output;
- Vite 8 and Vitest 4 operation;
- the current runtime JavaScript behaviour.

Do not weaken compiler settings merely to obtain a green build.

## Why this phase is isolated

A compiler upgrade can reveal latent typing defects across otherwise unrelated features. Keeping it separate means:

- every diagnostic can be attributed to TypeScript 6;
- fixes remain reviewable;
- React 19 type changes have already settled;
- no package or UI migration can hide behind compiler churn;
- rollback does not affect the working runtime/toolchain upgrades.

## Phase inputs

- Phase 7: `PASSED`
- Clean worktree
- Starting SHA recorded in `STATUS.md`
- React 19 build and tests passing
- Vite 8 and Vitest 4 passing
- Current effective compiler configuration captured
- Node 24 LTS and `pnpm@10.30.3` active

## Approved target

At execution time:

1. resolve the newest stable `typescript@6.0.x`;
2. read its official release and migration notes;
3. record the exact version;
4. do not select a beta, release candidate, nightly, `next`, or TypeScript 7 package.

Example installation shape:

```powershell
pnpm add -D typescript@6.0.x
```

Replace `x` with the exact reviewed patch.

## Step 1 — Capture the TypeScript 5.9 baseline

Record:

```powershell
node --version
pnpm --version
pnpm exec tsc --version
pnpm exec tsc --showConfig > .tmp-tsconfig-frontend-before.json
pnpm exec tsc -p tsconfig.node.json --showConfig > .tmp-tsconfig-node-before.json
```

Do not commit the temporary effective-config files. Store them outside the repository or delete them after comparison.

Run and record:

```powershell
pnpm typecheck:ts
pnpm test:frontend
pnpm build:frontend
```

Any pre-existing warning or error must be resolved or explicitly marked as baseline before installing TypeScript 6.

## Step 2 — Audit all TypeScript configuration and compiler consumers

Read:

- `tsconfig.json`
- `tsconfig.node.json`
- any nested `tsconfig*.json`
- `vite.config.ts`
- `vitest.config.ts`
- `package.json`
- scripts that invoke `tsc`
- packages that programmatically consume TypeScript, if any

Search:

```powershell
rg -n --hidden --glob '!node_modules/**' --glob '!release/**' `
  "typescript|tsc|transpileModule|createProgram|createLanguageService|tsserver|CompilerOptions" .

rg -n --hidden --glob 'tsconfig*.json' `
  "ignoreDeprecations|moduleResolution|module|target|baseUrl|paths|importsNotUsedAsValues|preserveValueImports|outFile|downlevelIteration|esModuleInterop" .

rg -n --hidden --glob '!node_modules/**' --glob '!release/**' `
  "@ts-ignore|@ts-expect-error|eslint-disable.*typescript|as any|:\s*any\b" frontend electron
```

The last search is an audit, not an order to rewrite all existing escapes. Record only:

- suppressions touched by new diagnostics;
- stale `@ts-expect-error` directives;
- new casts introduced by the migration;
- unusually broad existing escapes in the exact code being edited.

## Step 3 — Review TypeScript 6 changes against this repository

Build a short applicability checklist in `STATUS.md`.

At minimum, inspect for:

- newly deprecated compiler options;
- changes to module/module-resolution validation;
- changes to inferred types and control-flow narrowing;
- changes to DOM or Node library types;
- changes affecting JSX/React declarations;
- changes affecting project references;
- stricter handling of invalid configuration;
- changes to emitted helper or declaration behaviour, even though AiVS uses `noEmit`;
- tool consumers that require a specific TypeScript API version.

Do not add `ignoreDeprecations` pre-emptively. It may be used only as a temporary diagnostic tool while migrating a deprecated option, and it must not remain in the final config without a written owner-approved reason.

## Step 4 — Install TypeScript 6 only

Install the exact reviewed patch:

```powershell
pnpm add -D typescript@6.0.x
pnpm exec tsc --version
pnpm list typescript --depth 8
pnpm why typescript
```

Inspect the lockfile. Confirm that:

- the root uses TypeScript 6;
- no unrelated major package changed;
- any nested TypeScript copy belongs to a tool that intentionally pins it;
- no TypeScript 7/native preview package appeared.

Do not update Vite, React, Electron, Tailwind, Vitest, Node types, or test libraries in this initial step.

## Step 5 — Compare effective configuration

Generate the TypeScript 6 effective configurations:

```powershell
pnpm exec tsc --showConfig > .tmp-tsconfig-frontend-after.json
pnpm exec tsc -p tsconfig.node.json --showConfig > .tmp-tsconfig-node-after.json
```

Compare before and after. Check explicitly:

### Renderer

Expected invariants include:

```text
target: ES2020 unless deliberately reviewed
module: ESNext
moduleResolution: bundler
jsx: react-jsx
strict: true
noEmit: true
isolatedModules: true
noUnusedLocals: true
noUnusedParameters: true
path alias @/* → frontend/*
DOM libraries present
```

### Electron/config files

Expected invariants include:

```text
module: ESNext for source compilation
moduleResolution: bundler
strict: true
composite project remains valid
rootDir/outDir remain coherent
preload CommonJS is still controlled by the Vite/Rolldown build config
```

The TypeScript config does not itself need to emit the preload. Do not change it to CommonJS merely because the final preload artifact must be CJS.

Delete temporary effective-config files before committing.

## Step 6 — Run strict checks and triage diagnostics

Run:

```powershell
pnpm typecheck:ts
```

Do not start editing until diagnostics are grouped by root cause.

Use this classification:

```text
A. Compiler-option incompatibility or deprecation
B. Standard library / DOM / Node type change
C. React 19 declaration interaction
D. Improved inference exposing real unsafe code
E. Stale suppression
F. Third-party declaration incompatibility
G. Existing unrelated error
```

For each group, record:

- representative diagnostic code;
- files affected;
- intended minimal fix;
- whether runtime behaviour changes.

### Fixing rules

- Prefer correcting types and control flow over casting.
- Prefer `unknown` plus narrowing over `any`.
- Use type-only imports when a symbol is not used at runtime.
- Preserve error handling and nullability semantics.
- Do not disable `strict`.
- Do not disable unused checks.
- Do not set `skipLibCheck: false` as an opportunistic cleanup; the repo currently intentionally uses `skipLibCheck: true`.
- Do not globally exclude a file simply because it fails.
- Do not introduce `// @ts-ignore`.
- A new `@ts-expect-error` requires a precise explanation and should be treated as a last resort.
- Never edit third-party files in `node_modules`.

If a dependency's declarations are incompatible, first confirm a compatible stable package version exists. Any dependency update must be isolated and documented; do not perform the general Phase 9 refresh early.

## Step 7 — Validate both TypeScript projects explicitly

Run:

```powershell
pnpm exec tsc -p tsconfig.json --noEmit
pnpm exec tsc -p tsconfig.node.json --noEmit
pnpm typecheck:ts
```

The standalone commands are intentional. They confirm both renderer and Electron/config scopes rather than relying on one command's implicit project selection.

Inspect generated directories to ensure no unexpected JS or declaration output was produced.

## Step 8 — Run the toolchain compatibility gate

Run:

```powershell
pnpm test:frontend
pnpm build:frontend
```

Then launch development mode:

```powershell
pnpm dev
```

Validate:

- Vite parses all TS/TSX files;
- Vitest transforms and runs tests;
- Electron main and preload build;
- one window opens;
- no config-loader or declaration-resolution failure occurs;
- HMR works after a harmless source edit;
- preload APIs remain available;
- no source-map path error appears.

TypeScript itself is not the production transpiler in this stack, so a green `tsc` alone does not prove Vite/Rolldown compatibility.

## Step 9 — Run packaged validation

Run:

```powershell
pnpm build:fast:win
pnpm start:unpacked:win
```

Perform a concise smoke:

- open existing project;
- switch GenSpace modes;
- open Settings and Model Manager;
- attach local media;
- open Director and Video Editor;
- close cleanly.

No visual change is expected.

## Step 10 — Audit suppressions after migration

Rerun:

```powershell
rg -n --hidden --glob '!node_modules/**' --glob '!release/**' `
  "@ts-ignore|@ts-expect-error|ignoreDeprecations|as any|:\s*any\b" frontend electron tsconfig*.json
```

Compare with the pre-phase audit.

Exit expectations:

- no new `@ts-ignore`;
- no unjustified new `@ts-expect-error`;
- no permanent `ignoreDeprecations` added merely to suppress work;
- no broad new `any`;
- stale `@ts-expect-error` directives removed if TypeScript 6 reports them.

Do not expand this into a repository-wide type-cleanup project.

## Step 11 — Update stack documentation

Update only factual version references that became stale, for example:

- `AGENTS.md`
- `.projectmem` only if its normal workflow requires it
- dependency modernisation docs/status
- contributor setup docs if they name TypeScript directly

Do not manually edit generated project-memory files unless repository rules require it.

Add a note that TypeScript 7 remains a separate evaluation after this branch merges.

## Step 12 — Review the diff

Expected files:

```text
package.json
pnpm-lock.yaml
tsconfig*.json only where a proven TypeScript 6 compatibility change is needed
frontend/**/*.ts(x) and electron/**/*.ts only for necessary diagnostic fixes
tests accompanying real fixes
AGENTS.md or contributor docs where version text is stale
STATUS.md
```

Verify protected runtime files remain untouched.

Check for mass line-ending or formatter churn. Revert it.

## Step 13 — Commit

Recommended commit title:

```text
chore(tooling): migrate to TypeScript 6
```

Commit body:

- exact compiler before/after;
- configuration changes;
- diagnostic categories fixed;
- whether any runtime code changed;
- tests/builds/smokes run;
- explicit statement that TypeScript 7 was not introduced.

Record the commit SHA and all evidence in `STATUS.md`.

## Exit gate

Phase 8 passes only when:

- the root compiler is the approved stable `6.0.x` patch;
- TypeScript 7 is absent;
- both TS projects pass strict checks;
- strictness and unused checks remain enabled;
- no unexplained deprecation suppression exists;
- no unsafe broad cast was added merely to pass;
- complete frontend tests pass;
- Vite/Electron production build passes;
- development and unpacked apps launch;
- no visual or behavioural regression is found;
- documentation accurately records the compiler line;
- protected runtime files are untouched;
- the diff is phase-scoped;
- `STATUS.md` is complete;
- the phase is committed.

Do not begin Phase 9 before this gate is complete.

## Recovery procedure

If TypeScript 6 produces a very large diagnostic set:

1. Stop making scattered fixes.
2. Identify the first shared root cause.
3. Test a minimal fix in one representative file.
4. rerun the compiler;
5. apply the confirmed pattern narrowly;
6. keep unrelated cleanup out of the phase.

If Vite or Vitest fails while `tsc` passes:

1. capture the config-loader/transformer error;
2. inspect tool TypeScript API compatibility;
3. confirm the installed Vite/Vitest versions from earlier passed phases;
4. make the smallest tool-compatible adjustment;
5. do not jump to TypeScript 7.

If a blocker cannot be safely resolved, revert only the Phase 8 commit and report the exact diagnostic/tool incompatibility. Prior phases remain valid.
