# #0560 Orchestrate scout spawn rejects explicit agent role when full-history fork is used

- 2026-08-05T08:59:15Z `issue`: Orchestrate scout spawn rejects explicit agent role when full-history fork is used [Codex collaboration tooling]
- 2026-08-05T08:59:18Z `attempt`: Spawned orchestrate_scout with fork_turns=all; collaboration API rejected role override with full-history fork [Codex collaboration tooling] (failed)
- 2026-08-05T08:59:37Z `attempt`: Retried orchestrate_scout with fork_turns=none and self-contained packet; spawn succeeded [Codex collaboration tooling] (worked)
- 2026-08-05T08:59:40Z `fix`: Role-specific subagents use a self-contained fork_turns=none packet [Codex collaboration tooling]
