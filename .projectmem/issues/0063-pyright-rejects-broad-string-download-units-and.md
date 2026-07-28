# #0063 Pyright rejects broad string download units and partially unknown Mapping normalization in structured progress implementation

- 2026-07-21T20:26:59Z `issue`: Pyright rejects broad string download units and partially unknown Mapping normalization in structured progress implementation [backend/handlers/generation_handler.py:127; backend/services/wangp_bridge.py:892]
- 2026-07-21T20:28:21Z `attempt`: Narrowed progress units to a Literal alias and cast external mappings; unit errors cleared but empty mapping branch remained partially unknown [backend/progress_types.py; backend/services/wangp_bridge.py:892] (partial)
- 2026-07-21T20:28:27Z `attempt`: Explicitly typed both Mapping branches; Pyright now passes with zero errors [backend/services/wangp_bridge.py:892] (worked)
- 2026-07-21T20:28:31Z `fix`: Structured progress units and external detail mappings are strictly typed; Pyright passes [backend/progress_types.py; backend/services/wangp_bridge.py:892]
