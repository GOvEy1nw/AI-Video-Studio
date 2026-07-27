# #0237 Computer-use cannot target Electron-owned Windows Open dialog; list_windows omits modal and input rejects child HWND as non-target

- 2026-07-26T20:07:04Z `issue`: Computer-use cannot target Electron-owned Windows Open dialog; list_windows omits modal and input rejects child HWND as non-target [Phase 2 Electron 43 native dialog validation]
- 2026-07-26T20:07:10Z `attempt`: Tried accessibility-index clicks on dialog controls; indexes appear in combined tree but are unavailable to input cache [Phase 2 Electron 43 native dialog validation] (failed)
- 2026-07-26T20:07:13Z `attempt`: Tried screenshot-backed coordinate clicks after activating and re-observing; input rejects dialog child as non-target electron window [Phase 2 Electron 43 native dialog validation] (failed)
- 2026-07-26T20:07:18Z `attempt`: Tried list_windows/list_apps and keyboard focus routes; owned Open dialog is not returned as a targetable Window [Phase 2 Electron 43 native dialog validation] (failed)
- 2026-07-27T09:12:20Z `attempt`: Retried installed Transfer Timbre picker while RDP session was active; dialog opened but remained absent from list_windows and untargetable by Computer Use. [Phase 2 Electron 43 native dialog validation] (failed)
- 2026-07-27T09:13:55Z `attempt`: With RDP active, Computer Use captured the owned Open dialog as a secondary screenshot but screenshot-backed click still rejected the modal child target. [Phase 2 Electron 43 native dialog validation] (failed)
- 2026-07-27T09:14:32Z `attempt`: After modal accessibility tree became visible under RDP, direct click on dialog list item still failed because cached input only accepts the parent Electron window. [Phase 2 Electron 43 native dialog validation] (failed)
