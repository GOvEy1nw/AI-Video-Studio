# WanGP Prompt Relay experiment

Archived against WanGP commit `c3232fca9916f06c2386fbf1419b65894b9261f3`.

## Hypothesis

WanGP mapped Prompt Relay segments onto continuous latent-frame positions. Short
segments could therefore have half-frame midpoints and no query frame receiving
zero attention cost. This experiment:

- quantized segment boundaries and midpoints onto integer query frames;
- guaranteed each non-empty segment at least one full-strength query frame;
- exposed `prompt_relay_epsilon` through LTX2 `custom_settings` and all three
  LTX2 pipelines.

Manual tests across different epsilon values showed no visible generation
difference, so the WanGP runtime changes were reverted pending deeper comparison
against the ComfyUI Director implementation.

## Reapply

From the AI Video Studio repository root:

```powershell
uv run --project backend python references/wangp-prompt-relay-experiment/apply_experiment.py --check Wan2GP
uv run --project backend python references/wangp-prompt-relay-experiment/apply_experiment.py Wan2GP
```

`--check` verifies that all expected stock WanGP source blocks still match before
anything is written. Re-run WanGP Python compilation and backend Prompt Relay
tests after applying.

AI Video Studio's Director request path currently retains the experimental
`promptRelayEpsilon` setting and sends it as
`custom_settings.prompt_relay_epsilon`. Stock WanGP ignores that key.

