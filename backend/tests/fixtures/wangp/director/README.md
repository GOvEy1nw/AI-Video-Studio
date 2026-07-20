# WanGP Director settings contracts

- AiVS commit inspected: `07ac96392c096f101c2b3ab6d54e9f4042b451dd`
- Wan2GP commit: `38b9ea381b3808290702068bda569fab89c24286`
- WanGP version: `12.34`
- settings schema: `2.66`

Fixtures are sanitized public settings contracts. Keys and values were checked against current Wan2GP UI choices in `models/ltx2/ltx2_handler.py`, request parsing in `wgp.py`, and Prompt Relay parsing in `shared/prompt_relay.py`. `$...` values replace local paths.

Important semantics:

- `frames_positions` is space/comma-separated and 1-based. WanGP converts each value with `int(pos) - 1`.
- injected frames use `video_prompt_type: "KFI"` plus `image_refs`.
- Prompt Relay frame ranges are 1-based and inclusive.
- Continue Video uses `image_prompt_type: "V"` and `video_source`.
- Ingredients uses `video_prompt_type: "I"` and one `image_refs` entry.
- Human Motion and Depth use `PVG` and `DVG` respectively.

Real GPU output quality/timing still requires manual QA using cases in `docs/DIRECTOR_MODE_V1.md`.
