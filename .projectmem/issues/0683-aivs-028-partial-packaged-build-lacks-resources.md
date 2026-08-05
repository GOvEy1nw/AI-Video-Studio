# #0683 AIVS-028 partial packaged build lacks resources/backend/uv.lock, so packaged native startup cannot reach Home.

- 2026-08-05T20:42:56Z `issue`: AIVS-028 partial packaged build lacks resources/backend/uv.lock, so packaged native startup cannot reach Home. [artifacts/performance/aivs-028/build2/win-unpacked/resources]
- 2026-08-05T20:44:01Z `attempt`: Launched partial packaged executable with a clean fixture and CDP; renderer never reached Home within 90 seconds because packaged resources omit backend/uv.lock. [artifacts/performance/aivs-028/build2/win-unpacked/resources] (failed)
- 2026-08-05T20:52:23Z `attempt`: After partial cleanup removed build2/win-unpacked/AiVS.exe, final runtime-ready packaged launch could not start; remaining resource files are not launchable. [artifacts/performance/aivs-028/build2/win-unpacked] (failed)
- 2026-08-05T21:00:48Z `fix`: Fresh isolated build3 completed with full backend/runtime resources; partial build2 packaging failure is no longer the active blocker. [artifacts/performance/aivs-028 isolated package]
