# #0286 Explicit Electron TypeScript project check exposes invalid logger.warning call; logger API only has warn

- 2026-07-27T13:27:51Z `issue`: Explicit Electron TypeScript project check exposes invalid logger.warning call; logger API only has warn [electron/python-backend.ts:149]
- 2026-07-27T13:28:45Z `attempt`: Changed invalid logger.warning call to existing logger.warn API; both explicit TS projects and root typecheck pass [electron/python-backend.ts:149] (worked)
- 2026-07-27T13:28:52Z `fix`: Corrected backend-path warning call to logger.warn; explicit Electron project check passes [electron/python-backend.ts:149]
