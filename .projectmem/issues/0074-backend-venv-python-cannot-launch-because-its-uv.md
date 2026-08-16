# #0074 backend venv Python cannot launch because its uv-managed cpython-3.11.9 base executable is unavailable

- 2026-08-15T18:20:15Z `issue`: backend venv Python cannot launch because its uv-managed cpython-3.11.9 base executable is unavailable [backend/.venv]
- 2026-08-15T18:20:52Z `attempt`: Switched image conversion to the bundled Codex Python runtime, which includes Pillow 12.3.0 [image asset conversion] (worked)
- 2026-08-15T18:20:52Z `fix`: Workspace-bundled Python provides the required Pillow image conversion despite the broken backend venv launcher [image asset conversion]
