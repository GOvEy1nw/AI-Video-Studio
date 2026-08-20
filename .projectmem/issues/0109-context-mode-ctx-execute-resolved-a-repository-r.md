# #0109 context-mode ctx_execute resolved a repository-relative source path from its temp sandbox and failed with ENOENT

- 2026-08-19T11:11:22Z `issue`: context-mode ctx_execute resolved a repository-relative source path from its temp sandbox and failed with ENOENT [investigation/tooling]
- 2026-08-19T11:11:30Z `attempt`: Tried reading backend/model_profiles/video_profiles.py with a repository-relative path inside ctx_execute; temp-sandbox cwd caused ENOENT [investigation/tooling] (failed)
- 2026-08-19T11:11:56Z `attempt`: Retried ctx_execute with the absolute AiVS path and retrieved the requested catalogue slice [investigation/tooling] (worked)
- 2026-08-19T11:11:57Z `fix`: Use absolute workspace paths when ctx_execute reads AiVS source files from its temp sandbox [investigation/tooling]
