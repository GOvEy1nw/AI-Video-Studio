# #0058 sandboxed Move-Item partially split the transient Wan2GP .git directory into C:\tmp before access-denied errors

- 2026-07-21T17:21:24Z `issue`: sandboxed Move-Item partially split the transient Wan2GP .git directory into C:\tmp before access-denied errors [Wan2GP/]
- 2026-07-21T17:22:08Z `attempt`: inspected both paths after Move-Item errors; destination does not exist and source still contains the full transient .git directory [Wan2GP/] (worked)
- 2026-07-21T17:22:12Z `fix`: confirmed failed move caused no filesystem split; transient checkout remains intact at Wan2GP/.git [Wan2GP/]
