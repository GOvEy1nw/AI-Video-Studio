# #0062 Backend Pyright is blocked because sandboxed uv cannot access the user cache sdists-v9/.git

- 2026-08-13T13:25:40Z `issue`: Backend Pyright is blocked because sandboxed uv cannot access the user cache sdists-v9/.git [backend/.venv]
- 2026-08-13T13:26:02Z `attempt`: Escalated Pyright ran and found one real error: VIDEO_PROFILES constant redefinition in the profile variant construction [backend/model_profiles/profiles.py] (partial)
- 2026-08-13T13:26:27Z `attempt`: Renamed the initial profile tuple to a private template constant and assigned VIDEO_PROFILES once; Pyright passes with zero errors [backend/model_profiles/profiles.py] (worked)
- 2026-08-13T13:26:33Z `fix`: Backend profile variants now construct without constant redefinition and Pyright reports zero errors [backend/model_profiles/profiles.py]
