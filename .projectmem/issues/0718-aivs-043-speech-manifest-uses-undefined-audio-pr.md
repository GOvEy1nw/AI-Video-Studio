# #0718 AIVS-043 Speech manifest uses undefined audio_prompt instead of audio_prompt_type, breaking strict Pyright and runtime manifest construction.

- 2026-08-09T11:16:37Z `issue`: AIVS-043 Speech manifest uses undefined audio_prompt instead of audio_prompt_type, breaking strict Pyright and runtime manifest construction. [backend/services/wangp_bridge.py]
- 2026-08-09T11:17:24Z `attempt`: Corrected the Scenema manifest to use audio_prompt_type and formatted the typed settings update; rerunning strict Pyright. [backend/services/wangp_bridge.py] (partial)
- 2026-08-09T11:19:24Z `attempt`: Focused real bridge manifest regression and strict Pyright pass with audio_prompt_type mapped correctly. [backend/services/wangp_bridge.py] (worked)
- 2026-08-09T11:19:32Z `fix`: Corrected Scenema manifest audio_prompt_type mapping and added a focused bridge regression; Pyright passes. [backend/services/wangp_bridge.py]
