# #0557 Mandatory codegraph_explore capability is unavailable despite a populated .codegraph index

- 2026-08-05T08:56:19Z `issue`: Mandatory codegraph_explore capability is unavailable despite a populated .codegraph index [.codegraph / agent toolchain]
- 2026-08-05T08:56:23Z `attempt`: Searched callable tools and local commands for codegraph_explore; neither MCP capability nor CLI command exists [.codegraph / agent toolchain] (failed)
- 2026-08-05T10:22:32Z `attempt`: Retried mandatory CodeGraph through documented shell command; codegraph explore returned current source, call flow, and blast radius successfully. [.codegraph / codegraph CLI] (worked)
- 2026-08-05T10:22:37Z `fix`: CodeGraph shell capability is available again; codegraph explore successfully provides indexed source, call paths, and blast radius. [.codegraph / codegraph CLI]
