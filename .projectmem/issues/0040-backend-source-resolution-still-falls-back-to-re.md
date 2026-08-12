# #0040 Backend source resolution still falls back to repo-local or sibling Wan2GP when explicit root is missing or invalid.

- 2026-08-12T10:17:47Z `issue`: Backend source resolution still falls back to repo-local or sibling Wan2GP when explicit root is missing or invalid. [backend/ltx2_server.py]
- 2026-08-12T10:24:17Z `attempt`: Restricted backend WanGP resolution to validated explicit environment roots and added focused missing/invalid/valid tests. [backend/ltx2_server.py] (worked)
- 2026-08-12T10:24:18Z `fix`: Backend no longer falls back to repo-local or sibling Wan2GP checkouts. [backend/ltx2_server.py]
