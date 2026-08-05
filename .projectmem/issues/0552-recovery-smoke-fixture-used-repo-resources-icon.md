# #0552 Recovery smoke fixture used repo resources/icon.png, which is already under dev app allowed root and cannot trigger recovery

- 2026-08-04T16:18:38Z `issue`: Recovery smoke fixture used repo resources/icon.png, which is already under dev app allowed root and cannot trigger recovery [AIVS-017 native recovery smoke fixture]
- 2026-08-04T16:19:07Z `attempt`: Seeded recovery path inside repository app root; handler correctly treated it as already allowed, so no recovery dialog appeared. [AIVS-017 native recovery smoke fixture] (failed)
- 2026-08-04T16:19:52Z `attempt`: Copied icon outside workspace/app roots and updated isolated project; exact file exists, no persisted approval, selected project root remains trusted; recovery rerun pending. [AIVS-017 native recovery smoke fixture] (partial)
- 2026-08-04T16:33:09Z `attempt`: Corrected external fixture triggered native recovery; cancel/reopen retried, exact selection persisted, asset loaded, and Show in Explorer selected the approved file. [AIVS-017 native recovery smoke fixture] (worked)
- 2026-08-04T16:33:15Z `fix`: Recovery smoke now uses media outside workspace/app roots, proving native cancel/retry, exact approval, reveal, and restart persistence. [AIVS-017 native recovery smoke fixture]
