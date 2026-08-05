# #0534 git branch creation failed because managed workspace denied .git refs write

- 2026-08-04T13:24:25Z `issue`: git branch creation failed because managed workspace denied .git refs write [.git/refs/heads]
- 2026-08-04T13:24:29Z `attempt`: Tried git switch -c codex/aivs-017-path-boundary from dev; sandbox denied .git refs lock creation [.git/refs/heads] (failed)
- 2026-08-04T13:24:43Z `attempt`: Retried branch creation with scoped approval; codex/aivs-017-path-boundary created and checked out [.git/refs/heads] (worked)
- 2026-08-04T13:24:46Z `fix`: Created and checked out dedicated AIVS-017 branch using approved .git metadata access [.git/refs/heads]
