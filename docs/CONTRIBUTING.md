# Contributing to AI Video Studio

Thanks for taking the time to contribute!

## Getting started (development)

Prereqs:

- Node.js 24 (CI uses 24.18.0)
- `pnpm@10.30.3`
  Recommended Windows setup:

```bash
corepack enable
corepack prepare pnpm@10.30.3 --activate
pnpm -v
```

  Fallback if Corepack is unavailable:

```bash
npm install -g pnpm@10.30.3
pnpm -v
```

- `uv` (Python package manager)
- Python 3.11.9 (pinned in `.python-version`)
- Git

Setup:

```bash
# macOS
pnpm setup:dev:mac

# Windows
pnpm setup:dev:win
```

On Windows, `pnpm setup:dev:win` installs Wan2GP Python dependencies into the backend venv so the desktop app can use the WanGP engine directly. If a repo-local `Wan2GP/` subfolder exists it is used first; otherwise, if `WANGP_ROOT` points to an existing checkout, that checkout is reused instead.

Run:

```bash
pnpm dev
```

Debug:

```bash
pnpm dev:debug
```

Typecheck:

```bash
pnpm typecheck
```

Frontend typecheck, tests, and production bundles:

```bash
pnpm validate:frontend
```

## What we accept right now

- Bug fixes and small improvements
- Documentation updates
- Small, targeted UI fixes

**Frontend policy:** the frontend is under active refactor. Please avoid large UI/state rewrites for now — open an issue first so we can align on the target direction.

## Proposing larger work

Before starting a larger change (especially frontend architecture/state), please open an issue with:

- The problem you’re trying to solve
- The proposed approach (1–2 paragraphs is fine)
- Scope (areas/files likely to change)
- Any UX or compatibility impact

Wait for maintainer alignment before investing in a major refactor.

## Checks

At minimum, run:

- Frontend validation:

```bash
pnpm validate:frontend
```

- Full type checking and backend tests:

```bash
pnpm typecheck
pnpm backend:test
```

Dependency policy checks:

```bash
pnpm check:package-manager
pnpm test:dependency-boundaries
```

Read [`DEPENDENCY_POLICY.md`](DEPENDENCY_POLICY.md) before changing dependencies. Use compatibility groups, keep majors manual, and never include the curated Python/WanGP runtime in a generic dependency update.
