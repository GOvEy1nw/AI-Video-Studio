# #0153 Advanced-creation baseline inspection cannot read submodule/Wan2GP HEAD: Git helper tools are missing and nested checkout fails safe-directory ownership.

- 2026-07-26T10:16:22Z `issue`: Advanced-creation baseline inspection cannot read submodule/Wan2GP HEAD: Git helper tools are missing and nested checkout fails safe-directory ownership. [Wan2GP]
- 2026-07-26T10:16:28Z `attempt`: Ran the plan's baseline Git commands; root branch/HEAD succeeded, but submodule status and nested Wan2GP HEAD were blocked by the managed Git environment. [Wan2GP] (failed)
- 2026-07-26T10:16:42Z `attempt`: Used a command-scoped safe.directory override to inspect the nested Wan2GP checkout without changing global Git configuration. [Wan2GP] (worked)
- 2026-07-26T10:16:51Z `fix`: Baseline WanGP HEAD and branch are readable with a command-scoped safe-directory override; no repository or global configuration change was required. [Wan2GP]
