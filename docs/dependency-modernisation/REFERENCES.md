# Official References and Repository Evidence

## Use of this file

This reference index was checked on **26 July 2026**.

Package ecosystems continue to move. At the beginning of each phase:

1. open the relevant official migration/release notes;
2. confirm the approved target family still exists and is stable;
3. resolve only the newest stable patch within that family;
4. record the exact pages and versions in `STATUS.md`;
5. do not jump to a new major merely because it has become `latest`.

Prefer primary sources. Release blogs and official documentation override third-party summaries.

---

## AiVS repository

### Project

- Repository:
  https://github.com/GOvEy1nw/AI-Video-Studio
- Baseline branch:
  https://github.com/GOvEy1nw/AI-Video-Studio/tree/dev

### Files that informed this plan

- Root package manifest:
  https://github.com/GOvEy1nw/AI-Video-Studio/blob/dev/package.json
- pnpm lockfile:
  https://github.com/GOvEy1nw/AI-Video-Studio/blob/dev/pnpm-lock.yaml
- Vite configuration:
  https://github.com/GOvEy1nw/AI-Video-Studio/blob/dev/vite.config.ts
- Tailwind configuration:
  https://github.com/GOvEy1nw/AI-Video-Studio/blob/dev/tailwind.config.js
- PostCSS configuration:
  https://github.com/GOvEy1nw/AI-Video-Studio/blob/dev/postcss.config.js
- Main CSS/theme file:
  https://github.com/GOvEy1nw/AI-Video-Studio/blob/dev/frontend/index.css
- Media import code containing legacy Electron `File.path` reads:
  https://github.com/GOvEy1nw/AI-Video-Studio/blob/dev/frontend/lib/media-import.ts
- Electron preload bridge:
  https://github.com/GOvEy1nw/AI-Video-Studio/blob/dev/electron/preload.ts
- Native file/dialog handlers:
  https://github.com/GOvEy1nw/AI-Video-Studio/blob/dev/electron/ipc/file-handlers.ts
- Persistent Electron app state:
  https://github.com/GOvEy1nw/AI-Video-Studio/blob/dev/electron/app-state.ts
- BrowserWindow security configuration:
  https://github.com/GOvEy1nw/AI-Video-Studio/blob/dev/electron/window.ts
- Electron Builder configuration:
  https://github.com/GOvEy1nw/AI-Video-Studio/blob/dev/electron-builder.yml
- Agent guidance:
  https://github.com/GOvEy1nw/AI-Video-Studio/blob/dev/AGENTS.md
- Product/inherited-foundation guardrails:
  https://github.com/GOvEy1nw/AI-Video-Studio/blob/dev/AGENTS_PRD.md
- Backend dependency/runtime contract:
  https://github.com/GOvEy1nw/AI-Video-Studio/blob/dev/backend/pyproject.toml
- Curated GPU stack:
  https://github.com/GOvEy1nw/AI-Video-Studio/blob/dev/scripts/wangp-stacks.json

### Upstream architectural comparison

The current Lightricks desktop project can be useful as compatibility evidence, not as permission to overwrite AiVS customisations:

- LTX Desktop repository:
  https://github.com/Lightricks/LTX-Desktop
- Current package manifest:
  https://github.com/Lightricks/LTX-Desktop/blob/main/package.json

Always preserve AiVS-specific behaviour and use upstream changes selectively.

---

## Electron

### Support and release status

- Electron release history:
  https://releases.electronjs.org/
- Electron release/support timeline:
  https://www.electronjs.org/docs/latest/tutorial/electron-timelines
- Electron release overview:
  https://www.electronjs.org/releases/stable

### Breaking changes

- Planned/current breaking changes:
  https://www.electronjs.org/docs/latest/breaking-changes
- Electron 32 announcement, including removal of `File.path`:
  https://www.electronjs.org/blog/electron-32-0
- `webUtils.getPathForFile` API:
  https://www.electronjs.org/docs/latest/api/web-utils
- Electron 43 announcement:
  https://www.electronjs.org/blog/electron-43-0
- Electron security checklist:
  https://www.electronjs.org/docs/latest/tutorial/security

### Packaging and updates

- Electron Builder documentation:
  https://www.electron.build/
- electron-updater documentation:
  https://www.electron.build/auto-update.html
- NSIS configuration:
  https://www.electron.build/nsis.html

---

## Node.js and pnpm

- Node.js release status and LTS schedule:
  https://nodejs.org/en/about/previous-releases
- Node.js downloads/releases:
  https://nodejs.org/en/download
- Corepack documentation:
  https://nodejs.org/api/corepack.html
- pnpm installation and Corepack:
  https://pnpm.io/installation
- pnpm package manifest configuration:
  https://pnpm.io/package_json
- pnpm lockfile/install behaviour:
  https://pnpm.io/cli/install
- pnpm audit:
  https://pnpm.io/cli/audit
- pnpm overrides:
  https://pnpm.io/package_json#pnpmoverrides

AiVS intentionally retains `pnpm@10.30.3` during this modernisation unless separately approved.

---

## Vite and the Electron Vite plugin

### Vite

- Vite 8 announcement:
  https://vite.dev/blog/announcing-vite8
- Vite 8.1 announcement:
  https://vite.dev/blog/announcing-vite8-1
- Vite migration guide:
  https://vite.dev/guide/migration
- Vite configuration reference:
  https://vite.dev/config/
- Build options:
  https://vite.dev/config/build-options
- Shared options, including `base`:
  https://vite.dev/config/shared-options
- Static asset handling:
  https://vite.dev/guide/assets

### Electron integration

- `vite-plugin-electron` repository and migration guidance:
  https://github.com/electron-vite/vite-plugin-electron
- Package releases:
  https://github.com/electron-vite/vite-plugin-electron/releases

The plan deliberately upgrades Vite and the Electron plugin as one compatibility cluster.

---

## Vitest, jsdom, and Testing Library

- Vitest migration guide:
  https://vitest.dev/guide/migration
- Vitest 4 announcement:
  https://vitest.dev/blog/vitest-4
- Vitest 4.1 announcement:
  https://v4.vitest.dev/blog/vitest-4-1
- Vitest releases:
  https://github.com/vitest-dev/vitest/releases
- Vitest configuration:
  https://vitest.dev/config/
- Vitest mocking guide:
  https://vitest.dev/guide/mocking
- jsdom repository/releases:
  https://github.com/jsdom/jsdom
- React Testing Library documentation:
  https://testing-library.com/docs/react-testing-library/intro/
- Testing Library user-event documentation:
  https://testing-library.com/docs/user-event/intro/

At the time of planning, Vitest 4 is the stable approved family and Vitest 5 is not part of this branch.

---

## Tailwind CSS

- Tailwind CSS upgrade guide:
  https://tailwindcss.com/docs/upgrade-guide
- Tailwind CSS v4 announcement:
  https://tailwindcss.com/blog/tailwindcss-v4
- Tailwind CSS v4.1 announcement:
  https://tailwindcss.com/blog/tailwindcss-v4-1
- Tailwind CSS v4.3 announcement:
  https://tailwindcss.com/blog/tailwindcss-v4-3
- Tailwind CSS documentation:
  https://tailwindcss.com/docs
- Tailwind CSS Vite installation:
  https://tailwindcss.com/docs/installation/using-vite
- Theme variables / CSS-first configuration:
  https://tailwindcss.com/docs/theme
- Source detection:
  https://tailwindcss.com/docs/detecting-classes-in-source-files
- Compatibility directives such as `@config`:
  https://tailwindcss.com/docs/functions-and-directives
- Preflight:
  https://tailwindcss.com/docs/preflight
- `tailwind-merge` repository:
  https://github.com/dcastil/tailwind-merge

Use the official Tailwind upgrade tool only on a clean, reviewable phase branch/commit and inspect every result.

---

## React

- React 19 upgrade guide:
  https://react.dev/blog/2024/04/25/react-19-upgrade-guide
- React 19 announcement:
  https://react.dev/blog/2024/12/05/react-19
- React 19.2 announcement:
  https://react.dev/blog/2025/10/01/react-19-2
- React releases:
  https://github.com/facebook/react/releases
- React `createRoot`:
  https://react.dev/reference/react-dom/client/createRoot
- React Strict Mode:
  https://react.dev/reference/react/StrictMode
- React TypeScript guidance:
  https://react.dev/learn/typescript

React Compiler is not part of this migration.

---

## TypeScript 6 and 7

### TypeScript 6

- TypeScript 6 stable announcement:
  https://devblogs.microsoft.com/typescript/announcing-typescript-6-0/
- TypeScript 6 release notes:
  https://www.typescriptlang.org/docs/handbook/release-notes/typescript-6-0.html
- TypeScript configuration reference:
  https://www.typescriptlang.org/tsconfig/

TypeScript 6 is the compiler approved for the main modernisation branch.

### TypeScript 7

- TypeScript 7 stable announcement:
  https://devblogs.microsoft.com/typescript/announcing-typescript-7-0/
- TypeScript 7 source repository:
  https://github.com/microsoft/typescript-go
- TypeScript project blog:
  https://devblogs.microsoft.com/typescript/

The TypeScript 7 announcement documents:

- the native Go implementation;
- the absence of a TypeScript 7.0 programmatic API;
- the `@typescript/typescript6` compatibility package;
- side-by-side aliasing;
- changed defaults and TypeScript 6 deprecation enforcement.

Do not use pre-release or old preview-package instructions when stable guidance is available.

---

## Renovate and GitHub Actions

### Renovate

- Renovate documentation:
  https://docs.renovatebot.com/
- Configuration options:
  https://docs.renovatebot.com/configuration-options/
- Package rules:
  https://docs.renovatebot.com/configuration-options/#packagerules
- npm manager:
  https://docs.renovatebot.com/modules/manager/npm/
- GitHub Actions manager:
  https://docs.renovatebot.com/modules/manager/github-actions/
- Config validation:
  https://docs.renovatebot.com/config-validation/
- Dependency Dashboard:
  https://docs.renovatebot.com/key-concepts/dashboard/
- Security and permissions:
  https://docs.renovatebot.com/security-and-permissions/

### GitHub Actions

- Workflow syntax:
  https://docs.github.com/actions/writing-workflows/workflow-syntax-for-github-actions
- Secure use reference:
  https://docs.github.com/actions/security-for-github-actions/security-guides/security-hardening-for-github-actions
- Dependency caching:
  https://docs.github.com/actions/using-workflows/caching-dependencies-to-speed-up-workflows
- `actions/setup-node`:
  https://github.com/actions/setup-node
- `actions/checkout`:
  https://github.com/actions/checkout

Use supported action releases at implementation time and preserve minimal permissions.

---

## Security advisories and package provenance

- GitHub Advisory Database:
  https://github.com/advisories
- npm package provenance documentation:
  https://docs.npmjs.com/generating-provenance-statements
- OpenSSF Scorecard:
  https://securityscorecards.dev/

Advisory existence, affected range, reachability, and patched version must all be assessed. Do not use a forced bulk audit fix.

---

## Source hierarchy for decisions

Use this order:

1. AiVS's current code and tests;
2. AiVS `AGENTS_PRD.md` and `AGENTS.md`;
3. official package migration/release documentation;
4. official package repositories and issue trackers;
5. tested upstream LTX Desktop implementation;
6. third-party articles only as supplementary context.

When sources conflict, record the conflict and prefer current primary documentation plus direct testing.
