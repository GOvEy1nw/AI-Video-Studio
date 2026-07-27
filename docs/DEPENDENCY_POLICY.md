# Dependency Maintenance Policy

AiVS keeps desktop dependencies current without allowing generic automation to alter the curated WanGP/Python/GPU runtime.

## Supported toolchain

- Node.js: `24.18.0` in CI; supported major is Node 24.
- pnpm: exactly `10.30.3`, declared in `package.json`.
- Package manager: pnpm only.
- JavaScript lockfile: `pnpm-lock.yaml`.

Package changes must include the resulting lockfile change. Do not commit `package-lock.json`, `yarn.lock`, `bun.lock`, or `bun.lockb`. A package-store cache never replaces the committed lockfile.

## Ownership classes

### Class A — Desktop application/runtime

Includes `electron`, `electron-updater`, and `electron-builder`.

- Maintainer review is mandatory; no automerge.
- Electron majors require an official breaking-change audit.
- Validate preload loading, `window.electronAPI`, native imports, dialogs, updater behaviour, unpacked packaging, and the Windows installer.
- Keep Electron on a supported major line.
- Do not combine an Electron major with Vite, Tailwind, React, or other majors.

### Class B — Frontend/build/test ecosystem

Includes React and React DOM, Vite, Vitest, Tailwind CSS, TypeScript, their compatibility packages, and routine renderer/development utilities.

Compatibility families move together. Major updates are manual. Minor and patch proposals require review and green CI. Styling, icon, file-input, or renderer-runtime changes also require visual or interaction parity checks.

TypeScript stays below major 7 until its separate evaluation is approved. Node stays on major 24 and pnpm stays on major 10 until dedicated migrations approve otherwise.

### Class C — Curated AI runtime

Protected runtime ownership includes:

- `backend/pyproject.toml`, `backend/uv.lock`, and `backend/.python-version`;
- `scripts/wangp-stacks.json`, `scripts/wangp-source.json`, and runtime/source installers;
- `Wan2GP/**`;
- Torch, CUDA, performance-kernel wheels, Transformers, Diffusers, PEFT, and related compatibility pins.

Generic dependency bots must not manage these files. Runtime movement is a coordinated manual release with supported-hardware testing, source/pin review, reproducible installation, and rollback evidence.

## Renovate policy

Renovate is the only bot for npm and GitHub Actions updates. Do not enable Dependabot for the same package ecosystem.

`renovate.json`:

- targets `dev`;
- enables only npm and GitHub Actions managers;
- allowlists app/tooling manifests and workflows;
- ignores protected runtime paths;
- groups Electron, Vite, React, Tailwind, tests, TypeScript, utilities, and development helpers;
- waits at least seven days after release;
- disables all automerge;
- keeps TypeScript below 7, Node below 25, and pnpm below 11;
- leaves Python runner versions to the curated runtime process.

Renovate installation and repository authentication remain maintainer-owned. Review Dependency Dashboard entries and first proposals before routine use.

## Review cadence

- Renovate proposals: weekly, Monday before 06:00 Europe/London.
- Lockfile maintenance: monthly, first day before 06:00 Europe/London.
- Security advisories: triage promptly; do not bypass compatibility or runtime validation to chase a version number.
- Electron supported-major status: review whenever an Electron proposal arrives.

## Required validation

Frontend/toolchain changes:

```powershell
pnpm install --frozen-lockfile
pnpm check:package-manager
pnpm test:dependency-boundaries
pnpm exec electron --version
pnpm validate:frontend
```

Desktop runtime or packaging changes also require:

```powershell
pnpm typecheck
pnpm backend:test
pnpm build:fast:win
```

Run relevant native and packaged-app smoke checks from `AGENTS.md`. Full installer validation remains mandatory for Electron/runtime releases and final release candidates.

## Security advisories and overrides

- Review direct and transitive paths before changing versions.
- Prefer a patched compatible parent release.
- Use a scoped override only when API compatibility is understood and validation passes.
- Record why an override exists and its deletion condition.
- Never force an incompatible transitive major to silence an audit.
- Production findings block release unless explicitly resolved or accepted by the maintainer with evidence.

## Deferred versions

Record intentional deferrals in active status/PR evidence with current version, proposed version, reason, risk, and trigger for reconsideration. A deferred major remains visible; it is not silently ignored.

Current deliberate deferrals include TypeScript 7, pnpm 11, `@types/node` 26, and the `react-dropzone` 19 migration review.
