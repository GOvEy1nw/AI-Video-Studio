# #0012 Pyright rejected the initial speech reference-count generic default after the dual-reference backend contract change.

- 2026-08-11T13:39:53Z `issue`: Pyright rejected the initial speech reference-count generic default after the dual-reference backend contract change. [backend/api_types.py]
- 2026-08-11T13:43:49Z `attempt`: Corrected the typed default for the dual-reference speech request collection; backend Pyright now reports zero errors. [backend/api_types.py] (worked)
- 2026-08-11T13:58:51Z `fix`: Dual-reference Speech request types pass backend Pyright with zero errors. [backend/api_types.py]
