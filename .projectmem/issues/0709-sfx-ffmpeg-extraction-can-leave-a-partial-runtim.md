# #0709 SFX ffmpeg extraction can leave a partial runtime-owned derivative when ffmpeg fails

- 2026-08-08T16:50:46Z `issue`: SFX ffmpeg extraction can leave a partial runtime-owned derivative when ffmpeg fails [backend/services/video_clip.py]
- 2026-08-08T18:18:48Z `attempt`: Unlink partial video derivative before raising on ffmpeg failure [backend/services/video_clip.py] (worked)
- 2026-08-08T18:23:59Z `fix`: Failed ffmpeg trims now delete partial derivatives; regression test and Pyright pass [backend/services/video_clip.py]
