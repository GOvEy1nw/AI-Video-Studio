# #0708 AIVS-042 prepares conditioning media before starting shared generation state, leaving preparation uncancellable and racy

- 2026-08-08T16:50:30Z `issue`: AIVS-042 prepares conditioning media before starting shared generation state, leaving preparation uncancellable and racy [backend/handlers/sfx_generation_handler.py]
- 2026-08-08T18:18:36Z `attempt`: Moved conditioning inside the shared generation lifecycle with post-preparation cancellation check and race-safe start [backend/handlers/sfx_generation_handler.py] (worked)
- 2026-08-08T18:18:42Z `fix`: Shared progress/cancel/concurrency state now owns SFX conditioning as well as inference [backend/handlers/sfx_generation_handler.py]
