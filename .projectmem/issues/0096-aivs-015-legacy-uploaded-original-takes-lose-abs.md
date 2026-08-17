# #0096 AIVS-015 legacy/uploaded original takes lose absent generation metadata after reopen, so switching back can retain the upscale recipe and time

- 2026-08-17T10:17:45Z `issue`: AIVS-015 legacy/uploaded original takes lose absent generation metadata after reopen, so switching back can retain the upscale recipe and time [frontend/contexts/ProjectContext.tsx]
- 2026-08-17T10:24:07Z `attempt`: Stored explicit null sentinels for absent original take metadata and projected them as cleared values [frontend/contexts/ProjectContext.tsx] (worked)
- 2026-08-17T10:24:12Z `fix`: Switching to legacy or uploaded originals no longer inherits upscale metadata [frontend/contexts/ProjectContext.tsx]
