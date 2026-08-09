# #0701 AIVS-042 model-profile serialization rejects the new MMAudio SFX handler because the API Literal omits sfx_generation

- 2026-08-08T16:23:55Z `issue`: AIVS-042 model-profile serialization rejects the new MMAudio SFX handler because the API Literal omits sfx_generation [backend/api_types.py]
- 2026-08-08T16:24:52Z `attempt`: Added sfx_generation to the serialized SFX handler contract [backend/api_types.py] (partial)
- 2026-08-08T16:36:38Z `attempt`: Pyright showed the SFX handler literal also remained incompatible in video-audio, speech, and video-edit response policies [backend/api_types.py] (partial)
- 2026-08-08T16:37:28Z `fix`: Pyright now accepts sfx_generation across serialized model-profile handler policy contracts [backend/api_types.py]
