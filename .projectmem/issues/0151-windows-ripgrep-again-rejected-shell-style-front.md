# #0151 Windows ripgrep again rejected shell-style frontend/test* and vitest.setup.* path arguments during test harness audit.

- 2026-07-25T22:34:40Z `issue`: Windows ripgrep again rejected shell-style frontend/test* and vitest.setup.* path arguments during test harness audit. [frontend/]
- 2026-07-25T22:34:43Z `attempt`: Tried shell-style wildcard path arguments while locating ResizeObserver/media test setup; ripgrep rejected them on Windows. [frontend/] (failed)
- 2026-07-25T22:34:55Z `attempt`: Used repository-wide file listing plus -g source filters instead of wildcard path arguments; the test harness audit completed. [frontend/] (worked)
- 2026-07-25T22:34:57Z `fix`: Test source discovery now uses Windows-safe rg filters; no repository change was required. [frontend/]
