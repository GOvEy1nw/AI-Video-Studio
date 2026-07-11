# #0030 NSIS cannot mmap the 3.39 GB app archive because python-embed is accidentally included in packaged app despite verified runtime-download design.

- 2026-07-10T18:37:25Z `issue`: NSIS cannot mmap the 3.39 GB app archive because python-embed is accidentally included in packaged app despite verified runtime-download design. [electron-builder.yml]
- 2026-07-10T18:39:02Z `attempt`: Excluded user-local Wan2GP LoRA weights and codegraph cache from extraResources; bundled FFmpeg remains for backend media operations. [electron-builder.yml] (partial)
- 2026-07-10T18:40:22Z `fix`: Wan2GP user-local LoRA weights and codegraph cache are excluded from the installer; resulting NSIS build succeeds. [electron-builder.yml]
