# #0007 Post-rebuild git status exposed unexpected Wan2GP source changes requiring provenance check

- 2026-08-10T10:48:37Z `issue`: Post-rebuild git status exposed unexpected Wan2GP source changes requiring provenance check [Wan2GP/]
- 2026-08-10T10:49:45Z `attempt`: Tried to restore Wan2GP branch with git checkout AiVS; Git blocked it as dubious ownership [Wan2GP/] (failed)
- 2026-08-10T10:49:59Z `attempt`: Restored the prior clean Wan2GP AiVS branch using a command-scoped safe.directory setting [Wan2GP/] (worked)
- 2026-08-10T10:50:46Z `fix`: Restored Wan2GP to its prior clean AiVS branch after the stack installer temporarily detached it to FETCH_HEAD [Wan2GP/]
