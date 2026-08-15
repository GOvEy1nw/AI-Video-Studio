# #0060 Python syntax check invoked the inaccessible WindowsApps python shim instead of the repository backend runtime

- 2026-08-13T13:22:43Z `issue`: Python syntax check invoked the inaccessible WindowsApps python shim instead of the repository backend runtime [investigation/tooling]
- 2026-08-13T13:22:54Z `attempt`: Retried syntax compilation through backend/.venv, but its uv-managed base Python path is currently unavailable [backend/.venv] (failed)
- 2026-08-13T13:24:59Z `attempt`: Ran syntax compilation with the bundled Codex Python runtime; all four changed backend modules compiled [investigation/tooling] (worked)
- 2026-08-13T13:25:04Z `fix`: Use the bundled Codex Python executable when the repository uv runtime is temporarily unavailable [investigation/tooling]
