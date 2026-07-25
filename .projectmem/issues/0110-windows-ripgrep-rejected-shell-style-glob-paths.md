# #0110 Windows ripgrep rejected shell-style glob paths while auditing panel context imports; the earlier file and pattern checks still completed.

- 2026-07-24T21:39:14Z `issue`: Windows ripgrep rejected shell-style glob paths while auditing panel context imports; the earlier file and pattern checks still completed. [frontend/views/genspace/]
- 2026-07-24T21:39:21Z `attempt`: Retried the context-import audit with ripgrep -g filters against the directory; only the controller hook reads app settings. [frontend/views/genspace/] (worked)
- 2026-07-24T21:39:23Z `fix`: Panel context-import audit completed with Windows-safe ripgrep filters. [frontend/views/genspace/]
