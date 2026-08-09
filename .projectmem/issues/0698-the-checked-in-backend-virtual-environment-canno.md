# #0698 The checked-in backend virtual environment cannot start because its interpreter points to a missing user-level uv Python path, blocking direct real-model Retake validation.

- 2026-08-07T10:46:58Z `issue`: The checked-in backend virtual environment cannot start because its interpreter points to a missing user-level uv Python path, blocking direct real-model Retake validation. [backend/.venv]
- 2026-08-07T10:47:14Z `attempt`: Tried the existing backend .venv interpreter for a read-only imageio-ffmpeg probe; it could not launch because its base uv-managed Python no longer exists. (failed)
- 2026-08-07T10:47:30Z `attempt`: Tried uv's managed runtime with --no-sync; sandbox access to the uv cache was denied before Python could start. (failed)
