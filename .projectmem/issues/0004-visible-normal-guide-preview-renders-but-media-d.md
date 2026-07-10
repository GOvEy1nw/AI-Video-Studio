# #0004 Visible normal-guide preview renders but media duration stays zero, hiding trim filmstrip and leaving time display 00:00

- 2026-07-09T20:00:24Z `issue`: Visible normal-guide preview renders but media duration stays zero, hiding trim filmstrip and leaving time display 00:00 [frontend/views/GenSpace.tsx; frontend/components/VideoTrimPanel.tsx]
- 2026-07-09T20:01:18Z `attempt`: Centralized media duration probe now checks loadedmetadata, durationchange, canplay, seekable fallback, and immediate mount state; TypeScript and 51 focused backend tests pass [frontend/views/GenSpace.tsx] (worked)
- 2026-07-09T20:01:22Z `fix`: Fixed zero-duration guide trim by probing media immediately and on all duration readiness events, allowing VideoTrimPanel to render filmstrip and range [frontend/views/GenSpace.tsx]
