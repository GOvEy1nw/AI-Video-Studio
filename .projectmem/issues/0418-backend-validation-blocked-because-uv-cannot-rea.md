# #0418 Backend validation blocked because uv cannot read its user cache .git directory under managed filesystem permissions

- 2026-07-30T16:51:44Z `issue`: Backend validation blocked because uv cannot read its user cache .git directory under managed filesystem permissions [backend validation tooling]
- 2026-07-30T16:51:48Z `attempt`: Ran Pyright and focused WanGP bridge pytest through uv; both failed before execution on access denied for uv cache sdists-v9/.git [backend validation tooling] (failed)
- 2026-07-30T16:52:10Z `attempt`: Tried backend .venv executables directly; Windows launchers still reference uv-managed Python outside readable sandbox and could not create process [backend validation tooling] (failed)
- 2026-07-30T16:52:32Z `attempt`: Reran uv-managed Pyright with approved cache access; completed with zero errors [backend validation tooling] (worked)
- 2026-07-30T16:52:52Z `attempt`: Reran focused WanGP bridge tests with approved uv cache access; all 27 tests passed [backend validation tooling] (worked)
- 2026-07-30T16:52:56Z `fix`: Backend validation succeeds when uv commands receive approved read access to the existing user cache [backend validation tooling]
