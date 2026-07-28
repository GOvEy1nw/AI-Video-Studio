# #0140 Strict Pyright infers GenerateMusicRequest.audioInputs as list[Unknown] from the constrained Pydantic Field declaration.

- 2026-07-25T17:27:36Z `issue`: Strict Pyright infers GenerateMusicRequest.audioInputs as list[Unknown] from the constrained Pydantic Field declaration. [backend/api_types.py]
- 2026-07-25T17:27:59Z `attempt`: Gave the Pydantic audioInputs default factory an explicit MusicAudioInputRequest element type. [backend/api_types.py] (partial)
- 2026-07-25T17:28:12Z `attempt`: Backend Pyright now passes with zero errors after typing the audioInputs default factory. [backend/api_types.py] (worked)
- 2026-07-25T17:28:16Z `fix`: GenerateMusicRequest.audioInputs retains its concrete element type under strict Pyright. [backend/api_types.py]
