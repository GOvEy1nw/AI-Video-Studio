# #0084 Sandbox denied cleanup of the validated C:\tmp MiniMax pack-resolution scratch directory after the read-only manifest check.

- 2026-08-16T15:16:54Z `issue`: Sandbox denied cleanup of the validated C:\tmp MiniMax pack-resolution scratch directory after the read-only manifest check. [investigation/tooling]
- 2026-08-16T15:16:59Z `attempt`: Validated target containment under C:\tmp and attempted native PowerShell recursive cleanup; sandbox denied access and left the scratch directory. [investigation/tooling] (failed)
- 2026-08-16T15:17:16Z `attempt`: Retried the same containment-validated native PowerShell cleanup with required workspace access; the scratch directory was removed. [investigation/tooling] (worked)
- 2026-08-16T15:17:20Z `fix`: Removed the manifest-validation scratch directory after sandbox-denied cleanup by retrying the exact validated C:\tmp target with required access. [investigation/tooling]
