# #0444 Video Reframe request serializer still caps each padding edge at legacy 200%

- 2026-07-31T11:30:22Z `issue`: Video Reframe request serializer still caps each padding edge at legacy 200% [frontend/hooks/generation/request-builders.ts]
- 2026-07-31T11:30:26Z `attempt`: Removed legacy 200% request cap while retaining integer rounding required by Video API; focused transport test passes [frontend/hooks/generation/request-builders.ts] (worked)
- 2026-07-31T11:30:29Z `fix`: Video Reframe serializer now rounds precise UI padding without imposing a finite per-edge cap [frontend/hooks/generation/request-builders.ts]
