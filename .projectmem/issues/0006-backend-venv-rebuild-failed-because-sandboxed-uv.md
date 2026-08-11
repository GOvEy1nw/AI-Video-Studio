# #0006 backend/.venv rebuild failed because sandboxed uv could not read the user uv cache

- 2026-08-10T10:39:18Z `issue`: backend/.venv rebuild failed because sandboxed uv could not read the user uv cache [backend/.venv]
- 2026-08-10T10:39:22Z `attempt`: Ran uv sync --inexact --frozen --extra dev --extra test; failed with access denied for AppData Local uv cache sdists-v9/.git [backend/.venv] (failed)
- 2026-08-10T10:44:57Z `attempt`: Retried uv sync with cache access; command ran for about five minutes then timed out, environment may be partially populated [backend/.venv] (partial)
- 2026-08-10T10:45:53Z `attempt`: Re-ran locked uv sync after the original process finished; audited 67 packages and exited successfully [backend/.venv] (worked)
- 2026-08-10T10:50:34Z `attempt`: Ran the curated WanGP CUDA stack installer; PyTorch cu130 and all RTX 40 kernels installed successfully [backend/.venv] (worked)
- 2026-08-10T10:50:39Z `fix`: Rebuilt backend/.venv from the frozen uv lock and curated RTX 40 cu130 stack; Python, FastAPI, Torch, CUDA, and kernel checks pass [backend/.venv]
