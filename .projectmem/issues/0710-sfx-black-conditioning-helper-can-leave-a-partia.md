# #0710 SFX black conditioning helper can leave a partial runtime-owned clip when ffmpeg fails

- 2026-08-08T18:25:19Z `issue`: SFX black conditioning helper can leave a partial runtime-owned clip when ffmpeg fails [backend/services/video_clip.py]
- 2026-08-08T18:26:25Z `attempt`: Black conditioning helper now unlinks partial MP4 output before raising on ffmpeg failure [backend/services/video_clip.py] (worked)
- 2026-08-08T18:26:37Z `fix`: Failed black-video conditioning now deletes partial derivatives; regression test passes [backend/services/video_clip.py]
