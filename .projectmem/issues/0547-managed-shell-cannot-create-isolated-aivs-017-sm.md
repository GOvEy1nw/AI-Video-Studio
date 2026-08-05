# #0547 Managed shell cannot create isolated AIVS-017 smoke profile under declared C:\tmp writable root

- 2026-08-04T15:45:49Z `issue`: Managed shell cannot create isolated AIVS-017 smoke profile under declared C:\tmp writable root [native Electron smoke fixture setup]
- 2026-08-04T15:46:01Z `attempt`: Moved isolated smoke profile to exact workspace-owned .aivs-smoke directory; fixture directories created without touching real user data. [native Electron smoke fixture setup] (worked)
- 2026-08-04T15:46:05Z `fix`: Used workspace-owned isolated profile after C:\tmp ACL rejection; smoke can proceed safely. [native Electron smoke fixture setup]
