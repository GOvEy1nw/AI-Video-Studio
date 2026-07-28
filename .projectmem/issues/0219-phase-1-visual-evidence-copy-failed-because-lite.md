# #0219 Phase 1 visual-evidence copy failed because -LiteralPath treated wildcard as literal

- 2026-07-26T18:37:48Z `issue`: Phase 1 visual-evidence copy failed because -LiteralPath treated wildcard as literal [C:\tmp\AiVS-phase1-baseline-20260726]
- 2026-07-26T18:37:57Z `attempt`: Retried evidence copy with -Path wildcard; source exists but target write returned access denied on 01-home.png [C:\tmp\AiVS-phase1-baseline-20260726] (failed)
- 2026-07-26T18:38:14Z `attempt`: Single-file copy probe into C:\tmp also failed access denied; failure is sandbox destination write, not wildcard handling [C:\tmp] (failed)
- 2026-07-26T18:38:30Z `attempt`: Copied all nine screenshots with -Path wildcard outside sandbox and verified target file list [C:\tmp\AiVS-phase1-baseline-20260726] (worked)
- 2026-07-26T18:38:33Z `fix`: Durable Phase 1 visual evidence now stored under C:\tmp\AiVS-phase1-baseline-20260726 [C:\tmp\AiVS-phase1-baseline-20260726]
