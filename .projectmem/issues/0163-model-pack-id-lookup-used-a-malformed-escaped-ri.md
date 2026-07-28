# #0163 Model-pack ID lookup used a malformed escaped ripgrep expression in PowerShell and returned no source data.

- 2026-07-26T10:41:10Z `issue`: Model-pack ID lookup used a malformed escaped ripgrep expression in PowerShell and returned no source data. [electron/python-setup.ts]
- 2026-07-26T10:41:17Z `attempt`: Tried a combined quoted regex for pack IDs; PowerShell escaping produced an unclosed group in ripgrep. [electron/python-setup.ts] (failed)
- 2026-07-26T10:41:28Z `attempt`: Repeated the pack lookup with fixed-string searches; found the exact existing pack IDs in electron/python-setup.ts. [electron/python-setup.ts] (worked)
- 2026-07-26T10:41:38Z `fix`: Existing downloadPackId values can be assigned from the discovered exact pack catalogue; no placeholder IDs are needed. [electron/python-setup.ts]
