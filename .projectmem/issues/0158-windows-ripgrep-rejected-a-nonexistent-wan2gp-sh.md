# #0158 Windows ripgrep rejected a nonexistent Wan2GP/shared/api/*.py path while locating the pinned API surface; shared/api.py search still succeeded.

- 2026-07-26T10:26:39Z `issue`: Windows ripgrep rejected a nonexistent Wan2GP/shared/api/*.py path while locating the pinned API surface; shared/api.py search still succeeded. [Wan2GP/shared/api.py]
- 2026-07-26T10:26:44Z `attempt`: Searched shared/api.py plus an assumed shared/api package glob; the nonexistent package path produced an error although the real file returned all required symbols. [Wan2GP/shared/api.py] (partial)
- 2026-07-26T10:26:58Z `attempt`: Repeated the API lookup against the explicit shared/api.py file; all required discovery and postprocess methods were found without errors. [Wan2GP/shared/api.py] (worked)
- 2026-07-26T10:27:02Z `fix`: Pinned API inspection now uses Windows-safe explicit file paths; no repository change was required. [Wan2GP/shared/api.py]
