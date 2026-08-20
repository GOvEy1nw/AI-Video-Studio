# #0112 AIVS-012 style_prompt review found prompt-only generation dispatch untested; validation coverage alone would not catch accidental LoRA download or missed suffix injection

- 2026-08-19T11:37:02Z `issue`: AIVS-012 style_prompt review found prompt-only generation dispatch untested; validation coverage alone would not catch accidental LoRA download or missed suffix injection [backend/tests/test_generation.py]
- 2026-08-19T11:40:16Z `attempt`: Added one synthetic prompt-only generation regression asserting one suffix injection and zero style LoRA downloads; focused node passed [backend/tests/test_generation.py] (worked)
- 2026-08-19T11:40:16Z `fix`: Prompt-only styles are now covered end to end through /api/generate; exact-once suffix injection and no LoRA download pass [backend/tests/test_generation.py]
