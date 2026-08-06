# projectmem - AI-Video-Studio

_Last updated: 2026-08-06_

## Project purpose
AI Video Studio (AiVS) is a local-first, community-focused desktop app for AI image, video, and music generation. It is built on `deepbeepmeep/LTX-Desktop-WanGP`, uses a bundled WanGP / Wan2GP runtime, and does not expose cloud generation providers or require API keys.

Product principles:

- Keep generation local and WanGP-only.
- Present a curated creative product rather than raw WanGP configuration.
- Preserve proven behaviour, user data, and architectural contracts; refactor or replace implementation deliberately when the current structure becomes a documented constraint.
- Keep model/runtime compatibility reproducible and deliberately pinned.
- Prefer simple user-facing workflows with advanced controls only where they add clear value.

Current integration baseline: `dev`.

## Recent issues
- [DONE] #0680 Disabled mode options lacked native disabled semantics and accessible unavailable reason. [frontend/components/SettingsDropdown.tsx] -> Verified unavailable Retake is natively disabled with accessible reason and focused interaction test. [frontend/components/SettingsDropdown.tsx] (fixed)
- [DONE] #0679 Model availability in shared frontend profile state remains stale after Model Manager refresh and after checkpoint/LoRA Save & Reload. [frontend/components/ModelPackManager.tsx; frontend/components/SettingsModal.tsx; frontend/contexts/ModelProfilesContext.tsx] -> Verified refresh flows rescan packs then refresh shared model-profile availability; context tests pass. [frontend/components/ModelPackManager.tsx] (fixed)
- [DONE] #0678 Model dropdown briefly positions at bottom-end before snapping under its trigger because matched trigger width is applied after initial floating-menu placement. [frontend/components/FloatingMenu.tsx; frontend/components/SettingsDropdown.tsx] -> Verified first model-menu position uses final matched width; focused FloatingMenu tests pass. [frontend/components/FloatingMenu.tsx] (fixed)
- [DONE] #0677 Video Quick Gen shows an unavailable LTX profile as selected when no video model files are installed instead of presenting the Download Models action. [frontend/views/genspace/video/VideoGenPanel.tsx] -> Verified Video shows Download Models when no video profile is installed while retaining normal layout metadata. [frontend/views/genspace/video/VideoGenPanel.tsx] (fixed)
- [OPEN] #0676 AIVS-027 native editor smoke remains unavailable: repository Vite config enters Electron watch builds without an HTTP renderer, and browser control cannot drive the Electron window. [AIVS-027 native Electron smoke environment] (open)
- [OPEN] #0241 Installed app log reports resources/icon.ico missing; window still displays executable icon [electron/main.ts; electron-builder.yml; Backlog AIVS-033] (open)
- [OPEN] #0240 Installed app updater check logs GitHub releases HTTP 406 but remains stable and usable [electron/updater.ts; Backlog AIVS-032] (open)
- [OPEN] #0031 Windows installer is not Authenticode-signed; release publishing needs a valid code-signing certificate and configuration. [electron-builder.yml; Backlog AIVS-031] (open)

## Decisions
- AiVS environment variables are canonical (AIVS_APP_DATA_DIR, AIVS_AUTH_TOKEN, AIVS_PORT, AIVS_BACKEND_PYTHON); LTX equivalents are read-only fallbacks for one compatibility period.
- AiVS stores no cloud API credentials; all generation routes use WanGP only. [backend]
- Model downloads are optional WanGP-defined packs: first-run setup installs only runtime dependencies; the renderer controls an Electron-owned Python child downloader for live sanitized progress and cancellation, reused by Settings Model Manager. [electron/python-setup.ts; frontend/components/PythonSetup.tsx]
- GenSpace video generation no longer exposes Timing/multi-shot editing or sends shotPrompts; standalone Director Mode is the canonical multi-segment prompt-timing workflow. Legacy backend shotPrompts compatibility remains internal. [frontend/views/GenSpace.tsx]
- Director Mode is a standalone workspace between GenSpace and Video Editor: shared asset library and bins at left, multiple Director timelines, global/contextual settings, preview transport, and Director timeline at bottom. It visually reuses editor primitives but owns separate frame-based state and behavior. [frontend/views/director/]
- Director V1 supports the Prompt track only; Guide Audio and Control Media remain visible and locked. V1 is fixed at 24 fps, uses 8n+1 output lengths, caps timelines at 20 seconds, and sends all key frames through image_refs plus frames_positions. [frontend/types/director.ts]
- Because project workspaces remain mounted to preserve state, transport playback and keyboard shortcuts are owned exclusively by the active project tab; inactive Director/Video Editor workspaces stop playback and ignore transport keys. [frontend/views/Project.tsx; frontend/views/VideoEditor.tsx; frontend/views/DirectorEditor.tsx]
- Use one controlled GalleryAssetLibrary component for Gen Space, Director, and Video Editor. Shared component owns identical toolbar/grid/list/card rendering; each workspace supplies only data, persistence, selection, and workspace-specific action callbacks. Hide card hover action rail with a size container query below its usable height. [frontend/components/GalleryAssetLibrary.tsx]
- AiVS keeps WanGP bundled for offline/reproducible installs, while GOvEy1nw/Wan2GP AiVS is source of truth; scripts/wangp-source.json pins an exact commit and immutable AiVS tag. [scripts/wangp-source.json]
- WanGP updates use transactional scripts/update-wangp.ps1: check AiVS branch head, report sensitive bridge/dependency/model/default changes, validate, and roll back checkout plus manifest on failure. [scripts/update-wangp.ps1]
- WanGP model download progress keeps existing transport ownership: generation events flow through backend polling, model packs through Electron IPC; both normalize to one renderer transfer shape and shared progress view. [backend/progress_types.py; frontend/types/progress.ts; frontend/components/DownloadProgressView.tsx]
- GenSpace uses one always-mounted controller with explicit Image/Video/Music panel contracts, pure commands/assets, immutable project-scoped snapshots, and isolated gallery/overlay views. [frontend/views/genspace/]
- Keep frontend/hooks/use-generation.ts as the compatibility facade; useGenerationJob exclusively owns one abort controller, 500 ms poll loop, cancellation, terminal guards, and cleanup. [frontend/hooks/generation/]
- Music accepts independent Cover Song and Transfer Timbre inputs; backend maps none/A/B/both to WanGP audio_prompt_type '', 'A', 'B', and 'AB' while accepting legacy single audioInput requests. [backend/services/music_request_resolver.py]
- Tailwind 4 theme is CSS-first in frontend/index.css: @theme inline maps utilities to runtime :root tokens, while the app-wide v3 border-color base rule remains for visual parity. [frontend/index.css]
- TypeScript 6 node project rootDir is repository root because it intentionally typechecks both electron/**/*.ts and root vite.config.ts; Vite still owns runtime/preload emission [tsconfig.node.json]
- Phase 10 selects Renovate as sole npm/GitHub Actions update bot; automerge stays off and generic managers exclude Python/WanGP runtime paths. [renovate.json; docs/DEPENDENCY_POLICY.md]
- AiVS CI no longer runs macOS tests; Python test coverage is Windows-only, while existing Ubuntu typecheck and frontend build jobs remain unchanged. [.github/workflows/ci.yml]
- AiVS forces WanGP `fit_canvas=0`: visual-input generations treat selected resolution as pixel budget and preserve input aspect; Reframe’s authored canvas stays authoritative [GenSpace output sizing; backend/services/wangp_bridge.py]
- Image and Video Reframe share one controlled ReframeEditor for preset/custom aspect, zoom, pan, reset, edge dragging, media placement, and frame layout; callers retain media-specific lifecycle UI [frontend/views/genspace/components/ReframeEditor.tsx]
- Prompt enhancement no longer runs submit-time in AiVS. Image/video send authored prompts plus semantic enhancePrompt; WanGP enhances during generation, and AiVS assets retain the authored submission prompt. [frontend/views/genspace/hooks/]
- Div-based context/dropdown menus use one body-portaled FloatingMenu owner for fixed positioning, side fallback, viewport clamping, and overflow bounds; dialogs, tooltips, and native selects remain separate. [frontend/components/FloatingMenu.tsx]
- AIVS-017 separates exact read and write capabilities, removes broad renderer write authority, canonicalizes existing paths/creation ancestors against symlink escapes, and adds native re-selection recovery for legacy in-place media [electron filesystem boundary]
- AIVS-018 retains focused pure/domain and critical workflow tests while deleting presentation-coupled component suites; type checking and Pyright remain independent gates. [docs/TESTING_POLICY.md]
- AIVS-018 validation policy: backend tests prefer real collaborators; fakes or narrow mocks are allowed only at heavyweight/process/network boundaries. Pyright runs independently through pnpm typecheck:py, not from pytest. [.projectmem/PROJECT_MAP.md; backend/tests; docs/TESTING_POLICY.md]
- AIVS-019 renderer policy: Home stays eager; Project/setup/log/settings and project workspaces use module-scope dynamic loaders. A workspace prefetches on tab intent, mounts on first activation, then remains mounted with explicit isActive=false when inactive so authored and generation state persist. [frontend/App.tsx; frontend/views/Project.tsx]
- AIVS-020 uses app-level BackendLifecycleProvider and ModelProfilesProvider; existing useBackend, useImageProfiles, useVideoProfiles, and useMusicProfiles hooks remain compatibility consumers, while Settings and Director share the central lifecycle/profile owners. [frontend/contexts; frontend/hooks]
- AIVS-021 keeps one internal projects state owner but exposes memoized domain contexts for navigation, list/meta, assets, Editor timelines, Director timelines, and GenSpace handoffs; broad useProjects remains compatibility-only [frontend/contexts/ProjectContext.tsx]
- AIVS-022 uses one focused renderer latest-snapshot queue plus Electron storage-chain serialization; persisted paths validate once at load and only at new asset/take boundaries, preserving native reselection for rejected external media.
- AIVS-023 converts large/user-visible Electron media reads, writes, imports, moves, searches, existence checks, and deletes to fs/promises while retaining synchronous canonical containment metadata in the hardened path-validation boundary. [electron IPC and project asset I/O]
- AIVS-023 centralizes ElectronAPI in shared/electron-api.ts and returns typed Uint8Array media bytes; renderer copies exact backing-buffer range through one helper. [shared/electron-api.ts]
- AIVS-024 uses two direct bounded renderer services: shared AudioContext/audio-envelope cache and thumbnail blob-URL cache; consumers request enabled URL results rather than retain project-wide maps. [frontend/lib/audio-decode-service.ts]
- AIVS-025 virtualizes Asset Library in fixed rows with three-row overscan; leading content remains outside virtual asset height and marquee motion writes only a ref-backed overlay. [frontend/components/asset-library-virtual.ts]
- AIVS-026 builds immutable playback interval segments from clips/tracks/assets; rAF uses binary visual/dissolve/audio selectors and O(1) source/next maps, while pool stays lazy and capped at three sources. [frontend/views/editor/playback-index.ts; frontend/views/editor/usePlaybackEngine.ts]
- AIVS-027 keeps VideoEditor as domain/persistence/playback container while focused owners handle layout, preview, timeline composition, track headers/canvas, tabs/tool rail, and inspector; persisted legacy clip fields remain pass-through. [frontend/views/editor]
- AIVS-028 keeps V1 eager project loading because representative storage and native Home heap measurements remain below the 250 ms and 100 MB gates. Repeated native Home timing remains blocked by the preload/CDP environment; no security-boundary weakening is accepted. [electron/project-storage.ts]
- Backlog owns actionable work/status/evidence; ProjectMem retains only current architecture decisions, unresolved product/code defects, security/data risks, durable constraints, cross-task baselines, and upstream incompatibilities. Routine agent/tool failures stay in Backlog or ignored .projectmem/runtime/. [AGENTS.md; .projectmem/AI_INSTRUCTIONS.md; .projectmem/]
- Bundled WanGP source is pinned to GOvEy1nw/Wan2GP AiVS revision a599200d96a2e3c934991bb5fcbddb821d3550dc, manifest version 12.3456; transactional source-update and rollback rules remain. [scripts/wangp-source.json; .projectmem/PROJECT_MAP.md]
- First-run setup installs the runtime, then confirms project, checkpoint, and LoRA storage together; model-pack downloads are available in-app after setup rather than as an onboarding stage. [frontend/components/PythonSetup.tsx; frontend/components/SettingsModal.tsx]

## Notes
- No notes logged yet.

## Key files
- `scripts/wangp-source.json`
- `scripts/update-wangp.ps1`
- `frontend/hooks/use-generation.ts`
- `resources/icon.ico`
- `frontend/index.css`
- `vite.config.ts`
- `shared/electron-api.ts`
- `12.3456`

## Open questions
- None logged yet.
