# #0401 Krea 2 Edit advertises native inpainting but curated metadata omits mask_preprocessing A, so backend rejects masked Edit

- 2026-07-30T12:12:00Z `issue`: Krea 2 Edit advertises native inpainting but curated metadata omits mask_preprocessing A, so backend rejects masked Edit [backend/model_profiles/profiles.py:krea2_turbo_edit]
- 2026-07-30T12:12:29Z `attempt`: Added explicit native A mask choice to Krea 2 Edit curated setting metadata; matrix rerun pending [backend/model_profiles/profiles.py:krea2_turbo_edit] (partial)
- 2026-07-30T12:12:44Z `attempt`: Native masked-denoising matrix passes for Flux 4B/9B, Krea Edit, and Qwen Edit [backend/tests/test_image_edit.py] (worked)
- 2026-07-30T12:12:49Z `fix`: Krea 2 Edit curated metadata now admits native A mask preprocessing; four-profile native mask matrix passes [backend/model_profiles/profiles.py:krea2_turbo_edit]
