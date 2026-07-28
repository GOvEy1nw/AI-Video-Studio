# #0132 Strict TypeScript found four legacy music request/test fixtures missing new lyricsThink/audioInputs or using removed single-input props.

- 2026-07-25T17:00:59Z `issue`: Strict TypeScript found four legacy music request/test fixtures missing new lyricsThink/audioInputs or using removed single-input props. [frontend/]
- 2026-07-25T17:01:03Z `attempt`: Ran strict TypeScript after the contract change; four test fixtures still used the legacy request/media shape. [frontend/] (failed)
- 2026-07-25T17:02:34Z `attempt`: Updated all four legacy frontend fixtures and media-input test props; strict TypeScript now passes. [frontend/] (worked)
- 2026-07-25T17:02:38Z `fix`: All frontend request, media, and recipe fixtures use the canonical two-input music contract; strict TypeScript passes. [frontend/]
