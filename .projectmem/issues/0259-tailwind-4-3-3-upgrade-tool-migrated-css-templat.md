# #0259 Tailwind 4.3.3 upgrade tool migrated CSS/templates but its child pnpm used v11.10.0 and skipped dependency/PostCSS package changes

- 2026-07-27T11:15:49Z `issue`: Tailwind 4.3.3 upgrade tool migrated CSS/templates but its child pnpm used v11.10.0 and skipped dependency/PostCSS package changes [package.json / postcss.config.js]
- 2026-07-27T11:15:53Z `attempt`: Ran exact official @tailwindcss/upgrade 4.3.3 from clean checkpoint; CSS/config and 78 templates migrated, but child pnpm 11 rejected dependency add/remove operations [package.json / postcss.config.js] (partial)
- 2026-07-27T11:20:53Z `attempt`: Completed skipped tool steps with pinned pnpm 10: exact packages installed, Vite plugin configured, JavaScript config restored for Phase 5, old PostCSS path removed; build passes [package.json / vite.config.ts / frontend/index.css] (worked)
- 2026-07-27T11:20:58Z `fix`: Tailwind 4.3.3 dependencies and Vite integration now complete under pnpm 10; obsolete PostCSS config removed and production build passes [package.json / vite.config.ts / frontend/index.css]
