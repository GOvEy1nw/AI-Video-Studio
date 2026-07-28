# #0190 PowerShell ConvertFrom-Json cannot parse the cached MSR schema because it contains an empty property name

- 2026-07-26T12:41:03Z `issue`: PowerShell ConvertFrom-Json cannot parse the cached MSR schema because it contains an empty property name [.cache/wangp-creation-diagnostics/ltx2_22B_msr_v2.json]
- 2026-07-26T12:41:15Z `attempt`: Used rg against the cached schema text to recover exact Krea/Ideogram/MSR defaults without JSON conversion [.cache/wangp-creation-diagnostics] (worked)
- 2026-07-26T12:41:25Z `fix`: Exact creation-model defaults were recovered with text search; no repository change required [.cache/wangp-creation-diagnostics]
