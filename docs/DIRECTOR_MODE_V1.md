# Director Mode V1

> Target product contract for the revised prompt-track-first Director UI.
>
> Design reference: [Director Mode UI Panel & Settings](<resources/Director Mode UI Panel & Settings.jpg>).

Director Mode is a dedicated frame-based generation workspace between Gen Space and Video Editor. It uses the same layout and visual language as Video Editor while preserving separate Director timelines, playheads, selection, zoom, scroll, undo history, and generation workflow.

The current implementation may differ until the revised [implementation plan](DIRECTOR_MODE_V1_IMPLEMENTATION_PLAN.md) is complete.

## V1 focus

Director V1 concentrates on the Prompt track:

- multiple movable text-prompt segments, including authored gaps;
- one optional image keyframe per Prompt segment;
- Start, Centre, and End keyframe points;
- one optional Continue Video source anchored to frame zero;
- an editor-style ruler, playhead, segment handles, zoom, and scrolling;
- generation into the Asset Library.

Guide Audio and Control Media tracks remain visible but locked for this release. Their authoring workflows will be implemented after the Prompt track is proven.

## Workspace layout

Director has its own project tab with the same high-level layout as Video Editor:

- Asset Library at top left;
- list of Director timelines at bottom left;
- Director settings at top middle;
- playable Director Preview at top right;
- active Director timeline across the bottom workspace.

The workspace contains:

- compact Director/model/output settings in the header;
- Global Prompt;
- contextual controls for the selected Director segment;
- large standalone Director Preview;
- Generate/Regenerate and Cancel controls;
- bottom Director timeline.

Sidebar sections, sidebar width, settings/output ratio, and timeline height are independently resizable. Director layout state does not alter Video Editor layout state.

Projects may contain multiple Director timelines. Open timelines use editor-style tabs above the timeline viewport. Each stores an independent generation recipe and latest output. Existing Director data formerly embedded in Edit timelines migrates into standalone Director timeline documents.

Asset Library bins, type/source filters, cards, selection, takes, labels, context actions, and bin persistence use the Video Editor presentation and shared project data. Empty bins remain visible across Gen Space, Director, and Video Editor.

## Two timelines, separate purposes

Director Timeline and Edit Timeline deliberately look related, but they are not interchangeable.

Ruler, track-row, segment-frame, playhead, viewport, and zoom chrome are shared visual primitives. Each timeline supplies its own domain adapter and editing rules.

| Director Timeline | Edit Timeline |
|---|---|
| Authors generation intent | Edits finished media |
| Stores integer frames | Stores continuous seconds |
| Uses Prompt and Continue segments | Uses video/audio/text/effect clips |
| Allows authored gaps and segment reordering | Allows normal NLE arrangement |
| Has independent playhead and zoom | Drives Program Monitor playback |
| Has independent undo history | Uses NLE undo history |

Director segments are never stored as `TimelineClip` objects.

## Director header

The compact header exposes:

- Director-enabled model profile;
- resolution;
- aspect ratio;
- locked `24 fps` status;
- undo/redo;

Raw WanGP settings are never exposed in the renderer.

## Global Prompt

Global Prompt describes sequence-wide scene, style, camera, and action intent.

Each Prompt segment may add local text. Empty segments show `Add your text prompt here…`; Global Prompt remains sequence-wide context rather than a synthetic timeline segment.

Director owns Prompt Relay timing. Users should not enter manual `[start:end]` range markers.

## Prompt track

Prompt segments may move, reorder, and leave visual gaps. At generation time, the next segment's start is interpreted as the previous segment's effective end, so visual gaps do not create unprompted backend ranges.

Users can:

- select a segment;
- add a segment from `+` controls in empty timeline space;
- split at Director playhead;
- edit local prompt in Segment Controls;
- trim every segment with In/Out handles;
- hold Shift while dragging an Out handle to push following segments;
- drag segments freely and swap their ordering;
- delete a segment and merge its duration into a neighbour;
- add, replace, or remove one image keyframe;
- change keyframe point;
- undo/redo Director edits.

Split and Delete live in each segment's right-click menu. Timeline segments show prompt excerpts, optional image thumbnails, selection state, and keyframe point using the same visual style as Edit Timeline clips.

## Image keyframes

One image may be attached to each Prompt segment.

Keyframe points:

- **Start** — first occupied frame of segment;
- **Centre** — floor midpoint of segment;
- **End** — final occupied frame of segment.

For the current test mapping, every resolved keyframe is sent through `image_refs` plus `frames_positions`, including keyframes at the first and final output frames. Start/Middle/End controls still resolve the authored absolute frame; they do not select separate WanGP Start Image or End Image inputs.

## Continue Video

Continue Video appears as a normal-looking media segment at the beginning of the Prompt track.

Special rules:

- permanently anchored to frame zero;
- cannot be moved or reordered;
- selected and inspected like another Director segment;
- displays source thumbnail/filmstrip;
- Source In and Source Out handles trim retained source media;
- trimming changes segment width and ripples all generated Prompt segments after it;
- timeline anchor remains zero;
- precise source trim values are also available in Segment Controls;
- output frame count is re-snapped upward after duration changes.

Continue Video remains a special sequence prefix internally. Its visual resemblance to a clip does not make it an NLE clip or ordinary Prompt segment.

## Locked tracks

### Guide Audio

Visible but greyed and locked in revised V1.

- no add/drop action;
- no timeline editing;
- no audio source controls;
- labelled as planned after Prompt Track V1.

### Control Media

Visible but greyed and locked in revised V1.

- Ingredients unavailable for authoring;
- Human Motion unavailable for authoring;
- Depth unavailable for authoring;
- no add/drop, trim, move, or settings controls.

Backend support may remain dormant. Existing projects containing earlier Guide Audio or Control Media data keep that data. Director displays it read-only, explains why it is deferred, and requires deliberate removal before prompt-only V1 generation. Nothing is silently deleted or ignored.

## Preview, generated track, and Asset Library

Director Preview follows the Director playhead:

- Continue Video plays during its retained prefix;
- image keyframes and local/global prompt text display for authored Prompt segments;
- visual gaps retain the preceding Prompt segment's preview intent;
- transport controls play, pause, jump, and scrub independently from Edit Timeline;
- latest generated video takes priority for immediate playback;
- progress and status;
- validation messages.

A Generated track sits above Prompt. It is empty until generation completes, then contains the latest generated video across the output duration. Regeneration replaces that track item with the newest take; prior takes remain available through Asset Library version history. Its eye control switches preview between generated output and authored Prompt playback. Users may select and delete the Generated segment without deleting its Asset Library media.

Generate/Regenerate, Cancel, and zoom controls live in the bottom timeline footer. Director timeline tabs sit above the ruler. Horizontal timeline scrolling stays at the bottom of the track viewport. The playhead supports continuous pointer dragging, and timeline resizing stops before any track is hidden.

Successful output is copied into project-generated storage and becomes a normal video Asset. Later generations may become takes of that Asset.

Director V1 does not provide `Add to Edit Timeline` or `Replace Selected Edit Clip` buttons. Users add generated media to the Edit Timeline through the existing Asset Library workflow.

Director never inserts output into Edit Timeline automatically.

## Frame semantics

- V1 FPS is locked to 24.
- Authored positions use integer frames.
- Segment ranges use `[startFrame, endFrameExclusive)`.
- Output frames round upward to `8n+1`.
- Director never rounds down below authored duration.
- Start point resolves to `startFrame`.
- Centre uses floor midpoint.
- End resolves to `endFrameExclusive - 1`.
- Prompt Relay sent to WanGP uses pinned 1-based inclusive ranges.
- Continue Video Prompt Relay ranges subtract retained source prefix.
- Injected-frame positions remain final-output coordinates before WanGP conversion.

Future editable FPS must use an explicit retime operation while preserving `8n+1`. Existing frame positions must never be silently reinterpreted.

## Focus, playhead, zoom, and undo

Director owns independent transient editing state:

- playhead frame;
- selected segment;
- zoom;
- horizontal scroll;
- keyboard focus;
- undo/redo history.

The active timeline is visibly highlighted. Ctrl/Cmd+Z and Ctrl/Cmd+Shift+Z affect only the focused timeline.

Director playhead supports ruler scrubbing and split-at-playhead. It does not drive Program Monitor playback in V1.

## Persistence

Each project Timeline may store `director: DirectorSequenceV1`.

The recipe stores project Asset IDs rather than renderer-supplied filesystem settings. Live paths resolve only when a semantic generation request is built.

Timeline duplication:

- deep-copies Director recipe;
- creates fresh Prompt segment IDs;
- preserves referenced source Assets;
- does not make duplicate timeline own the previous generated output.

Missing media remains visible as validation state.

## Generation architecture

```text
Director UI
    -> semantic Director request
Director backend handler/compiler
    -> verified WanGP settings
WanGP / Wan2GP
    -> generated project Asset
```

Director uses the same shared generation progress and cancellation state as other generation workflows. It does not add ComfyUI or another runtime.

## V1 non-goals

- editable FPS or automatic retiming;
- authorable Guide Audio;
- authorable Ingredients, Human Motion, or Depth;
- multiple audio/control segments;
- arbitrary audio/control placement;
- audio mixing/inpainting;
- source-audio selection;
- SDR to HDR;
- Video Edit IC-LoRA;
- Retake Mode;
- temporal inpainting;
- NLE effects or transitions on Director segments;
- composited Director recipe playback;
- direct Director-to-NLE insertion controls.

## Troubleshooting

- `DIRECTOR_PROFILE_NOT_SUPPORTED`: select a Director-enabled LTX profile.
- `DIRECTOR_MODEL_UNAVAILABLE`: repair/start local WanGP runtime or install required model.
- `DIRECTOR_PROMPT_OVERLAP`: shared boundaries overlap.
- `DIRECTOR_MISSING_ASSET`: restore or replace referenced image/video.
- `DIRECTOR_INVALID_FRAME_RANGE`: segment or Continue Video trim has invalid timing.
- deferred-track warning: remove stored Guide Audio/Control Media before revised prompt-only V1 generation.

## Manual QA priorities

- visual parity with Edit Timeline;
- no Edit Timeline regression after shared primitive extraction;
- four-segment Prompt Relay timing;
- add/split/delete/ripple operations;
- keyframe Start/Middle/End frame resolution;
- Continue Video source trimming and ripple;
- independent Director timeline documents, zoom, scroll, playhead, and undo;
- standalone sidebar/settings/output/timeline resize persistence;
- locked Guide Audio/Control Media tracks;
- project reload and timeline duplication;
- generated Asset/take persistence;
- manual Asset Library insertion into Edit Timeline.
