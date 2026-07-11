# #0032 prepare-python.ps1 leaves generated backend/requirements-dist.txt after filtering GPU Torch requirements for the embedded runtime.

- 2026-07-10T18:41:53Z `issue`: prepare-python.ps1 leaves generated backend/requirements-dist.txt after filtering GPU Torch requirements for the embedded runtime. [scripts/prepare-python.ps1]
- 2026-07-10T18:44:39Z `attempt`: Adjusted GPU stack installer to accept bundled uv and a packaged Wan2GP source directory; bootstrap scripts can now reuse it without global tools or Git. [scripts/install-wangp-stack.ps1] (partial)
- 2026-07-10T18:56:20Z `fix`: prepare-python cleanup now removes both generated requirements files; compact bootstrap uses bundled uv and copies matching Python headers/import libraries for native WanGP kernels. [scripts/prepare-python.ps1]
