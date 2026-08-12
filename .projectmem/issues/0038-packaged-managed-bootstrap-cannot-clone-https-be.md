# #0038 Packaged managed bootstrap cannot clone HTTPS because invoking bundled git.exe directly does not expose its remote-https helper.

- 2026-08-12T10:05:03Z `issue`: Packaged managed bootstrap cannot clone HTTPS because invoking bundled git.exe directly does not expose its remote-https helper. [scripts/ensure-wan2gp.ps1]
- 2026-08-12T10:07:20Z `attempt`: Added PATH and GIT_EXEC_PATH setup, but the packaged MiniGit smoke still cannot resolve remote-https; fix is incomplete. [scripts/ensure-wan2gp.ps1] (failed)
- 2026-08-12T10:07:42Z `attempt`: Identified that relative GitExe made GIT_EXEC_PATH relative to the candidate checkout; canonicalized GitExe before deriving MiniGit paths. [scripts/ensure-wan2gp.ps1] (partial)
- 2026-08-12T10:08:25Z `attempt`: Canonical paths alone still failed because MiniGit's advertised libexec lacks helpers; changed GIT_EXEC_PATH to mingw64/bin where git-remote-https.exe actually ships. [scripts/ensure-wan2gp.ps1] (partial)
- 2026-08-12T10:09:01Z `attempt`: Pointing GIT_EXEC_PATH at mingw64/bin resolved the missing helper; clone now reaches HTTPS but bundled Git schannel fails with SEC_E_NO_CREDENTIALS. [scripts/ensure-wan2gp.ps1] (partial)
- 2026-08-12T10:09:28Z `attempt`: Verified bundled OpenSSL plus its CA bundle can resolve the AiVS branch; configured managed clone to use those self-contained TLS settings. [scripts/ensure-wan2gp.ps1] (partial)
- 2026-08-12T10:09:48Z `attempt`: Focused source test failed because its literal clone assertion did not account for required Git -c TLS options. [backend/tests/test_wangp_source.py] (failed)
- 2026-08-12T10:10:35Z `attempt`: Bundled MiniGit HTTPS clone now completes, but immediate candidate-directory promotion fails on Windows because Git still holds a file handle. [scripts/ensure-wan2gp.ps1] (partial)
- 2026-08-12T10:11:05Z `attempt`: Added a bounded two-second retry around candidate, backup, and rollback directory moves to tolerate transient Windows Git handle release. [scripts/ensure-wan2gp.ps1] (partial)
- 2026-08-12T10:11:50Z `attempt`: Packaged MiniGit managed bootstrap cloned AiVS head, validated required source files, and promoted the candidate successfully with the bounded move retry. [scripts/ensure-wan2gp.ps1] (worked)
- 2026-08-12T10:11:50Z `fix`: Bundled MiniGit bootstrap now uses absolute helper paths, bundled OpenSSL CA settings, and Windows-safe promotion retries; live packaged clone passed. [scripts/ensure-wan2gp.ps1]
