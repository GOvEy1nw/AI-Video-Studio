# #0016 AiVS globally monkey-patched torch SDPA to SageAttention, overriding WanGP model-specific attention selection.

- 2026-07-10T15:01:00Z `issue`: AiVS globally monkey-patched torch SDPA to SageAttention, overriding WanGP model-specific attention selection. [backend/ltx2_server.py]
- 2026-07-10T15:01:00Z `attempt`: Removed global SageAttention/SDPA monkey patch; WanGP now owns attention backend choice. Pyright and focused generation tests pass. (worked)
- 2026-07-10T15:44:19Z `fix`: AiVS no longer monkey-patches torch attention; WanGP selects its own attention implementation. [backend/ltx2_server.py]
