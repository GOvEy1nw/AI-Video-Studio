# #0042 Staging the new explicit WanGP resolver and test failed because the sandbox could not create .git/index.lock.

- 2026-08-12T10:25:45Z `issue`: Staging the new explicit WanGP resolver and test failed because the sandbox could not create .git/index.lock. [.git/index.lock]
- 2026-08-12T10:26:12Z `attempt`: Retried staging with approved Git metadata access; both intended resolver files are now tracked. [.git/index.lock] (worked)
- 2026-08-12T10:26:12Z `fix`: Added backend/wangp_root.py and its focused test to the Git index. [backend/wangp_root.py]
