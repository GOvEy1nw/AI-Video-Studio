# #0160 Phase 0 inspector passes runtime tests but strict Pyright rejects recursive normalization because object container branches remain Unknown.

- 2026-07-26T10:31:05Z `issue`: Phase 0 inspector passes runtime tests but strict Pyright rejects recursive normalization because object container branches remain Unknown. [backend/tools/inspect_wangp_creation_models.py]
- 2026-07-26T10:31:08Z `attempt`: Added the inspector and focused tests; runtime checks passed, but focused strict Pyright reported ten Unknown-type errors in recursive dict/list normalization. [backend/tools/inspect_wangp_creation_models.py] (partial)
- 2026-07-26T10:31:48Z `attempt`: Added explicit object-container casts at the recursive normalization boundary; focused strict Pyright now reports zero errors. [backend/tools/inspect_wangp_creation_models.py] (worked)
- 2026-07-26T10:31:58Z `fix`: Inspector normalization is strictly typed and retains passing runtime tests. [backend/tools/inspect_wangp_creation_models.py]
