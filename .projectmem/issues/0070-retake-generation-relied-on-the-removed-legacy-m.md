# #0070 Retake generation relied on the removed legacy model=fast fallback and now constructs a video request without a canonical model profile ID.

- 2026-08-15T16:09:07Z `issue`: Retake generation relied on the removed legacy model=fast fallback and now constructs a video request without a canonical model profile ID. [backend/handlers/retake_handler.py]
- 2026-08-15T16:10:40Z `attempt`: Set Retake's internally constructed GenerateVideoRequest modelProfileId to ltx2_25_fast; the focused 187-test backend suite passed. [backend/handlers/retake_handler.py] (worked)
- 2026-08-15T16:10:45Z `fix`: Retake now explicitly selects canonical LTX 2.5 Fast, preserving retake generation after removal of the legacy model=fast fallback; focused backend suite passed 187 tests. [backend/handlers/retake_handler.py]
