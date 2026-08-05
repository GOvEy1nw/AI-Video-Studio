# #0566 Native Electron CDP smoke expression was evaluated in orchestration context because nested template literal was not escaped

- 2026-08-05T09:33:46Z `issue`: Native Electron CDP smoke expression was evaluated in orchestration context because nested template literal was not escaped [AIVS-018 native smoke tooling]
- 2026-08-05T09:33:50Z `attempt`: Connected to Electron CDP then passed nested backtick expression; orchestration runtime evaluated document outside renderer [AIVS-018 native smoke tooling] (failed)
- 2026-08-05T09:34:31Z `attempt`: Retried renderer evaluation with escaped string; Node-backed smoke runtime lacked global WebSocket for CDP connection [AIVS-018 native smoke tooling] (failed)
- 2026-08-05T09:34:56Z `attempt`: Added root node_modules and tried importing ws; pnpm did not hoist ws as a bare package [AIVS-018 native smoke tooling] (failed)
- 2026-08-05T09:40:39Z `attempt`: Launched isolated Electron session with real preload/backend and exercised Quick Gen Image/Video/Music, Director, Video Editor, Settings, and Asset Library multi-select through CDP; all representative states rendered and toggled correctly. [native Electron CDP smoke] (worked)
- 2026-08-05T09:40:42Z `fix`: Confirmed native UI validation through Electron remote debugging: all three workspaces, Quick Gen media modes, Settings, and empty-library multi-select passed with real preload and backend. [native Electron CDP smoke]
