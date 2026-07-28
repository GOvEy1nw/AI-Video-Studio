# #0155 Baseline Pyright cannot start in the managed sandbox because uv is denied access to its cache metadata under AppData.

- 2026-07-26T10:23:28Z `issue`: Baseline Pyright cannot start in the managed sandbox because uv is denied access to its cache metadata under AppData. [backend/pyrightconfig.json]
- 2026-07-26T10:23:31Z `attempt`: Ran uv run pyright from backend; uv failed before Pyright with access denied on its AppData cache metadata. [backend/pyrightconfig.json] (failed)
- 2026-07-26T10:24:01Z `attempt`: Reran Pyright with approved access to the existing uv cache; strict analysis completed with zero errors. [backend/pyrightconfig.json] (worked)
- 2026-07-26T10:24:05Z `fix`: Baseline strict Pyright passes through the approved uv cache route; no repository change was required. [backend/pyrightconfig.json]
