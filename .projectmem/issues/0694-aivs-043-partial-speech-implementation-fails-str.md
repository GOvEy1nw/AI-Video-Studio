# #0694 AIVS-043 partial Speech implementation fails strict Pyright with unknown typed Pydantic collections and WanGP manifest settings.

- 2026-08-07T08:50:32Z `issue`: AIVS-043 partial Speech implementation fails strict Pyright with unknown typed Pydantic collections and WanGP manifest settings. [backend/api_types.py]
- 2026-08-07T08:51:50Z `attempt`: Replaced untyped Speech Pydantic list factories, made output discovery explicitly set[Path], and cast validated WanGP custom settings before merging. [backend/api_types.py] (partial)
- 2026-08-07T09:28:26Z `attempt`: Speech Pydantic factory, output typing, and bridge custom-settings corrections pass strict Pyright and focused Speech route/bridge tests. [backend/api_types.py] (worked)
- 2026-08-07T09:28:32Z `fix`: Fixed strict Pyright failures in the partial Speech API, handler, and bridge implementation; the typed contract now passes Pyright and focused integration/bridge coverage.
