# #0699 Lazy renderer split causes cold project navigation to waterfall through Project and Quick Gen chunks, leaving blank/unresponsive UI while dev transforms complete.

- 2026-08-08T12:28:13Z `issue`: Lazy renderer split causes cold project navigation to waterfall through Project and Quick Gen chunks, leaving blank/unresponsive UI while dev transforms complete. [frontend/App.tsx; frontend/views/Project.tsx; vite.config.ts]
- 2026-08-08T12:42:38Z `attempt`: Added explicit react-dropzone prebundle, Vite lazy-entry warmup, and visible workspace fallback; performance impact not yet verified. [vite.config.ts; frontend/views/Project.tsx] (partial)
- 2026-08-08T12:43:32Z `attempt`: Narrowed fix to react-dropzone prebundle plus visible fallback; deferred Vite warmup unless post-fix timing proves source transforms remain slow. [vite.config.ts; frontend/views/Project.tsx] (partial)
- 2026-08-08T12:58:14Z `attempt`: Added targeted Vite client warmup after post-prebundle probes still showed 13–36 s cold transforms for Project, Quick Gen, and Settings. [vite.config.ts] (partial)
- 2026-08-08T13:02:38Z `attempt`: Prioritized warmup to Project, Quick Gen entry/workspace, and Settings; renderer-only probe reduced Project 19.8 s→41 ms, GenSpace 1.7 s→789 ms, and Settings 13.1 s→60 ms. [vite.config.ts; frontend/views/Project.tsx] (worked)
- 2026-08-08T13:11:09Z `fix`: Prebundled lazy-only react-dropzone, warmed Project/Quick Gen/Settings dev modules, and replaced blank workspace fallback; probes and build verify the regression path is removed. [vite.config.ts; frontend/views/Project.tsx]
