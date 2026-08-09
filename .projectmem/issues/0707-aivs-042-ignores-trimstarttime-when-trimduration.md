# #0707 AIVS-042 ignores trimStartTime when trimDuration is omitted

- 2026-08-08T16:50:17Z `issue`: AIVS-042 ignores trimStartTime when trimDuration is omitted [backend/handlers/sfx_generation_handler.py]
- 2026-08-08T18:18:22Z `attempt`: Start-only trims now create a derivative from the requested offset; focused endpoint test passes [backend/handlers/sfx_generation_handler.py] (worked)
- 2026-08-08T18:18:30Z `fix`: Video-conditioned SFX honours trimStartTime even without trimDuration [backend/handlers/sfx_generation_handler.py]
