# #0064 Frontend Vite build cannot read parent directory/config inside managed sandbox

- 2026-07-21T20:28:42Z `issue`: Frontend Vite build cannot read parent directory/config inside managed sandbox [vite.config.ts]
- 2026-07-21T20:29:03Z `attempt`: Reran Vite build with approved filesystem access; renderer built and Electron compilation started [vite.config.ts] (worked)
- 2026-07-21T20:29:07Z `fix`: Approved build route bypasses managed-sandbox esbuild config access restriction [vite.config.ts]
