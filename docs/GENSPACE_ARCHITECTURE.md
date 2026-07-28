# GenSpace architecture

`frontend/views/GenSpace.tsx` is the route entry. It renders
`GenSpaceWorkspace`, which composes the sidebar, gallery, and overlays from one
always-mounted controller.

## Composition

```text
GenSpace
└─ GenSpaceWorkspace
   ├─ useGenSpaceController
   │  ├─ mode/settings/media/video-tool state
   │  ├─ one useGeneration instance
   │  ├─ generation actions and immutable snapshots
   │  ├─ result persistence and settings restoration
   │  └─ gallery controller
   ├─ GenSpaceSidebar
   │  ├─ image/ImageGenPanel
   │  ├─ video/VideoGenPanel
   │  └─ music/MusicGenPanel
   ├─ GenSpaceSelectedGeneration
   ├─ GenSpaceGallery
   └─ GenSpaceOverlays
```

Only the active panel is rendered. Generation-critical state lives in hooks
above the panels, so tab switches do not reset settings or create hidden media
elements.

The center detail header uses the selected asset prompt and keeps Copy Settings
beside it. Asset Library grid cards are square, crop image/video media with
`object-cover`, and never autoplay audio or video on hover.

Mode-owned UI and helpers live under `image/`, `video/`, or `music/`.
Cross-mode controls remain in `components/`; cross-mode state, effects, and
pure workflow logic remain in `hooks/` and `logic/`. Keep these folders direct
and shallow rather than adding one-file `views/components/lib` subfolders.

## Ownership

| Area | Owner |
| --- | --- |
| Main/video mode transitions | `hooks/useGenSpaceModeState.ts` |
| Typed image/video/music settings | `hooks/useGenSpaceSettingsState.ts` |
| Prompt and attached media | `hooks/useGenSpaceMediaInputs.ts` |
| Reframe/Retake panel state | `hooks/useGenSpaceVideoTools.tsx` |
| Image panel UI | `image/` |
| Video, Reframe, Retake, and trim UI | `video/` |
| Music panel, media, lyrics settings, advanced settings, compiler, and keywords | `music/` |
| Per-mode command construction | `logic/generation-requests.ts` |
| Submission and immutable snapshots | `hooks/useGenSpaceGenerationActions.ts` |
| Generated asset metadata | `logic/generation-assets.ts` |
| Completion persistence/idempotency | `hooks/useGenSpaceResultPersistence.ts` |
| Copy Settings | `logic/settings-restore.ts` and `hooks/useGenSpaceSettingsRestore.ts` |
| Editor/context hand-offs | `hooks/useGenSpaceExternalHandoffs.ts` |
| Gallery selection/state/actions | `hooks/useGenSpaceGallery.ts` |
| Selected asset/current generation detail | `GenSpaceSelectedGeneration.tsx` |
| Narrow gallery and dialog presentation | `GenSpaceGallery.tsx` and `GenSpaceOverlays.tsx` |

Panels receive mode-specific controller contracts. They do not import project
context, call backend endpoints, persist assets, or instantiate
`useGeneration`.

## Music contract

- Music has one full settings mode. `experienceMode: "advanced"` remains only
  for saved-generation compatibility.
- `MusicMediaInputs` owns independent Cover Song and Transfer Timbre slots.
  The backend maps none/Cover/Timbre/both to WanGP audio tasks `""`, `A`, `B`,
  and `AB`.
- Instrumental, Auto Lyrics, and Custom Lyrics share one three-way tab.
  One lyrics prompt stays visible but is disabled outside Custom Lyrics.
  Seed, Compose Lyrics, and the Think switch sit inside its lower-right action
  row. Compose treats the current text as an idea and replaces it with the
  composed lyrics.
- Auto Lyrics composes hidden lyrics from the song description during
  generation. Empty Custom Lyrics does the same with its optional idea,
  Think, and lyrics seed; vocal covers still require original custom lyrics.
- Description enhancement is a green generation-time toggle for WanGP music
  LM Chain Of Thought preprocessing, not an immediate prompt rewrite.
- Duration, BPM, and Variations use native range inputs.

## Generation lifecycle

`frontend/hooks/use-generation.ts` remains the public compatibility facade for
GenSpace and Director. Pure transport builders and progress formatters live in
`frontend/hooks/generation/`; `useGenerationJob` owns the single state object,
abort controller, 500 ms polling interval, cancellation route, terminal-state
guard, and unmount cleanup.

Per-mode GenSpace builders run only on submission. Each successful submission
captures the project ID, prompt, settings, media roles/paths, and trim data
needed to persist the result. Completion effects consume that snapshot rather
than live UI state, use idempotency keys, and write to the submission project
even if the user switches projects.

## Compatibility and performance rules

- Existing backend endpoints, request field conversions, project schema, and
  `generationParams` remain compatible.
- Guide/audio role groups have one source in `genspace/constants.ts`.
- `GenerationSettings` lives in `frontend/types/generation.ts`.
- Panels use static imports; this refactor does not introduce tab loading.
- `GenSpaceGallery` is memoized and receives no prompt/settings values.
- Gallery library, progress badges, import callback, Copy Settings callback,
  and Reframe hand-off callbacks stay stable during prompt-only updates.
- Direct imports are preferred over a broad barrel while the architecture is
  evolving.

## Adding a generation mode

1. Define its settings, snapshot, and panel-controller types.
2. Add an explicit panel and mode tab while keeping persistent state in an
   always-mounted hook.
3. Add a pure GenSpace command builder and transport request builder if a new
   endpoint is required.
4. Dispatch through `useGenSpaceGenerationActions`; do not call
   `useGeneration` from the panel.
5. Add a pure asset builder and idempotent persistence path.
6. Extend settings restoration, focused tests, and the parity checklist.

Do not add a schema-driven universal form, a second project/gallery context,
an independent polling hook, or lazy-loaded panels without a separately
measured need.
