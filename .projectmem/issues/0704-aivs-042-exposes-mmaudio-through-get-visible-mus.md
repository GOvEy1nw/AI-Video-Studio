# #0704 AIVS-042 exposes MMAudio through get_visible_music_profiles, breaking the curated Music-only backend contract

- 2026-08-08T16:38:34Z `issue`: AIVS-042 exposes MMAudio through get_visible_music_profiles, breaking the curated Music-only backend contract [backend/model_profiles/profiles.py]
- 2026-08-08T16:40:00Z `attempt`: Separated visible dedicated SFX profiles from the Music-only profile getter and included both in the model-profile endpoint [backend/model_profiles/profiles.py] (partial)
- 2026-08-08T16:40:39Z `fix`: Music-only profile discovery and dedicated SFX discovery now remain separate; focused profile tests pass [backend/model_profiles/profiles.py]
