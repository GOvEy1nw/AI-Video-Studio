# #0057 apply_patch was denied reading backend/handlers/health_handler.py during the LTX 2.5 replacement

- 2026-08-12T19:01:22Z `issue`: apply_patch was denied reading backend/handlers/health_handler.py during the LTX 2.5 replacement [backend/handlers/health_handler.py]
- 2026-08-12T19:02:33Z `attempt`: Retried the one-line health label edit outside the sandbox after apply_patch ACL denial [backend/handlers/health_handler.py] (worked)
- 2026-08-12T19:02:36Z `fix`: Updated the health model label through an approved direct workspace write after sandbox-only apply_patch access denial [backend/handlers/health_handler.py]
