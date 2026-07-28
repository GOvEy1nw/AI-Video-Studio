# #0242 Managed sandbox denied git index.lock while staging Phase 2 Electron runtime commit

- 2026-07-26T20:32:23Z `issue`: Managed sandbox denied git index.lock while staging Phase 2 Electron runtime commit [.git/index.lock]
- 2026-07-26T20:32:42Z `attempt`: Reran identical scoped git add through approved route; staging succeeded [.git/index.lock] (worked)
- 2026-07-26T20:32:47Z `fix`: Approved git route restored index writes without changing commit scope [.git/index.lock]
- 2026-07-27T09:56:12Z `attempt`: Retried scoped projectmem stash through approved Git route; existing generated state preserved and worktree cleaned [.git/index.lock] (worked)
