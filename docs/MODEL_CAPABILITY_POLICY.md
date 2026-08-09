# Model capability policy

`backend/model_profiles/policies.py` is the product-facing source of truth for
feature capability and dependency decisions. WanGP metadata remains in the
model-profile response for compatibility and diagnostics, but renderer product
choices must use the explicit policy fields instead of WanGP setting strings or
letter codes.

Each curated profile may declare required pack IDs, video-audio, speech, SFX,
Video Tool, and Director render policies. A policy names its stable handler
owner and required pack IDs. Registry validation rejects unknown pack IDs,
unsupported handler owners, negative limits, and inconsistent system-dependency
references. LTX explicitly uses the Electron model-pack ID `ltx2_turbo`.

System dependencies are backend-owned runtime requirements such as the current
Video Tool LoRAs. They serialize with `userSelectable: false`, contain no
download URLs, and stay separate from `capabilities.lora`, which reserves the
future user-LoRA product contract. An operation can reference only a declared
system dependency, and the dependency must name that operation in `requiredBy`.

Promote a capability by adding its typed policy to the profile, then validating
its pack/handler/runtime path and exposing it through policy selectors. Keep a
capability `hidden` until its user-facing workflow is ready. Older backend
responses are normalized in `ModelProfilesProvider` to disabled/empty policies;
older saved projects continue to use their existing profile IDs and fields.
