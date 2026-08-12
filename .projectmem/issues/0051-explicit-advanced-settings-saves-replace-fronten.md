# #0051 Explicit Advanced Settings saves replace frontend state with defaults because POST /api/settings returns only {status: ok}

- 2026-08-12T16:56:35Z `issue`: Explicit Advanced Settings saves replace frontend state with defaults because POST /api/settings returns only {status: ok} [frontend/contexts/AppSettingsContext.tsx]
- 2026-08-12T17:01:12Z `fix`: Advanced Settings save now refreshes canonical settings with GET after a successful status-only POST [frontend/contexts/AppSettingsContext.tsx]
