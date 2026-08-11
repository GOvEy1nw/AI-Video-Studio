# #0003 Context-mode PowerShell parsing broke the quoted package.json rg pattern

- 2026-08-10T08:44:55Z `issue`: Context-mode PowerShell parsing broke the quoted package.json rg pattern [package.json]
- 2026-08-10T08:44:59Z `attempt`: Used a nested double-quoted rg regex for package.json; PowerShell interpreted pattern tokens as commands [package.json] (failed)
- 2026-08-10T08:45:24Z `attempt`: Switched to ctx_execute_file, but context-mode resolved its workspace to the plugin cache and blocked the repository package.json [package.json] (failed)
- 2026-08-10T08:45:43Z `attempt`: Parsed package.json with rtk node inside ctx_execute using repository cwd [package.json] (worked)
- 2026-08-10T08:45:49Z `fix`: Use ctx_execute with repository cwd and single-quoted Node code for structured package.json reads on PowerShell [package.json]
