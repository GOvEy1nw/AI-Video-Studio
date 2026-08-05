# #0588 AIVS-020 AppSettings reload after restart can overwrite unsynced in-memory user changes with older backend values.

- 2026-08-05T12:53:20Z `issue`: AIVS-020 AppSettings reload after restart can overwrite unsynced in-memory user changes with older backend values. [frontend/contexts/AppSettingsContext.tsx]
- 2026-08-05T12:59:00Z `attempt`: Limited settings auto-load to first success and added lifecycle-token gating so restart cannot overwrite in-memory edits. [frontend/contexts/AppSettingsContext.tsx] (worked)
- 2026-08-05T13:08:24Z `fix`: Settings auto-load stops after first success and lifecycle-gated late responses cannot overwrite retained in-memory edits; provider regression passes. [frontend/contexts/AppSettingsContext.tsx]
