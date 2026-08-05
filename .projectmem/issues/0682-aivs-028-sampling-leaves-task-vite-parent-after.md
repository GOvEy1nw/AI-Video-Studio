# #0682 AIVS-028 sampling leaves task Vite parent after CDP Electron stop, preventing repeated cold-start samples.

- 2026-08-05T20:31:33Z `issue`: AIVS-028 sampling leaves task Vite parent after CDP Electron stop, preventing repeated cold-start samples. [C:\tmp\aivs028-native-sample.mjs]
- 2026-08-05T20:33:34Z `attempt`: Cold-launch sample with task tree cleanup still timed out after 90 seconds; no valid Home observation. [C:\tmp\aivs028-native-sample.mjs] (failed)
- 2026-08-05T20:34:45Z `attempt`: Confirmed native run contamination: existing PID 45284 owns ports 9222/9229 and PID 10004 owns 5173; new dev process shifts Vite to 5174 and cannot expose CDP. [C:\tmp\aivs028-native-sample.mjs] (failed)
- 2026-08-05T20:36:59Z `attempt`: Verified-clean ports and task-owned cleanup still yield Home timeout after 90 seconds, so five-run native timing cannot begin. [C:\tmp\aivs028-native-sample.mjs] (failed)
