# #0020 AIVS-003 combined profile/API patch did not apply because the video-profile insertion context differed; no source files changed.

- 2026-08-11T15:30:59Z `issue`: AIVS-003 combined profile/API patch did not apply because the video-profile insertion context differed; no source files changed. [backend/model_profiles/profiles.py]
- 2026-08-11T15:30:59Z `attempt`: AIVS-003 combined profile/API patch did not apply because the video-profile insertion context differed; no source files changed. [backend/model_profiles/profiles.py] (failed)
- 2026-08-11T15:40:24Z `attempt`: Focused H3 tests exposed profile import failure: H3 role constants were inserted after VIDEO_PROFILES and were undefined during profile construction. [backend/model_profiles/profiles.py] (failed)
- 2026-08-11T15:42:01Z `attempt`: Focused H3 tests next exposed missing curated resolution entries; adding the profile to tiers alone did not copy the base 1:1/16:9/9:16 resolutions. [backend/model_profiles/resolution_resolver.py] (failed)
- 2026-08-11T15:42:21Z `attempt`: H3 profile, routing, alias compilation, bridge manifest, and combined-pack focused backend tests pass (158 tests). [backend/handlers/video_generation_handler.py] (worked)
- 2026-08-11T15:43:44Z `attempt`: TypeScript rejected the H3 FL media-slot ref map because its declared type included image although only video/audio entries exist. [frontend/views/genspace/video/VideoMediaInputs.tsx] (failed)
- 2026-08-11T15:44:12Z `attempt`: Narrowed H3 FL slot media type to video/audio; strict TypeScript check now passes. [frontend/views/genspace/video/VideoMediaInputs.tsx] (worked)
- 2026-08-11T15:44:55Z `attempt`: Pyright found combined-pack typing gaps: redundant str guard, unknown union result, and un-narrowed pack name. [backend/wangp_model_packs.py] (failed)
- 2026-08-11T15:46:03Z `attempt`: Narrowed combined-pack values and resolved paths incrementally; Pyright now passes with zero errors and warnings. [backend/wangp_model_packs.py] (worked)
- 2026-08-11T15:47:14Z `fix`: AIVS-003 H3 profile, routing, stable alias compilation, bridge mapping, combined pack, and Copy Settings persistence are confirmed by focused tests and strict type checks. [backend/handlers/video_generation_handler.py]
