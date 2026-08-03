# #0460 Sandboxed uv validation cannot read AppData uv cache; pyright/pytest fail before execution

- 2026-08-02T09:15:55Z `issue`: Sandboxed uv validation cannot read AppData uv cache; pyright/pytest fail before execution [backend/uv validation]
- 2026-08-02T09:16:19Z `attempt`: Reran uv Pyright outside sandbox with approved existing-cache access [backend/uv validation] (worked)
- 2026-08-02T09:16:22Z `fix`: Approved uv cache access lets backend validation execute [backend/uv validation]
