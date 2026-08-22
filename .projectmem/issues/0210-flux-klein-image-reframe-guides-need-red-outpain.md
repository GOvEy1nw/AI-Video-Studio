# #0210 Flux Klein image Reframe guides need red outpaint background instead of the shared default fill.

- 2026-08-22T16:08:59Z `issue`: Flux Klein image Reframe guides need red outpaint background instead of the shared default fill. [backend/services/image_edit.py; backend/handlers/image_generation_handler.py]
- 2026-08-22T16:13:33Z `attempt`: Added a materializer background parameter with gray default and selected pure red for Flux Klein image profiles; validation pending. [backend/services/image_edit.py; backend/handlers/image_generation_handler.py; backend/tests/test_image_edit.py] (partial)
- 2026-08-22T16:14:02Z `attempt`: Focused Flux Klein Reframe regressions confirm both 4B and 9B materialize pure-red guide backgrounds. [backend/services/image_edit.py; backend/handlers/image_generation_handler.py; backend/tests/test_image_edit.py] (worked)
- 2026-08-22T16:23:56Z `fix`: Flux Klein 4B/9B image Reframe now materializes pure-red outpaint guide backgrounds while all other profiles retain gray. [backend/services/image_edit.py; backend/handlers/image_generation_handler.py; backend/tests/test_image_edit.py]
