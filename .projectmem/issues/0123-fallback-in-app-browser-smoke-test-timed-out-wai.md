# #0123 Fallback in-app browser smoke test timed out waiting for its webview to attach to the local renderer page.

- 2026-07-24T22:08:52Z `issue`: Fallback in-app browser smoke test timed out waiting for its webview to attach to the local renderer page. [http://localhost:5173/]
- 2026-07-24T22:09:39Z `attempt`: Retried with a fresh in-app browser tab after discovery; it attached and loaded the AiVS title at localhost:5173. [http://localhost:5173/] (worked)
- 2026-07-24T22:09:44Z `fix`: Local renderer fallback attachment now works; direct browser rendering remains blank because Electron preload APIs are absent. [http://localhost:5173/]
