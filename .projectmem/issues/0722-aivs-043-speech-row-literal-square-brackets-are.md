# #0722 AIVS-043 Speech-row literal square brackets are interpreted as Scenema actions, bypassing the structured Action/Speech boundary.

- 2026-08-09T11:29:32Z `issue`: AIVS-043 Speech-row literal square brackets are interpreted as Scenema actions, bypassing the structured Action/Speech boundary. [backend/handlers/speech_generation_handler.py]
- 2026-08-09T11:45:39Z `attempt`: Normalized literal square brackets in Speech rows to parentheses before compiling WanGP prompts; backend compiler regression passed in the focused suite. [backend/handlers/speech_generation_handler.py] (worked)
- 2026-08-09T11:45:43Z `fix`: Literal brackets in authored Speech text can no longer inject unintended Scenema action cues; focused compiler test passed. [backend/handlers/speech_generation_handler.py]
