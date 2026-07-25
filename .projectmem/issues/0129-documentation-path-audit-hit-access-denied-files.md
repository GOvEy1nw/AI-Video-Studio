# #0129 Documentation path audit hit access-denied files under the vendored docs/wan2gp-docs tree.

- 2026-07-25T15:54:23Z `issue`: Documentation path audit hit access-denied files under the vendored docs/wan2gp-docs tree. [docs/wan2gp-docs/]
- 2026-07-25T15:54:26Z `attempt`: Searched all docs for stale GenSpace paths; vendored WanGP docs rejected access, while project-owned docs returned the relevant references. [docs/wan2gp-docs/] (partial)
- 2026-07-25T15:56:47Z `attempt`: Restricted the documentation audit to project-owned GenSpace/Reframe docs; no stale moved paths remain after updates. [docs/] (worked)
- 2026-07-25T15:56:50Z `fix`: Project documentation audit now targets owned docs and avoids the inaccessible vendored WanGP documentation tree. [docs/]
