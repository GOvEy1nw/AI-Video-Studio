# projectmem - AI-Video-Studio

_Last updated: 2026-07-08_

## Project purpose
AI Video Studio (AiVS) is a local-first desktop app for AI image, video, and future audio/TTS generation. It is forked from `deepbeepmeep/LTX-Desktop-WanGP` and is being reshaped into a Freepik/Higgsfield-style creative studio powered by WanGP / Wan2GP. The project is community-focused, not commercial.

## Recent issues
- No issues logged yet.

## Decisions
- Multi-shot video generation auto-injects LTX-2.3_Cinematic_hardcut.safetensors at strength 1.0 via WanGP activated_loras/loras_multipliers in video_generation_handler when shotPrompts present; no frontend changes needed.

## Notes
- GenSpace PromptBar media input strip is collapsible and collapsed by default; toggle shows attached count badge and resets when mode/profile changes.
- GenSpace UI renames multi-shot feature to Timing; segment labels replace shot wording in timing rows.

## Key files
- `LTX-2.3_Cinematic_hardcut.safetensors`
- `1.0`

## Open questions
- None logged yet.
