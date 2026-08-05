# #0592 AIVS-020 retains stale profile in-flight promise across restart, so a hung request can block new lifecycle loads.

- 2026-08-05T13:03:00Z `issue`: AIVS-020 retains stale profile in-flight promise across restart, so a hung request can block new lifecycle loads. [frontend/contexts/ModelProfilesContext.tsx]
- 2026-08-05T13:06:05Z `attempt`: Detached profile in-flight and queued mutation promises on non-alive transitions; generation guards prevent old completions from blocking or overwriting new loads. [frontend/contexts/ModelProfilesContext.tsx] (worked)
- 2026-08-05T13:08:41Z `fix`: Profile in-flight and queued mutation requests detach across restarts; new alive generation loads immediately while stale completion is discarded. [frontend/contexts/ModelProfilesContext.tsx]
