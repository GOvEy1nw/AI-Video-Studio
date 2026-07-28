# GenSpace full-split parity checklist

Baseline source: `73517fd5ff2c93fca0bad2f8460d5807a4c4ddd6` on `dev`.

## Automated and structural parity

- [x] Image, Video, and Music own complete explicit panels below the main tabs.
- [x] `GenSpace.tsx` is a thin route entry and there is one GenSpace
  `useGeneration()` instance.
- [x] Image/video/music settings and attached media survive conditional panel
  unmounts.
- [x] Generate/Reframe/Music/disabled-Retake commands are pure and covered.
- [x] Enter submits, Shift+Enter inserts a newline, invalid Generate is
  disabled, Retake is disabled, and the merged Music lyrics prompt states are
  covered.
- [x] Media role/count/replacement inference and Image/Cover Song/Transfer
  Timbre gallery drops are covered.
- [x] Owned fallback object URLs are revoked on workspace unmount.
- [x] Image/video/music/Reframe asset metadata and Copy Settings restoration
  are covered.
- [x] Completion persistence uses immutable submission project IDs and
  idempotency guards.
- [x] Legacy/current image result paths, music mapping, and Director facade
  compatibility are covered.
- [x] One shared job owns 500 ms polling, cancellation, cleanup, StrictMode
  replay, backend errors, and terminal-state protection.
- [x] Gallery props exclude prompt/settings and remain stable during
  prompt-only updates.
- [x] No panel imports project context or calls `useGeneration()`.
- [x] No panel is lazy-loaded or kept mounted while inactive.
- [x] New GenSpace code contains no `any`.

## Manual Electron parity

- [ ] Image panel: default/fallback model controls, multi-input roles,
  replace/remove, enhancement, seed, variations, and Copy Settings.
- [ ] Video Generate: start/end/guide media, role menu, trim playback/seeking,
  auto/Continue duration, source audio, resolution/aspect clamps, and metadata.
- [ ] Reframe: source, trim, padding, aspect, optional/blank prompt,
  persistence, and Copy Settings.
- [ ] Music: instrumental/auto/custom tabs, merged inline-action lyrics prompt,
  generation-time lyric composition/enhancement, Cover/Timbre inputs,
  duration/BPM/variation sliders, variation takes, and Copy Settings.
- [ ] Gallery: Explorer drop/import, duplicate handling, filters/favourites/
  bins, grid/list sizing, previews, takes, context actions, delete, Create
  Video, and Reframe.
- [ ] Project switching does not leak settings/media or write a completed
  result to the active project.
- [ ] Generation/model-download progress and cancellation use one polling loop;
  tab switches and prompt typing make no backend request.

## Final gates

- [x] `pnpm typecheck` — TypeScript and strict Pyright passed.
- [x] `pnpm test:frontend` — 17 files / 55 tests passed.
- [x] `pnpm backend:test` — 278 passed / 1 WanGP integration check skipped.
- [x] `pnpm build:frontend`
- [x] Dev Electron launch smoke — one app window, renderer on 5173, FastAPI
  ready, GPU/runtime detected, and WanGP session preload completed.
- [x] Renderer bundle comparison — 955.70 kB versus the recorded 948.42 kB
  baseline (+0.77%).

Interactive Windows capture is blocked on this host by `GetCursorPos` access
denial. The native drag/drop, media seeking/playback, and full visual parity
items above remain explicit manual checks rather than inferred passes.
