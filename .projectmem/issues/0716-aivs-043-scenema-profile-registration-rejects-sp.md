# #0716 AIVS-043 Scenema profile registration rejects speech_generation because the runtime speech policy invariant still hard-codes the old handler owner set.

- 2026-08-09T11:13:57Z `issue`: AIVS-043 Scenema profile registration rejects speech_generation because the runtime speech policy invariant still hard-codes the old handler owner set. [backend/model_profiles/policies.py]
- 2026-08-09T11:14:26Z `attempt`: Added speech_generation to the runtime HANDLER_OWNERS invariant to match the typed handler union; rerunning focused backend validation. [backend/model_profiles/policies.py] (partial)
- 2026-08-09T11:18:59Z `attempt`: Focused Speech tests and strict Pyright now accept the speech_generation handler owner. [backend/model_profiles/policies.py] (worked)
- 2026-08-09T11:19:04Z `fix`: Registered speech_generation in both the typed and runtime handler-owner invariants; focused Speech tests and Pyright pass. [backend/model_profiles/policies.py]
