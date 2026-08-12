---
id: AIVS-005
title: Externalize Wan2GP source from AiVS
status: Human Review
assignee:
  - '@codex'
created_date: '2026-08-12 09:42'
updated_date: '2026-08-12 10:27'
labels:
  - wangp
  - packaging
  - runtime
dependencies: []
modified_files:
  - .gitignore
  - AGENTS.md
  - README.md
  - THIRD_PARTY_NOTICES.md
  - electron-builder.yml
  - electron/python-setup.ts
  - electron/python-setup.test.ts
  - package.json
  - wgp_config.json
  - scripts/create-installer.ps1
  - scripts/ensure-wan2gp.ps1
  - scripts/ensure-wan2gp.sh
  - scripts/install-python-dependencies.ps1
  - scripts/install-wangp-stack.ps1
  - scripts/local-build.ps1
  - scripts/local-build.sh
  - scripts/prepare-python.ps1
  - scripts/prepare-python.sh
  - scripts/setup-dev.ps1
  - scripts/setup-dev.sh
  - scripts/update-wangp.ps1
  - backend/ltx2_server.py
  - backend/services/wangp_bridge.py
  - backend/wangp_root.py
  - backend/tools/inspect_wangp_music_models.py
  - backend/tests/test_prompt_relay.py
  - backend/tests/test_wangp_bridge.py
  - backend/tests/test_wangp_music_integration.py
  - backend/tests/test_wangp_root.py
  - backend/tests/test_wangp_source.py
  - Wan2GP/
priority: high
type: chore
ordinal: 5000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Remove the independently maintained Wan2GP source tree from the AiVS repository and installer. Local development must use an externally managed Wan2GP checkout, while installed Windows builds use bundled MiniGit during first-run or repair setup to obtain the latest compatible source from the Wan2GP AiVS branch in an app-managed runtime directory. The Wan2GP dev branch is the developer integration lane; promotion to the AiVS branch authorizes installed AiVS copies to consume that source.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Wan2GP source files are no longer tracked by the AiVS repository or embedded in the installer.
- [x] #2 Local development resolves WanGP from an explicitly configured external checkout and does not switch, fetch, or modify that checkout.
- [x] #3 A packaged Windows installation clones the latest configured Wan2GP AiVS branch on first-run setup using bundled MiniGit.
- [x] #4 Repair or refresh can update the managed checkout to the latest AiVS branch without replacing a working checkout when download or validation fails.
- [x] #5 Backend startup, model-pack operations, checkpoint defaults, and dependency installation consistently use the resolved external or app-managed WanGP root.
- [x] #6 Setup and build documentation describes the external development checkout and installed runtime behavior.
- [x] #7 Focused source-resolution and bootstrap checks plus TypeScript/build validation pass, and an unpacked Windows package contains MiniGit but not Wan2GP source.
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [x] #1 Acceptance criteria are satisfied
- [x] #2 Relevant automated tests pass
- [x] #3 Lint, type-check, and build checks pass where applicable
- [x] #4 Documentation is updated where required
- [x] #5 Implementation summary and verification evidence are recorded
- [x] #6 No unrelated changes are included
<!-- DOD:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Preserve current Wan2GP work in the external checkout, remove all 2,298 vendored paths from AiVS tracking, and ignore repo-local checkouts.
2. Require all development helpers and backend startup to use a validated explicit WANGP_ROOT/WANGP_WGP_PATH without modifying it; keep runtime config app-owned and seed it from AiVS wgp_config.json.
3. Package MiniGit, the AiVS-branch manifest, config seed, and bootstrap scripts; transactionally clone/refresh packaged Windows source under userData/runtime/Wan2GP during first-run/repair using bundled OpenSSL/CA and Windows-safe promotion retries.
4. Route the resolved root through Electron/backend/model-pack/dependency paths, move default models outside replaceable source, and idempotently migrate legacy packaged checkpoints/LoRAs without overwriting collisions.
5. Remove all build-time source assumptions, update docs/maintenance commands and source-dependent tests, then validate focused contracts, TypeScript/build, unpacked package layout, and a real packaged MiniGit clone.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Research confirmed electron/python-setup.ts, install-python-dependencies.ps1, install-wangp-stack.ps1, setup/build scripts, and electron-builder.yml currently assume a repo-local or bundled Wan2GP root. External checkout is clean on AiVS at 77689cec; vendored wgp.py and test_model_download_progress.py differ only by line endings, and all other modified vendored source matches external semantically.

User clarified AiVS is Windows-only. AIVS-005 is scoped to Windows runtime, setup, and packaging; existing mac/Linux scripts remain unchanged and removing them is out of scope.

Clarification: although mac/Linux application support remains out of scope, no retained repository script may continue cloning or updating a repo-local Wan2GP checkout. Their helpers will be narrowed to external-root validation only.

Final implementation removed 2,298 Wan2GP files from AiVS tracking while preserving external development on ..\Wan2GP dev. The user deleted the redundant repo-local physical copy.

Packaged bootstrap live smoke cloned configured AiVS head 77689cec with bundled MiniGit, validated required source files, and promoted the candidate. MiniGit required absolute helper paths, bundled OpenSSL/CA settings, and bounded Windows move retries.

Independent review found and drove fixes for external config mutation, backend sibling fallback, and legacy checkpoint/LoRA migration. Fresh review verdict: ship with no findings; forced rollback fault injection remains unrun.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Externalized Wan2GP from AiVS source and packaging. Development now requires a validated external WANGP_ROOT/WANGP_WGP_PATH and AiVS never fetches, switches, or writes that checkout. Packaged Windows first-run/repair uses bundled MiniGit to transactionally clone the moving Wan2GP AiVS branch into app-managed runtime storage; default models live outside replaceable source and legacy packaged checkpoints/LoRAs migrate idempotently. Runtime config is app-owned and seeded from AiVS wgp_config.json. Build/update scripts, packaging, maintenance commands, source-dependent tools/tests, notices, README, and AGENTS guidance were aligned.

Verification: 35 focused backend bridge/root/source tests passed; 2 Electron migration tests passed; 5 dependency-boundary tests passed; all changed PowerShell scripts parsed and retained shell helpers passed bash -n; pnpm typecheck:ts passed; pnpm build:frontend passed; pnpm build:fast:win produced an unpacked app containing AiVS.exe, MiniGit, config seed, bootstrap, and the AiVS branch manifest with no Wan2GP source. A live packaged bootstrap cloned and promoted AiVS head 77689cec. git diff --check passed. Independent review verdict: ship. Residual risk: forced rollback fault injection was not run, though rollback was code-reviewed and normal promotion passed.
<!-- SECTION:FINAL_SUMMARY:END -->
