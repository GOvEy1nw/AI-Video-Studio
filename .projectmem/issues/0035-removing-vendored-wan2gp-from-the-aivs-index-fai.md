# #0035 Removing vendored Wan2GP from the AiVS index failed because the sandbox could not create .git/index.lock.

- 2026-08-12T10:00:19Z `issue`: Removing vendored Wan2GP from the AiVS index failed because the sandbox could not create .git/index.lock. [.git/index.lock]
- 2026-08-12T10:00:36Z `attempt`: Retried git rm --cached with approved Git metadata access; all Wan2GP paths left the index while the physical directory remained. [.git/index.lock] (worked)
- 2026-08-12T10:00:36Z `fix`: Removed Wan2GP from AiVS tracking using git rm --cached with Git metadata permission, preserving local files. [Wan2GP/]
