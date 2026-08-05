# #0587 Parallel AIVS-020 status and singleton scan lost output because clean or malformed rg exit 1 failed combined exec.

- 2026-08-05T12:47:38Z `issue`: Parallel AIVS-020 status and singleton scan lost output because clean or malformed rg exit 1 failed combined exec. [AIVS-020 verification tooling]
- 2026-08-05T12:47:44Z `attempt`: Ran status/diff and rg singleton scans in one parallel wrapper; rg exit 1 caused wrapper to suppress both outputs. [AIVS-020 verification tooling] (failed)
- 2026-08-05T12:47:58Z `attempt`: Separated status/diff and singleton rg scans; both returned complete evidence. [AIVS-020 verification tooling] (worked)
- 2026-08-05T12:48:04Z `fix`: AIVS-020 verification now keeps status/diff and singleton policy scans in separate commands, preserving evidence. [AIVS-020 verification tooling]
