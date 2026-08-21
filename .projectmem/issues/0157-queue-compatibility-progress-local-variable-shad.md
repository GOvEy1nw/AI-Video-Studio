# #0157 Queue compatibility progress local variable shadowed legacy GenerationProgress pattern matching, causing Pyright errors.

- 2026-08-20T21:30:45Z `issue`: Queue compatibility progress local variable shadowed legacy GenerationProgress pattern matching, causing Pyright errors. [backend/handlers/generation_handler.py]
- 2026-08-20T21:30:46Z `attempt`: Renamed the queue-progress local to preserve the legacy match binding and restore strict typing. [backend/handlers/generation_handler.py] (worked)
- 2026-08-20T21:30:46Z `fix`: Queue compatibility progress typing is clean after local-name isolation; pyright passes. [backend/handlers/generation_handler.py]
