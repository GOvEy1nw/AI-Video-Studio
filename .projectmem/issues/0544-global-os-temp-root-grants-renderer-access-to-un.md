# #0544 Global OS temp root grants renderer access to unrelated temporary files

- 2026-08-04T14:43:18Z `issue`: Global OS temp root grants renderer access to unrelated temporary files [electron/config.ts]
- 2026-08-04T14:44:01Z `attempt`: Removed global OS temp root; allowed only app-owned backend userData/outputs staging while main-created temp files retain exact approvals. [electron/config.ts] (partial)
- 2026-08-04T14:44:46Z `attempt`: Allowed roots now use app-owned backend outputs instead of OS temp; unapproved temp frame input rejects, focused suite and build pass. [electron/config.ts] (worked)
- 2026-08-04T14:46:43Z `attempt`: Added focused regression proving only app-owned userData/outputs and project root remain allowed while global os.tmpdir() is rejected; test passed. [electron/config.test.ts] (worked)
- 2026-08-04T14:56:48Z `fix`: Global OS temp root authority removed; only app-owned userData/outputs staging remains broadly allowed, with exact approval for other temp outputs. [electron/config.ts]
