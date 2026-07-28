# Follow-Up Phase 12 — TypeScript 7 Evaluation on a Separate Branch

## Status and scope

This document is **not part of the mandatory dependency-modernisation branch**.

Do not execute it until:

1. Phases 1–11 have passed;
2. the modernisation pull request has merged into `dev`;
3. `dev` is stable;
4. the maintainer explicitly authorises a TypeScript 7 evaluation.

TypeScript 7 is stable, but it is a native Go implementation and TypeScript 7.0 does not ship a programmatic API. The official transition path supports running TypeScript 7's CLI side-by-side with the TypeScript 6 compatibility/API package. TypeScript 7.1 is expected to introduce a new API.

The goal here is to evaluate adoption honestly, not to force it.

## Required branch

Create a new branch from the post-merge `dev`:

```powershell
git fetch origin
git switch dev
git pull --ff-only origin dev
git status --short
git switch -c chore/typescript-7-evaluation
```

Never continue this work on:

```text
chore/dependency-modernisation-2026
```

Record the new baseline SHA in a fresh evaluation status note, for example:

```text
docs/typescript-7-evaluation/STATUS.md
```

## Possible outcomes

This phase must end in one explicit outcome:

### Outcome A — Adopt

Use TypeScript 7 for CLI typechecking while retaining TypeScript 6 compatibility/API support for tools that still need it.

### Outcome B — Defer to TypeScript 7.1+

Keep TypeScript 6 as the project compiler because the absent 7.0 API, editor/tool integration, config friction, or platform support outweighs the measured benefit.

### Outcome C — Reject current release

A reproducible correctness, diagnostic, native-binary, or workflow regression makes the current TypeScript 7 patch unsuitable. Record an upstream issue and remain on TypeScript 6.

“Installed successfully” is not enough for Outcome A.

## Evaluation inputs

- Modernisation PR merged and stable
- TypeScript 6.0.x passes all checks
- No `ignoreDeprecations` escape hatch
- Node 24 LTS and pnpm 10.30.3
- Vite 8, Vitest 4, React 19
- Clean worktree
- Stable local and hosted CI
- Current supported OS list known

## Step 1 — Read the current official TypeScript 7 guidance

Read the stable TypeScript 7 announcement and any newer TypeScript 7.0 patch notes.

Record:

- exact TypeScript 7 patch;
- exact `@typescript/typescript6` compatibility patch;
- whether TypeScript 7.1 has since shipped;
- current programmatic API status;
- installation/alias guidance;
- current editor integration guidance;
- known limitations;
- supported platforms and architectures.

### Version-decision rule

If TypeScript 7.1 or later is stable by execution time:

- do **not** blindly follow this 7.0 side-by-side recipe;
- read its API/migration notes;
- update the evaluation design;
- keep the work on the separate branch.

## Step 2 — Audit compiler API consumers

Search the repository and dependency graph:

```powershell
rg -n --hidden --glob '!node_modules/**' --glob '!release/**' `
  "from ['""]typescript['""]|require\(['""]typescript['""]\)|tsserver|createProgram|createLanguageService|transpileModule|CompilerHost" .

pnpm why typescript
pnpm list typescript --depth 20
```

Inspect whether any tool expects the JavaScript TypeScript API:

- lint tooling, if added later;
- custom scripts;
- API extractors;
- code generators;
- editor plugins;
- test transformers;
- Vite/Vitest plugins.

Record each consumer and whether the TypeScript 6 alias will satisfy it.

Do not assume “no source import” means no dependency consumes the package.

## Step 3 — Make TypeScript 6 maximally comparable

TypeScript 7 uses stable type ordering and rejects constructs/options deprecated in TypeScript 6.

Under TypeScript 6:

1. confirm there is no `ignoreDeprecations`;
2. review all TypeScript 6 deprecation warnings;
3. enable or test the official `stableTypeOrdering` compatibility option if it remains applicable;
4. run both projects;
5. commit any legitimate transition preparation separately.

Commands:

```powershell
pnpm exec tsc --version
pnpm exec tsc -p tsconfig.json --noEmit
pnpm exec tsc -p tsconfig.node.json --noEmit
pnpm typecheck:ts
```

If `stableTypeOrdering` changes diagnostics or snapshot text, understand and resolve that under TypeScript 6 before installing 7.

## Step 4 — Capture TypeScript 6 correctness and performance baseline

Run at least five measured TypeScript 6 checks after one warmup.

PowerShell example:

```powershell
pnpm exec tsc --noEmit | Out-Null

1..5 | ForEach-Object {
  $elapsed = Measure-Command {
    pnpm exec tsc --noEmit --pretty false | Out-Null
  }
  [pscustomobject]@{
    Run = $_
    Milliseconds = [math]::Round($elapsed.TotalMilliseconds, 2)
  }
} | Tee-Object -Variable Ts6Timings
```

Also measure the Electron/config project if it is not included by the root command:

```powershell
pnpm exec tsc -p tsconfig.node.json --noEmit | Out-Null
```

Record:

- machine/CPU;
- Node version;
- cold/warm distinction;
- individual runs;
- median;
- mean;
- diagnostic count;
- peak memory where practical;
- exact compiler version.

Do not claim the upstream “up to 10x” result as an AiVS result.

## Step 5 — Install the official side-by-side layout

For TypeScript 7.0, use the official alias model rather than replacing every tool's expected API package.

The official shape at the time this plan was written was:

```json
{
  "devDependencies": {
    "@typescript/native": "npm:typescript@^7.0.2",
    "typescript": "npm:@typescript/typescript6@^6.0.2"
  }
}
```

At execution time:

- replace ranges with reviewed exact or controlled compatible versions;
- follow the latest official stable guidance;
- do not install obsolete `@typescript/native-preview` unless official current guidance explicitly requires it;
- do not install `typescript@next`.

Apply through pnpm rather than hand-editing only:

```powershell
pnpm add -D @typescript/native@npm:typescript@<TS7_EXACT>
pnpm add -D typescript@npm:@typescript/typescript6@<TS6_COMPAT_EXACT>
```

Verify binary resolution:

```powershell
pnpm exec tsc --version
pnpm exec tsc6 --version
pnpm why typescript
pnpm list @typescript/native typescript --depth 8
```

Expected for the 7.0 side-by-side design:

```text
tsc  → TypeScript 7 native CLI
tsc6 → TypeScript 6 compatibility CLI
imports from "typescript" → TypeScript 6 API package
```

Do not continue until the actual pnpm binary mapping matches the recorded design.

## Step 6 — Add temporary explicit comparison scripts

During evaluation, add scripts such as:

```json
{
  "scripts": {
    "typecheck:ts:6": "tsc6 --noEmit",
    "typecheck:ts:7": "tsc --noEmit"
  }
}
```

Do not switch the canonical `typecheck:ts` script yet.

If the Electron/config project requires an explicit second command, make both versioned scripts cover the same projects. For example, use a small cross-platform Node runner rather than shell-specific command chaining if needed.

The two scripts must differ only in compiler binary, not project scope or flags.

## Step 7 — Resolve TypeScript 7 default/config changes explicitly

TypeScript 7.0 changed several defaults and enforces TypeScript 6 deprecation removals. Audit:

```text
strict
module
target
noUncheckedSideEffectImports
libReplacement
stableTypeOrdering
rootDir
types
```

AiVS already explicitly sets several values, but do not assume every project is unaffected.

### `types`

TypeScript 7 defaults `types` to an empty list. Review each config and add only required ambient packages.

Likely areas to evaluate:

```json
{
  "compilerOptions": {
    "types": ["node"]
  }
}
```

for Electron/config code, and:

```json
{
  "compilerOptions": {
    "types": ["vite/client"]
  }
}
```

only if the renderer actually needs it and the existing `vite-env.d.ts` is insufficient.

Do not restore broad ambient discovery with `types: ["*"]` unless there is a proven, documented reason.

### `rootDir`

TypeScript 7 defaults `rootDir` to `./`. Review the existing `tsconfig.node.json`, particularly its inclusion of both:

```text
electron/**/*.ts
vite.config.ts
```

against any explicit `rootDir`.

Prefer a coherent project boundary over suppressing a root-directory diagnostic.

### Side-effect imports

If `noUncheckedSideEffectImports` exposes stylesheet or asset imports:

- ensure Vite client declarations cover them;
- add precise module declarations;
- do not disable the check globally without understanding the import.

Every config edit must pass under both TypeScript 6 and TypeScript 7 where feasible.

## Step 8 — Compare diagnostics exactly

Run both compilers with stable machine-readable output:

```powershell
pnpm typecheck:ts:6 -- --pretty false *> .tmp-ts6-diagnostics.txt
$ts6Exit = $LASTEXITCODE

pnpm typecheck:ts:7 -- --pretty false *> .tmp-ts7-diagnostics.txt
$ts7Exit = $LASTEXITCODE
```

Compare:

```powershell
Compare-Object `
  (Get-Content .tmp-ts6-diagnostics.txt) `
  (Get-Content .tmp-ts7-diagnostics.txt)
```

Requirements for adoption:

- both exit zero;
- or any diagnostic difference is fully understood, correct, and fixed;
- no source is excluded from one compiler;
- no `skipLibCheck`/strictness weakening is introduced;
- no TypeScript 7 crash/panic;
- no missing diagnostic that indicates incomplete project coverage.

Delete temporary files before committing.

For extra assurance, intentionally introduce a temporary known type error and confirm both compilers detect it in the same project. Revert the temporary error immediately.

## Step 9 — Measure TypeScript 7

Use the same machine, projects, flags, and run count as TypeScript 6.

Example:

```powershell
pnpm exec tsc --noEmit | Out-Null

1..5 | ForEach-Object {
  $elapsed = Measure-Command {
    pnpm exec tsc --noEmit --pretty false | Out-Null
  }
  [pscustomobject]@{
    Run = $_
    Milliseconds = [math]::Round($elapsed.TotalMilliseconds, 2)
  }
} | Tee-Object -Variable Ts7Timings
```

Calculate:

- median;
- mean;
- percentage difference;
- memory where practical.

Report:

```text
AiVS measured result on this machine
```

not a universal claim.

A speedup is desirable, but correctness and maintainability remain the gate.

## Step 10 — Validate all tool integrations

Run both compilers first:

```powershell
pnpm typecheck:ts:6
pnpm typecheck:ts:7
```

Then:

```powershell
pnpm test:frontend
pnpm build:frontend
pnpm dev
pnpm build:fast:win
pnpm start:unpacked:win
```

Check:

- Vite config loading;
- Vitest config loading;
- React JSX typing;
- CSS module/side-effect declarations;
- Electron main/preload type coverage;
- source maps;
- editor diagnostics;
- HMR;
- production build;
- no native compiler binary copied into the packaged application unnecessarily.

The TypeScript compiler is a development dependency. Confirm Electron Builder does not bloat the shipped artifact with unused compiler binaries.

## Step 11 — Validate developer/editor workflow

Test the actual primary editor/agent environment.

For VS Code or compatible tooling:

- determine whether it uses TypeScript 7's language server or TypeScript 6 compatibility service;
- verify go-to-definition;
- hover;
- auto-import;
- rename;
- diagnostics;
- JSX editing;
- path aliases;
- references across frontend/electron code;
- formatting/import organisation where supplied by TypeScript.

Because 7.0 has no programmatic API, document exactly which editor/tool remains on TypeScript 6.

The project may validly adopt:

```text
TypeScript 7 CLI for CI/typecheck
TypeScript 6 API for embedded tooling
```

but this must be obvious to contributors.

## Step 12 — Validate supported platforms and CI

Run the side-by-side setup on:

- Windows x64, mandatory;
- Linux CI, if supported;
- macOS arm64, where the project claims support and hardware/CI is available.

Verify the native TypeScript 7 binary installs and runs on every required environment.

Update CI temporarily to run both:

```text
typecheck:ts:6
typecheck:ts:7
```

during the evaluation PR.

Do not make TypeScript 7 the only required check until diagnostic parity is proven.

## Step 13 — Decide adoption model

### Adopt TypeScript 7 when all are true

- stable exact patch;
- no compiler crash;
- diagnostic parity;
- full tests/builds pass;
- tool API consumers remain functional through TypeScript 6 compatibility;
- editor workflow is acceptable;
- all required OS binaries work;
- CI is deterministic;
- package graph is understandable;
- contributor documentation clearly explains `tsc` vs `tsc6`;
- measured benefit is material enough to justify dual-compiler complexity;
- Renovate grouping protects both packages from drifting apart.

### Defer when any is true

- tool/editor integration becomes confusing;
- package aliases create unreliable binary resolution;
- a required tool needs the package name `typescript` to be 7 while also requiring the old API;
- supported-platform native binary is missing;
- diagnostics differ materially;
- the benefit is too small for the extra maintenance;
- TypeScript 7.1 is close enough that waiting removes the dual-package compromise.

Deferral is a successful evaluation outcome, not a failure.

## Step 14 — Implement the chosen outcome

### Outcome A: adoption

- make `typecheck:ts` invoke TypeScript 7;
- retain a clearly named TypeScript 6 compatibility check where useful;
- decide whether CI runs TS6 parity temporarily or permanently;
- update Renovate to group:
  - `@typescript/native`;
  - `typescript` alias / `@typescript/typescript6`;
- document the architecture;
- run the full release gate;
- open a focused PR against `dev`.

Recommended PR title:

```text
chore(tooling): adopt TypeScript 7 native typechecking
```

### Outcome B or C: defer/reject

- revert package/script/config experiments;
- keep only the evaluation report and any independently valid TypeScript 6 compatibility fix;
- verify the branch returns to the merged dependency baseline;
- optionally open a docs-only PR or issue recording:
  - exact versions;
  - measurements;
  - blockers;
  - upstream links;
  - revisit trigger, preferably TypeScript 7.1 API availability.

Do not leave unused aliases in `package.json`.

## Step 15 — Full gate for an adoption PR

Run:

```powershell
pnpm install --frozen-lockfile
pnpm typecheck:ts:6
pnpm typecheck:ts:7
pnpm typecheck
pnpm test:frontend
pnpm backend:test
pnpm build:frontend
pnpm build:fast:win
pnpm start:unpacked:win
```

Also run hosted CI on supported platforms and a concise manual smoke.

No product visual change is expected.

## Exit gate

The evaluation is complete only when:

- it ran on its own branch from post-modernisation `dev`;
- exact TypeScript 6 and 7 versions are recorded;
- API consumers were audited;
- binary mapping was proven;
- diagnostics were compared;
- performance was measured;
- Vite/Vitest/Electron/editor/platform compatibility was tested;
- one of Adopt/Defer/Reject is explicit;
- no experimental package remains after a defer/reject outcome;
- a focused PR or evaluation report exists;
- the main modernisation branch was not modified.

## Recovery procedure

If `pnpm exec tsc` resolves the wrong binary:

1. stop;
2. inspect package `bin` fields and pnpm links;
3. use the current official alias recipe;
4. avoid ad-hoc file renaming in `node_modules`;
5. do not switch canonical scripts until deterministic.

If TypeScript 7 disagrees with TypeScript 6:

1. reduce to a minimal repository test;
2. determine whether TypeScript 7, TypeScript 6, or config scope is wrong;
3. search/file an upstream issue when appropriate;
4. defer adoption rather than suppressing the difference.

If tool integration requires the old API in ways the alias cannot safely support, defer to TypeScript 7.1+.
