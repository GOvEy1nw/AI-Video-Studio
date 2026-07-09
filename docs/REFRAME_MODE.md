# Reframe Mode

Reframe is AiVS's video outpainting workflow. It lives under GenSpace video mode as a video process mode, alongside Generate and Retake.

## UI Flow

- `frontend/views/GenSpace.tsx` owns video process mode state: `generate`, `reframe`, or `retake`.
- `frontend/components/ReframePanel.tsx` renders inside the prompt bar area so the gallery remains visible.
- `frontend/components/VideoTrimPanel.tsx` is shared by Retake and Reframe for trim selection and seeking.
- `frontend/components/OutpaintFrameOverlay.tsx` handles aspect, zoom, pan, reset, and padding adjustment.
- Reframe shows an optional prompt textarea below the trim panel. Placeholder: `optional text prompt to drive outpainting...`.
- Blank prompt submits `outpaint`, because WanGP requires a text prompt even for outpainting.

## Aspect And Padding

- Presets: `1:1`, `16:9`, `9:16`.
- Custom mode uses mirrored edge expansion.
- Preset modes use zoom plus pan.
- UI expansion/zoom is capped at 100% per edge.
- Pan redistribution can internally produce up to 200% on one side; backend `ReframePadding` therefore allows 0-200 per edge.
- `frontend/lib/reframe-outpaint.ts` owns the padding/layout math.

## Backend Flow

1. Frontend sends POST `/api/generate` with `reframe`.
2. `backend/handlers/video_generation_handler.py` validates the control video and extracts the selected trim with FFmpeg.
3. `backend/services/reframe_wangp_mapping.py` maps UI padding into `video_guide_outpainting`.
4. `backend/services/wangp_bridge.py` submits the WanGP manifest.

Reframe-specific WanGP settings:

- `video_prompt_type`: `VG`
- `audio_prompt_type`: `K`
- `force_fps`: `auto`
- `sliding_window_overlap`: `33`
- `video_guide_outpainting_ratio`: empty string

Reframe intentionally uses explicit padding from the UI instead of `video_guide_outpainting_ratio`, because same-aspect zoom-out needs to outpaint all sides rather than being treated as no aspect change.

## Video Length

For input-video generations, including Reframe, `video_length` should follow the source clip frame count instead of request FPS.

- `backend/services/video_clip.py` probes source metadata with `imageio_ffmpeg.count_frames_and_secs`.
- Reframe probes the extracted trim clip, so selected trim duration and source FPS drive output length.
- `backend/services/wangp_bridge.py` accepts `video_length_frames` and normalizes it to WanGP's `8n+1` frame rule.
- If metadata probing fails, bridge falls back to the legacy `duration * fps` calculation.

## Tests

Focused checks:

```powershell
cd backend
uv run pytest tests/test_wangp_bridge.py tests/test_generation.py -q
uv run pyright
```

Relevant test files:

- `backend/tests/test_generation.py`
- `backend/tests/test_reframe_wangp_mapping.py`
- `backend/tests/test_wangp_bridge.py`
