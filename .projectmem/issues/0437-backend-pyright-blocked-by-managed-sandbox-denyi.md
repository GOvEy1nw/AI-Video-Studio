# #0437 Backend Pyright blocked by managed sandbox denying uv cache .git access

- 2026-07-31T11:00:46Z `issue`: Backend Pyright blocked by managed sandbox denying uv cache .git access [backend validation tooling]
- 2026-07-31T11:00:51Z `attempt`: Ran uv Pyright in sandbox; uv could not read existing user cache sdists-v9/.git [backend validation tooling] (failed)
- 2026-07-31T11:01:19Z `attempt`: Ran Pyright and focused Reframe pytest with approved uv-cache access; both passed [backend validation tooling] (worked)
- 2026-07-31T11:01:22Z `fix`: Approved existing uv-cache read access restores backend validation; Pyright and focused tests pass [backend validation tooling]
