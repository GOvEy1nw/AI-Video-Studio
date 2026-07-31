# #0423 Backend validation blocked by managed sandbox denying uv cache .git access

- 2026-07-31T10:10:02Z `issue`: Backend validation blocked by managed sandbox denying uv cache .git access [backend validation tooling]
- 2026-07-31T10:10:06Z `attempt`: Ran uv Pyright; sandbox denied read access to user uv cache sdists-v9/.git [backend validation tooling] (failed)
- 2026-07-31T10:10:26Z `attempt`: Re-ran Pyright with approved read access to existing uv cache; 0 errors [backend validation tooling] (worked)
- 2026-07-31T10:10:30Z `fix`: Backend validation succeeds with approved read access to existing uv cache [backend validation tooling]
