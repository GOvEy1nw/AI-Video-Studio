# Baseline evidence

All repository links in this file are pinned to commit `c405f8224a8a510140591a9b76a568f3a78b49ad` so later `dev` changes do not silently alter the evidence behind the recommendations.

## Repository and build

| Evidence | Observation | Used by |
|---|---|---|
| [`package.json`](https://github.com/GOvEy1nw/AI-Video-Studio/blob/c405f8224a8a510140591a9b76a568f3a78b49ad/package.json) | React 19.2.8, Electron 43.2.0, Vite 8.1.5, Vitest 4.1.10, TypeScript 6.0.3, Tailwind 4.3.3; small runtime dependency list | Audit; PRs 01–03 |
| [`vite.config.ts`](https://github.com/GOvEy1nw/AI-Video-Studio/blob/c405f8224a8a510140591a9b76a568f3a78b49ad/vite.config.ts) | No dynamic route/workspace boundaries are configured in source; renderer build has no manifest | PR 02 |
| [`electron-builder.yml`](https://github.com/GOvEy1nw/AI-Video-Studio/blob/c405f8224a8a510140591a9b76a568f3a78b49ad/electron-builder.yml) | Packaged files exclude maps, backend tests/caches/models, WanGP docs/git/cache/model/output folders | Audit; PR 12 |
| [`tsconfig.json`](https://github.com/GOvEy1nw/AI-Video-Studio/blob/c405f8224a8a510140591a9b76a568f3a78b49ad/tsconfig.json) | Strict TypeScript with unused locals/parameters enabled | PR 01 |
| [`vitest.config.ts`](https://github.com/GOvEy1nw/AI-Video-Studio/blob/c405f8224a8a510140591a9b76a568f3a78b49ad/vitest.config.ts) | One broad jsdom configuration, no targeted setup/projects | PR 01 |

## Renderer import and workspace mounting

| Evidence | Observation | Used by |
|---|---|---|
| [`frontend/App.tsx`](https://github.com/GOvEy1nw/AI-Video-Studio/blob/c405f8224a8a510140591a9b76a568f3a78b49ad/frontend/App.tsx) | Static imports for Project, PythonSetup, SettingsModal, LogViewer; closed modals remain in import graph | PR 02 |
| [`frontend/components/SettingsModal.tsx`](https://github.com/GOvEy1nw/AI-Video-Studio/blob/c405f8224a8a510140591a9b76a568f3a78b49ad/frontend/components/SettingsModal.tsx) | Static import of ModelPackManager | PR 02 |
| [`frontend/views/Project.tsx`](https://github.com/GOvEy1nw/AI-Video-Studio/blob/c405f8224a8a510140591a9b76a568f3a78b49ad/frontend/views/Project.tsx) | Static imports and simultaneous hidden mounting of Quick Gen, Director, Video Editor | PR 02 |
| [`frontend/views/DirectorEditor.tsx`](https://github.com/GOvEy1nw/AI-Video-Studio/blob/c405f8224a8a510140591a9b76a568f3a78b49ad/frontend/views/DirectorEditor.tsx) | Initial Director timeline effect is not gated by first Director visit | PR 02 |
| [`frontend/views/Home.tsx`](https://github.com/GOvEy1nw/AI-Video-Studio/blob/c405f8224a8a510140591a9b76a568f3a78b49ad/frontend/views/Home.tsx) | Home autoplays hero video; project cards scan full assets and can mount video fallbacks | PRs 07, 11 |

## Shared data/lifecycle duplication

| Evidence | Observation | Used by |
|---|---|---|
| [`frontend/hooks/use-image-profiles.ts`](https://github.com/GOvEy1nw/AI-Video-Studio/blob/c405f8224a8a510140591a9b76a568f3a78b49ad/frontend/hooks/use-image-profiles.ts) | Each hook instance independently fetches profiles/model packs and retries every 1.5 s | PR 03 |
| [`frontend/views/genspace/hooks/useGenSpaceController.tsx`](https://github.com/GOvEy1nw/AI-Video-Studio/blob/c405f8224a8a510140591a9b76a568f3a78b49ad/frontend/views/genspace/hooks/useGenSpaceController.tsx) | GenSpace creates image/video/music profile hooks | PR 03 |
| [`frontend/views/DirectorEditor.tsx`](https://github.com/GOvEy1nw/AI-Video-Studio/blob/c405f8224a8a510140591a9b76a568f3a78b49ad/frontend/views/DirectorEditor.tsx) | DirectorEditor creates a video profile hook | PR 03 |
| [`frontend/views/director/DirectorWorkspacePanel.tsx`](https://github.com/GOvEy1nw/AI-Video-Studio/blob/c405f8224a8a510140591a9b76a568f3a78b49ad/frontend/views/director/DirectorWorkspacePanel.tsx) | DirectorWorkspacePanel creates another video profile hook | PR 03 |
| [`frontend/hooks/use-backend.ts`](https://github.com/GOvEy1nw/AI-Video-Studio/blob/c405f8224a8a510140591a9b76a568f3a78b49ad/frontend/hooks/use-backend.ts) | Own backend-health subscription/snapshot and connection polling | PR 03 |
| [`frontend/contexts/AppSettingsContext.tsx`](https://github.com/GOvEy1nw/AI-Video-Studio/blob/c405f8224a8a510140591a9b76a568f3a78b49ad/frontend/contexts/AppSettingsContext.tsx) | Own second backend-health subscription/snapshot | PR 03 |

## Project state and persistence

| Evidence | Observation | Used by |
|---|---|---|
| [`frontend/contexts/ProjectContext.tsx`](https://github.com/GOvEy1nw/AI-Video-Studio/blob/c405f8224a8a510140591a9b76a568f3a78b49ad/frontend/contexts/ProjectContext.tsx) | Broad context, inline provider value, all project domains/actions/handoffs | PR 04 |
| same file | Persistence clears pending sets before async writes; path-approval effect scans every project/asset/take after project changes | PR 05 |
| [`electron/project-storage.ts`](https://github.com/GOvEy1nw/AI-Video-Studio/blob/c405f8224a8a510140591a9b76a568f3a78b49ad/electron/project-storage.ts) | Atomic per-project writes are good; index stores IDs only and all projects load/parse; index operations can overlap | PRs 05, 11 |
| [`frontend/views/Home.tsx`](https://github.com/GOvEy1nw/AI-Video-Studio/blob/c405f8224a8a510140591a9b76a568f3a78b49ad/frontend/views/Home.tsx) | Home needs summary fields but receives full projects and scans assets | PR 11 |

## Electron main-process file work

| Evidence | Observation | Used by |
|---|---|---|
| [`electron/ipc/file-handlers.ts`](https://github.com/GOvEy1nw/AI-Video-Studio/blob/c405f8224a8a510140591a9b76a568f3a78b49ad/electron/ipc/file-handlers.ts) | Sync full-file read/base64, recursive sync search, sync existence checks in IPC handlers | PR 06 |
| [`electron/lib/project-asset-import.ts`](https://github.com/GOvEy1nw/AI-Video-Studio/blob/c405f8224a8a510140591a9b76a568f3a78b49ad/electron/lib/project-asset-import.ts) | Sync mkdir/copy/rename/unlink/existence checks for imports/moves | PR 06 |
| [`electron/lib/project-asset-delete.ts`](https://github.com/GOvEy1nw/AI-Video-Studio/blob/c405f8224a8a510140591a9b76a568f3a78b49ad/electron/lib/project-asset-delete.ts) | Sync exists/stat before async trash | PR 06 |
| [`electron/preload.ts`](https://github.com/GOvEy1nw/AI-Video-Studio/blob/c405f8224a8a510140591a9b76a568f3a78b49ad/electron/preload.ts) | Base64 read contract and repeated Electron API type declaration | PR 06 |
| [`scripts/test-project-asset-import.mjs`](https://github.com/GOvEy1nw/AI-Video-Studio/blob/c405f8224a8a510140591a9b76a568f3a78b49ad/scripts/test-project-asset-import.mjs) | Can report success from fallback code rather than production module | PRs 01, 06 |

## Asset/media rendering

| Evidence | Observation | Used by |
|---|---|---|
| [`frontend/components/GalleryAssetLibrary.tsx`](https://github.com/GOvEy1nw/AI-Video-Studio/blob/c405f8224a8a510140591a9b76a568f3a78b49ad/frontend/components/GalleryAssetLibrary.tsx) | Eager card map, video metadata fallback, waveforms, per-pointer React state, dead card action/model code | PRs 01, 08 |
| [`frontend/components/GalleryAssetList.tsx`](https://github.com/GOvEy1nw/AI-Video-Studio/blob/c405f8224a8a510140591a9b76a568f3a78b49ad/frontend/components/GalleryAssetList.tsx) | Eager row map and live video fallback | PR 08 |
| [`frontend/views/director/DirectorSidebar.tsx`](https://github.com/GOvEy1nw/AI-Video-Studio/blob/c405f8224a8a510140591a9b76a568f3a78b49ad/frontend/views/director/DirectorSidebar.tsx) | Local full-project thumbnail loop/map plus shared Asset Library | PR 07 |
| [`frontend/views/editor/LeftPanel.tsx`](https://github.com/GOvEy1nw/AI-Video-Studio/blob/c405f8224a8a510140591a9b76a568f3a78b49ad/frontend/views/editor/LeftPanel.tsx) | Shared Asset Library plus editor-local media/selection wiring | PRs 08, 10 |
| [`frontend/components/AudioWaveform.tsx`](https://github.com/GOvEy1nw/AI-Video-Studio/blob/c405f8224a8a510140591a9b76a568f3a78b49ad/frontend/components/AudioWaveform.tsx) | URL-only variable-bucket cache, polling dedupe, per-decode context, full canvas redraw loop | PR 07 |
| [`frontend/lib/thumbnails.ts`](https://github.com/GOvEy1nw/AI-Video-Studio/blob/c405f8224a8a510140591a9b76a568f3a78b49ad/frontend/lib/thumbnails.ts) | Process-lifetime blob URL cache without revocation | PR 07 |
| [`frontend/views/editor/VideoThumbnailCard.tsx`](https://github.com/GOvEy1nw/AI-Video-Studio/blob/c405f8224a8a510140591a9b76a568f3a78b49ad/frontend/views/editor/VideoThumbnailCard.tsx) | Per-card hidden video/canvas hover scrub and `preload=auto` on hover | PR 07 |

## Video Editor

| Evidence | Observation | Used by |
|---|---|---|
| [`frontend/views/VideoEditor.tsx`](https://github.com/GOvEy1nw/AI-Video-Studio/blob/c405f8224a8a510140591a9b76a568f3a78b49ad/frontend/views/VideoEditor.tsx) | >5,000-line orchestration/component; repeated searches; media probes; live timeline video thumbnails; dormant hidden feature plumbing | PRs 09–10 |
| [`frontend/views/editor/usePlaybackEngine.ts`](https://github.com/GOvEy1nw/AI-Video-Studio/blob/c405f8224a8a510140591a9b76a568f3a78b49ad/frontend/views/editor/usePlaybackEngine.ts) | rAF clip map/filter/sort/find work; private audio read/context/cache | PRs 07, 09 |
| [`frontend/views/editor/video-editor-utils.ts`](https://github.com/GOvEy1nw/AI-Video-Studio/blob/c405f8224a8a510140591a9b76a568f3a78b49ad/frontend/views/editor/video-editor-utils.ts) | Pure timeline/layout helpers already exist; supports extracting hot-path selectors without a rewrite | PRs 09–10 |

## Test and project-memory evidence

| Evidence | Observation | Used by |
|---|---|---|
| [`backlog/tasks/aivs-015 - Add-multi-select-asset-library-deletion.md`](https://github.com/GOvEy1nw/AI-Video-Studio/blob/c405f8224a8a510140591a9b76a568f3a78b49ad/backlog/tasks/aivs-015%20-%20Add-multi-select-asset-library-deletion.md) | At head: 197 pass, 11 baseline failures, one jsdom media error; 12 TypeScript diagnostics | PR 01 |
| [`frontend/components/GalleryAssetLibrary.test.tsx`](https://github.com/GOvEy1nw/AI-Video-Studio/blob/c405f8224a8a510140591a9b76a568f3a78b49ad/frontend/components/GalleryAssetLibrary.test.tsx) | Mixes valuable behaviour with stale CSS/metadata/markup assertions | PR 01 |
| [`frontend/components/FloatingMenu.test.tsx`](https://github.com/GOvEy1nw/AI-Video-Studio/blob/c405f8224a8a510140591a9b76a568f3a78b49ad/frontend/components/FloatingMenu.test.tsx) | Pure geometry is valuable; exact style strings are not | PR 01 |
| [`frontend/components/SettingsDropdown.test.tsx`](https://github.com/GOvEy1nw/AI-Video-Studio/blob/c405f8224a8a510140591a9b76a568f3a78b49ad/frontend/components/SettingsDropdown.test.tsx) | Placement/theme implementation assertions | PR 01 |
| [`frontend/views/genspace/components/GenSpaceControls.test.tsx`](https://github.com/GOvEy1nw/AI-Video-Studio/blob/c405f8224a8a510140591a9b76a568f3a78b49ad/frontend/views/genspace/components/GenSpaceControls.test.tsx) | Critical keyboard/drop behaviour mixed with layout ownership assertions | PR 01 |
| [`frontend/views/genspace/music/MusicGenPanel.test.tsx`](https://github.com/GOvEy1nw/AI-Video-Studio/blob/c405f8224a8a510140591a9b76a568f3a78b49ad/frontend/views/genspace/music/MusicGenPanel.test.tsx) | DOM order/popover presentation assertions | PR 01 |
| [`frontend/views/genspace/video/VideoGenPanel.test.tsx`](https://github.com/GOvEy1nw/AI-Video-Studio/blob/c405f8224a8a510140591a9b76a568f3a78b49ad/frontend/views/genspace/video/VideoGenPanel.test.tsx) | Exact sibling/order/tool/placement/class assertions | PR 01 |
| [`backend/tests/test_pyright.py`](https://github.com/GOvEy1nw/AI-Video-Studio/blob/c405f8224a8a510140591a9b76a568f3a78b49ad/backend/tests/test_pyright.py) | Type checker duplicated as pytest | PR 01 |
| [`backend/tests/test_no_mock_usage.py`](https://github.com/GOvEy1nw/AI-Video-Studio/blob/c405f8224a8a510140591a9b76a568f3a78b49ad/backend/tests/test_no_mock_usage.py) | Style-policy source scan as pytest | PR 01 |
| [`.projectmem/PROJECT_MAP.md`](https://github.com/GOvEy1nw/AI-Video-Studio/blob/c405f8224a8a510140591a9b76a568f3a78b49ad/.projectmem/PROJECT_MAP.md) | Current-state map names an older stack than package.json | PR 12 |
| [`.projectmem/summary.md`](https://github.com/GOvEy1nw/AI-Video-Studio/blob/c405f8224a8a510140591a9b76a568f3a78b49ad/.projectmem/summary.md) | Chronological issue/attempt accumulation | PR 12 |

## Existing architecture worth preserving

| Evidence | Positive conclusion |
|---|---|
| [`docs/GENSPACE_ARCHITECTURE.md`](https://github.com/GOvEy1nw/AI-Video-Studio/blob/c405f8224a8a510140591a9b76a568f3a78b49ad/docs/GENSPACE_ARCHITECTURE.md) | Clear mode ownership, one generation lifecycle, immutable submission snapshots, no universal schema form |
| [`frontend/views/genspace/GenSpaceSidebar.tsx`](https://github.com/GOvEy1nw/AI-Video-Studio/blob/c405f8224a8a510140591a9b76a568f3a78b49ad/frontend/views/genspace/GenSpaceSidebar.tsx) | Only active generation mode panel renders |
| [`frontend/views/genspace/GenSpaceGallery.tsx`](https://github.com/GOvEy1nw/AI-Video-Studio/blob/c405f8224a8a510140591a9b76a568f3a78b49ad/frontend/views/genspace/GenSpaceGallery.tsx) | Gallery wrapper is memoised and separated from prompt panel |
| [`frontend/hooks/generation/useGenerationJob.ts`](https://github.com/GOvEy1nw/AI-Video-Studio/blob/c405f8224a8a510140591a9b76a568f3a78b49ad/frontend/hooks/generation/useGenerationJob.ts) | Polling exists only for active jobs and cleans up correctly |
| [`electron-builder.yml`](https://github.com/GOvEy1nw/AI-Video-Studio/blob/c405f8224a8a510140591a9b76a568f3a78b49ad/electron-builder.yml) | Build packaging already avoids most source/repository bloat |

## External primary references

- [Vite 8 backend integration / build manifest](https://github.com/vitejs/vite/blob/v8.0.10/docs/guide/backend-integration.md)
- [Vite 8 build/features documentation](https://github.com/vitejs/vite/tree/v8.0.10/docs)
- [Electron `ipcRenderer` structured-clone and async IPC documentation](https://www.electronjs.org/docs/latest/api/ipc-renderer)
- [Electron `contextBridge` supported type/security documentation](https://www.electronjs.org/docs/latest/api/context-bridge)
