# AiVS Director Mode V1 — Standalone Workspace Plan

> Status: implemented baseline, 2026-07-16.
>
> Visual reference: [Director Mode UI Panel & Settings](<resources/Director Mode UI Panel & Settings.jpg>).

This plan supersedes the embedded Video Editor Director plan. Director is a dedicated project tab with its own timeline documents and layout. It shares visual primitives with Video Editor, not NLE data or behaviour.

## 1. Product directive

Director sits between Gen Space and Video Editor and uses the same high-level workspace layout:

- Asset Library at top left;
- Director timeline list at bottom left;
- Director settings at top middle;
- playable Director Preview at top right;
- active Director timeline across the bottom workspace.

Director remains a frame-authored generation tool. `DirectorPromptSegmentV1` must never become `TimelineClip`, and Director state must not alter Edit Timeline playhead, selection, zoom, scroll, undo, or layout.

## 2. V1 scope

V1 focuses on the Prompt track:

- multiple movable Prompt segments;
- visual gaps and segment reordering;
- In/Out handles on every Prompt segment;
- Shift+Out ripple to push following segments;
- one optional image keyframe per Prompt segment;
- Start, Middle, and End keyframe points;
- one optional Continue Video prefix anchored to frame zero;
- right-click Split and Delete;
- `+` controls in empty track space;
- generation into Asset Library.
- Generated track playback of the active timeline's latest output.

Guide Audio and Control Media remain visible, locked, and greyed out. Direct Add-to-Edit and Replace-Selected actions are out of scope.

## 3. Persisted model

Projects own Director documents independently from Edit timelines:

```ts
interface DirectorTimelineDocument {
  id: string
  name: string
  createdAt: number
  updatedAt: number
  sequence: DirectorSequenceV1
}

interface Project {
  timelines: Timeline[]
  directorTimelines?: DirectorTimelineDocument[]
  activeDirectorTimelineId?: string
}
```

Each Director document owns its recipe and latest output reference. Projects support create, select, rename, duplicate, and delete operations. Once initialized, at least one Director timeline remains.

Legacy `Timeline.director` data migrates into standalone Director documents without changing the recipe. The legacy optional field remains readable only for migration and is cleared from Edit timelines after migration.

## 4. Workspace behaviour

### 4.1 Sidebar

- Reuse Video Editor asset cards, selection, takes, context actions, gallery filters, bin controls, and project-persisted bin data in Director.
- Persist empty bins independently from assets so newly created bins never disappear.
- Asset cards support the same Director drag payloads used by Segment Controls.
- Asset search is local to Director.
- Asset/Director-list split and sidebar width are resizable.
- Double-click renames a Director timeline.
- Duplicate creates new segment IDs and clears output ownership through the existing clone helper.

### 4.2 Settings

- Compact model profile, resolution, aspect ratio, locked `24 fps`, undo, and redo live in the header.
- Global Prompt stays above Segment Controls.
- Segment Controls show only the selected segment's media and prompt.
- Media box stays a fixed visual size.
- Split/Delete remain in the segment context menu, not Segment Controls.

### 4.3 Output preview

- Director Preview is a standalone top-right pane, not a card mixed into settings.
- Scrubbing or playing follows the independent Director playhead.
- Continue Video plays during its prefix; other segments preview keyframe media and prompt text.
- Generated video fills available width while preserving aspect ratio and takes priority after completion.
- Progress, validation, warnings, and persistence errors remain associated with this pane.
- Generate/Regenerate, Cancel, and zoom controls live in the timeline footer.
- Switching timelines shows the selected timeline's latest output, not another timeline's live preview.

### 4.4 Resizing

Persist Director layout separately from Video Editor:

- sidebar width;
- Asset/Director-list split;
- Settings/Output split;
- Director timeline height.

Removing embedded Director also removes all Director open/close, preferred-height, Program Monitor collapse, and Director split state from Video Editor.

## 5. Timeline contract

Director uses shared ruler, viewport, segment shell, playhead, and zoom chrome. Editing logic remains Director-specific.

- V1 FPS is locked to 24.
- Persist integer frames using half-open ranges `[startFrame, endFrameExclusive)`.
- Output length snaps upward to `8n+1`.
- Ruler fits 00:00 through the 20-second V1 maximum at minimum zoom.
- Continue Video stays glued to frame zero; only its source In/Out trim changes.
- Normal Prompt segments move freely and can swap order.
- Prompt segments may leave visual gaps.
- During compilation, each next segment start becomes the preceding segment's effective end, so a visual gap never becomes an unprompted backend interval.
- Segment edge controls remain above `+` controls in hit-test order.
- Trailing `+` stays immediately beside the final segment.
- Editor-style timeline tabs sit above the ruler and preserve multiple open Director timelines.
- Generated track sits above Prompt and displays the active timeline's latest output across its full duration.
- Generated track exposes visibility, selection, context-menu deletion, and keyboard deletion; deletion clears only timeline ownership.
- Ruler and playhead support continuous pointer dragging.
- Timeline panel minimum height always contains tabs, ruler, every track, scrollbar, and footer.
- Timeline horizontal scrolling stays anchored to the bottom of the track viewport.

## 6. Prompt and media rules

- Global Prompt is sequence-wide context and never renders as a synthetic segment.
- Local Prompt defaults to the placeholder `Add your text prompt here…`.
- A Prompt segment can hold at most one Key Frame.
- Continue Video is sequence-level but renders as an anchored Prompt-track segment.
- Continue Video can only be added from a segment starting at frame zero.
- Removing Continue Video converts its occupied prefix back into a normal Prompt segment.
- Continue Video Local Prompt is disabled.
- Key Frame Strength is shared across keyframes; when locked, show a padlock instead of slider/value.
- For the current temporary mapping, all keyframes compile through `image_refs` plus `frames_positions`, including first and final frames.

## 7. Multiple-timeline generation safety

Generation records its origin Director timeline ID and authored recipe before submission.

- Completion persists metadata and latest asset ownership to the origin timeline even if selection changes.
- Preview state is shown live only when the selected timeline owns the active generation.
- First generation creates a video Asset.
- Regeneration adds a take when an output Asset already exists.
- Outputs are never inserted into Edit Timeline automatically.

## 8. Backend contract

No new inference path is required:

```text
Director UI
  -> POST /api/director/generate
  -> DirectorGenerationHandler
  -> director_compiler
  -> WanGPBridge.generate_director_video
```

React sends semantic Director data only. Backend continues to own Prompt Relay compilation, frame conversion, media validation, verified WanGP parameters, and generation state.

## 9. File map

| Area | Responsibility |
|---|---|
| `frontend/views/Project.tsx` | Project tab ordering and mounted Director view |
| `frontend/views/DirectorEditor.tsx` | Standalone layout, resize state, initial timeline |
| `frontend/views/director/DirectorSidebar.tsx` | Assets and Director timeline CRUD |
| `frontend/views/director/DirectorWorkspacePanel.tsx` | Settings, output, generation, active timeline |
| `frontend/views/director/DirectorTimeline.tsx` | Frame-authoritative track interaction |
| `frontend/contexts/ProjectContext.tsx` | Migration and Director document persistence |
| `frontend/types/project.ts` | Project and Director document types |
| `frontend/views/VideoEditor.tsx` | NLE only; no embedded Director workspace |

## 10. Verification

Required automated checks:

```text
pnpm typecheck:ts
pnpm build:frontend
uv run pyright
uv run pytest -q --tb=short
git diff --check
```

Manual matrix:

- create, rename, duplicate, select, reload, and delete Director timelines;
- verify each timeline retains independent prompts, media, undo history, zoom, playhead, and output;
- drag Asset Library image/video into legal Segment Controls states;
- move, swap, trim, split, delete, add, gap, and Shift-ripple Prompt segments;
- confirm Continue Video cannot move or be added away from frame zero;
- start generation, switch timelines, and confirm output returns to origin;
- resize every Director divider and confirm Video Editor layout remains unchanged;
- confirm Video Editor has no Director toggle or embedded Director state.

## 11. Acceptance criteria

1. Director appears between Gen Space and Video Editor.
2. Layout matches Video Editor's Asset Library/list/settings-preview/timeline structure.
3. Projects support multiple independent Director timeline documents.
4. Legacy embedded Director data migrates without loss.
5. Output preview is standalone and fills its pane width.
6. Active generation remains associated with its origin timeline.
7. Video Editor contains no Director panel or Director layout state.
8. Existing Prompt, Key Frame, Continue Video, gap, swap, trim, and ripple behaviour remains intact.
9. Guide Audio and Control Media remain locked.
10. Typecheck, build, backend checks, and diff hygiene pass.

## 12. Non-goals

- editable Director FPS;
- authorable Guide Audio or Control Media;
- arbitrary Continue Video placement;
- Director recipe playback/compositing;
- direct Director-to-NLE insertion;
- shared Director/NLE clip data;
- a generic timeline engine;
- any inference runtime other than WanGP.
