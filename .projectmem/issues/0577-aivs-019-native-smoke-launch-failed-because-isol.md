# #0577 AIVS-019 native smoke launch failed because isolated APPDATA path did not exist, so Electron app.getPath('appData') threw before app startup.

- 2026-08-05T10:46:26Z `issue`: AIVS-019 native smoke launch failed because isolated APPDATA path did not exist, so Electron app.getPath('appData') threw before app startup. [AIVS-019 native Electron smoke environment]
- 2026-08-05T10:47:57Z `attempt`: Retried native smoke after requesting isolated APPDATA creation, but launch repeated the same app.getPath('appData') failure; automated visual agent stopped to prevent further dialogs. [AIVS-019 native Electron smoke environment] (failed)
- 2026-08-05T10:48:10Z `attempt`: Tried identifying only AIVS-019 smoke processes via Win32_Process command lines; managed shell denied CIM access. [AIVS-019 native Electron smoke cleanup] (failed)
- 2026-08-05T10:49:20Z `attempt`: Identified and stopped only AIVS-019 smoke PIDs 37772/15448/20136/41604; repeated dialog closed, but isolated appData launch setup remains unresolved. [AIVS-019 native Electron smoke cleanup] (partial)
- 2026-08-05T10:59:44Z `attempt`: Controlled retry preserved USERPROFILE and isolated only existing APPDATA/LOCALAPPDATA directories; Electron started without app.getPath('appData') failure and wrote isolated session logs. [AIVS-019 native Electron smoke environment] (worked)
- 2026-08-05T11:18:07Z `fix`: Native smoke isolation now uses existing APPDATA/LOCALAPPDATA directories while preserving Windows USERPROFILE; Electron starts without appData path failure. [AIVS-019 native Electron smoke environment]
