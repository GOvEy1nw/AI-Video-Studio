# #0311 Package-manager guard flags vendored Wan2GP package-lock even though policy targets app root lockfiles

- 2026-07-27T15:58:09Z `issue`: Package-manager guard flags vendored Wan2GP package-lock even though policy targets app root lockfiles [scripts/check-dependency-boundaries.mjs; Wan2GP/shared/gradio/wangp_image_editor/frontend/package-lock.json]
- 2026-07-27T15:58:42Z `attempt`: Scoped foreign lockfile enforcement to repository root while retaining path normalization and vendored-tree coverage [scripts/check-dependency-boundaries.mjs] (partial)
- 2026-07-27T15:58:57Z `attempt`: Reran unit and package-manager guards; root foreign locks are enforced and vendored Wan2GP lockfiles are ignored [scripts/check-dependency-boundaries.mjs] (worked)
- 2026-07-27T15:59:01Z `fix`: Package-manager guard now enforces only root package-manager lockfiles and preserves vendored runtime contents [scripts/check-dependency-boundaries.mjs]
