# #0021 Cloud API credentials and dead LTX/fal generation clients remained in release settings and runtime wiring.

- 2026-07-10T15:30:09Z `issue`: Cloud API credentials and dead LTX/fal generation clients remained in release settings and runtime wiring. [backend/state/app_settings.py]
- 2026-07-10T15:30:15Z `attempt`: Removed credential fields and clients; migrated legacy keys out of persisted settings; tests and typechecks pass. [backend/state/app_settings.py] (worked)
- 2026-07-10T15:30:20Z `fix`: Cloud API credentials and LTX/fal clients removed; saved settings purge legacy secret keys. [backend/state/app_settings.py]
