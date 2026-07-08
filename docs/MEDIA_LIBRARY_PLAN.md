# Media Library Plan — GenSpace friction reduction

Status: Draft plan (2026-07-08). Implement **one feature at a time** in phase order below.

## Goal

Make adding, reusing, and organizing media in QuickGen as frictionless as possible: drag from gallery to inputs, upload into gallery, deduplicate by filename, filter by type/source, organize with bins — without breaking the video editor’s heavier in-place import workflow.

## Product decisions (locked for v1)

| Topic | Decision |
| --- | --- |
| **GenSpace vs editor storage** | **GenSpace copies** files into project assets (portable, safe for generation inputs). **Editor references in place** for user imports (heavy video files stay where they are). |
| **Audio gallery tiles** | Prefer **real waveform** via existing `computeWaveform` / `ClipWaveform` (cached). Fallback: static placeholder wave + Music icon while loading or on decode failure. |
| **Mini picker modal** | **Deferred.** Re-evaluate after Phases A–C; may skip if drag/drop + gallery upload is enough. |
| **Folders** | **Bins only** (`Asset.bin` string). Reuse editor bin patterns; no nested folder tree in v1. |

## Current baseline (code)

- Gallery drag: **images only** on `AssetCard` (`draggable={asset.type === "image"}`).
- Vid/Aud guide slot: popup chooser; drop handler accepts **files only**, not gallery `asset` JSON.
- GenSpace gallery filter: **`generationParams` required** — uploads hidden.
- Source inference: generated ≈ has `generationParams`; uploaded ≈ no `generationParams` (no explicit field yet).
- Input attach: uses `file://` / blob URLs; **does not** add to gallery (except generation completion effects).
- Electron `copy-to-project-assets`: copies by basename; **overwrites** on name collision.
- Bins: implemented in **video editor** `LeftPanel`; not in GenSpace.
- Waveform: `frontend/components/AudioWaveform.tsx` exports `computeWaveform`, `ClipWaveform`, global `waveformCache`.

---

## Architecture

### Shared module: `frontend/lib/media-import.ts`

Single entry point for GenSpace-side media ingestion (copy-into-project policy).

```ts
type MediaImportSource = 'upload' | 'generation-input' | 'gallery-reuse'

type ImportMediaOptions = {
  projectId: string
  filePath: string          // absolute path from Electron File.path or existing asset.path
  fileName?: string
  policy: 'copy-into-project' | 'reference-in-place'  // GenSpace vs editor
  onDuplicate?: 'prompt' | 'reuse' | 'suffix' | 'overwrite'  // default 'prompt' for uploads
}

type ImportMediaResult = {
  asset: Asset
  reusedExisting: boolean
}

importMediaAsset(options): Promise<ImportMediaResult>
resolveAssetForInput(asset | filePath): Promise<{ url, path, assetId }>
detectMediaType(file): 'image' | 'video' | 'audio' | null
defaultGuideRoleForType(type): string  // video → human_motion, audio → audio_to_video
```

**Callers (target state):**

| Caller | Policy | Notes |
| --- | --- | --- |
| GenSpace gallery drop | `copy-into-project` | New uploaded assets |
| GenSpace input attach (file pick / drop) | `copy-into-project` + optional gallery add | Feature 4 |
| GenSpace generation persist | existing `copyToAssetFolder` | Migrate to shared helper over time |
| Video editor `handleImportFile` | `reference-in-place` | **Unchanged behavior** |
| Mini picker (if ever built) | `copy-into-project` | Deferred |

### Electron IPC extensions

Extend `copy-to-project-assets` (or add `import-to-project-assets`):

- `destExists` check before copy
- `strategy`: `reuse` \| `suffix` \| `overwrite`
- Return `{ path, url, fileName, alreadyExisted }`

Optional: `findProjectAssetByFileName(projectId, baseName)` for reuse-existing UX.

### Asset model (minimal v1 extension)

Add optional field on `Asset` (backward compatible):

```ts
source?: 'generated' | 'uploaded'  // explicit; infer from generationParams if missing
```

Migration: existing generated assets → `source: 'generated'` when `generationParams` present; imports → `uploaded`.

GenSpace gallery: show **all** image/video/audio assets (stop filtering to `generationParams` only). Use `source` + filters for Generated/Uploaded tabs later.

### UI components (incremental)

| Component | Phase | Purpose |
| --- | --- | --- |
| `AssetCard` updates | A, B | Drag video/audio; audio waveform tile |
| `GalleryFilters` | C | Type + source checkboxes |
| `GalleryBinBar` | D | Port from editor `LeftPanel` bin UX |
| `MediaPickerModal` | Optional | Deferred mini-gallery picker |

---

## Implementation phases

### Phase A — Input friction killers (no gallery model changes)

**A1. Gallery → Vid/Aud drag**

- Enable `draggable` on video (and audio when shown) in `AssetCard`.
- Wire guide slot `onDrop` to parse `asset` JSON (same as `handleDrop`).
- Map types: video → `addVideoInput`, audio → `addAudioInput`.

**Verify:** Drag generated video from gallery onto Vid/Aud slot; role defaults apply.

**A2. Simplify Vid/Aud empty slot**

- Remove Video/Audio popup on empty guide slot.
- Single click → one file input `accept="video/*,audio/*,.mp3,.wav,…"`.
- On select: infer type → default role (`human_motion` / `audio_to_video`).
- Keep filled-slot role menu unchanged.

**Verify:** Click Vid/Aud → pick `.mp3` → audio guide attached with correct default role.

**Files (typical):** `frontend/views/GenSpace.tsx` (`PromptBar`, `AssetCard`).

**Estimated effort:** ~1 day total.

---

### Phase B — Gallery foundation

**B1. Shared `media-import.ts` + Electron dedup**

- Implement `importMediaAsset` with `copy-into-project`.
- IPC: suffix copy (`name (2).ext`), reuse path, or prompt hook.
- Unit/integration: duplicate basename behavior.

**B2. Drop files onto GenSpace gallery**

- Gallery container accepts drag/drop (OS files).
- Validate image/video/audio only; reject others with toast.
- Import via `importMediaAsset`; `source: 'uploaded'`, no `generationParams`.
- Remove GenSpace `assets.filter(a => a.generationParams)`.

**B3. Input attach → also add to gallery**

- When user adds media via file pick/drop to any input slot:
  - If from gallery drag → reuse asset (no duplicate).
  - If from filesystem → `importMediaAsset` + `addAsset` if not already in project.
- Input slots store `assetId` reference where possible (optional v1: keep url/path but dedupe by path).

**B4. Duplicate filename dialog**

- On import collision: modal — **Use existing asset** | **Add as new copy** (auto suffix).
- Compare by basename in project assets folder + existing `Asset.path`.

**Verify:** Upload same file twice → dialog; reuse skips second copy; suffix creates `(2)` file + new asset.

**Files:** `frontend/lib/media-import.ts`, `electron/ipc/file-handlers.ts`, `frontend/types/project.ts`, `GenSpace.tsx`, small dialog component.

**Estimated effort:** ~3–4 days.

---

### Phase C — Gallery filters

**C1. Filter dropdown**

- Next to Favorites / grid size: filter popover.
- **Type:** checkboxes Image, Video, Audio (multi-select, default all).
- **Source:** checkboxes Generated, Uploaded (multi-select, default all).
- Filter logic uses `asset.type` + `source` (or `generationParams` fallback).

**C2. Audio gallery tiles**

- Extend `AssetCard` for `type === 'audio'`.
- Use `ClipWaveform` (~200 buckets) in tile; loading skeleton → placeholder wave on failure.
- Lazy decode: only when card mounts / enters viewport (optional `IntersectionObserver` if perf issue).

**Verify:** Upload MP3 appears in gallery with waveform; filter to Uploaded + Audio only.

**Estimated effort:** ~1–2 days.

---

### Phase D — Bins in GenSpace

- Port bin bar patterns from `frontend/views/editor/LeftPanel.tsx`:
  - Create bin, select bin filter, assign asset to bin (context menu or drag — start with context menu).
  - Rename/delete bin (update `Asset.bin` on affected assets).
- GenSpace filtered view respects selected bin + Phase C filters.

**Verify:** Create bin “References”, assign uploaded image, filter gallery to bin.

**Estimated effort:** ~1–2 days.

---

### Phase E — Mini picker (optional, deferred)

Re-evaluate after A–D. Build only if click-to-pick is still painful.

**Scope if approved:**

- Modal anchored to clicked input slot.
- Tabs: Generated | Uploads (filter by `source`).
- Default type filter from slot kind (image vs video/audio).
- Grid reuses `AssetCard` compact variant + upload button.
- Select → assign to slot + close.

**Estimated effort:** ~2–3 days.

---

## Suggested implementation order (one PR/feature at a time)

1. **A1** — Gallery video/audio drag to Vid/Aud  
2. **A2** — Single picker + format-based role  
3. **B1** — `media-import.ts` + Electron IPC  
4. **B2** — Gallery file drop + show all assets  
5. **B3** — Input → gallery sync  
6. **B4** — Duplicate filename dialog  
7. **C1** — Filter dropdown  
8. **C2** — Audio waveform tiles  
9. **D** — Bins in GenSpace  
10. **E** — Mini picker (optional)

---

## Testing checklist (per phase)

- Manual: drag gallery video → Vid/Aud; drag image → start/end slots (unchanged).
- Manual: upload PNG/MP4/MP3 to gallery; appears after refresh/filter.
- Manual: attach file to input → same asset in gallery; gallery drag to input does not duplicate.
- Manual: duplicate filename dialog both paths.
- Filters: combinations of type + source + favorites + bin.
- Editor regression: import still references in place; no copy to project assets from editor.
- `pnpm typecheck:ts` + existing frontend build.

---

## Out of scope (v1)

- Nested folder tree
- Mini picker (until re-evaluated)
- Backend/API changes (local Electron + project JSON only)
- WanGP model changes
- Auto-sync editor imports into GenSpace copies

---

## Key files reference

| Area | Path |
| --- | --- |
| GenSpace gallery + inputs | `frontend/views/GenSpace.tsx` |
| Asset types | `frontend/types/project.ts` |
| Project state | `frontend/contexts/ProjectContext.tsx` |
| Copy to assets | `frontend/lib/asset-copy.ts`, `electron/ipc/file-handlers.ts` |
| Editor import (in-place) | `frontend/views/editor/useClipOperations.ts` |
| Editor bins (reference) | `frontend/views/editor/LeftPanel.tsx` |
| Waveform | `frontend/components/AudioWaveform.tsx` |
