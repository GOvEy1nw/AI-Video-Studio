# #0584 PowerShell parsed unquoted @{upstream} as hash literal during AIVS-019 post-push verification.

- 2026-08-05T11:28:07Z `issue`: PowerShell parsed unquoted @{upstream} as hash literal during AIVS-019 post-push verification. [AIVS-019 post-push verification / PowerShell]
- 2026-08-05T11:28:11Z `attempt`: Used unquoted Git revision @{upstream}; PowerShell rejected it before any verification command ran. [AIVS-019 post-push verification / PowerShell] (failed)
- 2026-08-05T11:28:21Z `attempt`: Quoted @{u} revision; isolated worktree is clean and local/upstream both resolve to 86df2c3. [AIVS-019 post-push verification / PowerShell] (worked)
- 2026-08-05T11:28:24Z `fix`: Quoted Git upstream revision in PowerShell; confirmed clean branch and matching local/remote commit 86df2c3. [AIVS-019 post-push verification / PowerShell]
