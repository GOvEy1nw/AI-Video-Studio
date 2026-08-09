---
id: WGP-2
title: Implement animated Tiny VAE live previews for WanGP
status: Human Review
assignee:
  - '@Codex'
created_date: '2026-08-06 16:35'
updated_date: '2026-08-08 13:54'
labels: []
dependencies: []
references:
  - 'https://github.com/madebyollin/taehv'
  - >-
    https://github.com/madebyollin/taehv/blob/main/safetensors/taeltx2_3.safetensors
  - 'https://github.com/madebyollin/taehv/blob/main/LICENSE'
  - >-
    https://github.com/kijai/ComfyUI-KJNodes/blob/main/nodes/preview_override_node.py
documentation:
  - WanGP_TAE_Live_Preview_Implementation_Plan.md
modified_files:
  - defaults/ltx2_22B.json
  - defaults/ltx2_22B_distilled.json
  - defaults/ltx2_22B_1_1.json
  - defaults/ltx2_22B_distilled_1_1.json
  - docs/API.md
  - docs/preview/latent-contracts.md
  - docs/preview/README.md
  - LICENSES/taehv-MIT.txt
  - THIRD_PARTY_NOTICES.md
  - WanGP_TAE_Live_Preview_Implementation_Plan.md
  - plugins/configuration/plugin.py
  - shared/api.py
  - shared/api_cli.py
  - shared/api_webui.py
  - shared/mcp_server.py
  - shared/preview/__init__.py
  - shared/preview/types.py
  - shared/preview/registry.py
  - shared/preview/scheduler.py
  - shared/preview/encoding.py
  - shared/preview/worker.py
  - shared/preview/loader.py
  - shared/preview/coordinator.py
  - shared/preview/rendering.py
  - shared/preview/vendor/__init__.py
  - shared/preview/vendor/taehv.py
  - shared/preview/adapters/__init__.py
  - shared/preview/adapters/ltx2.py
  - tests/test_preview_subsystem.py
  - scripts/preview_benchmark.py
  - wgp.py
priority: high
type: feature
ordinal: 2000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Implement the complete animated Tiny VAE live-preview feature described in WanGP_TAE_Live_Preview_Implementation_Plan.md. Preserve existing Fast RGB and Off preview behaviour while adding validated Tiny VAE support for the initial LTX-2.3/LTX-2 22B profiles, bounded animated WebP previews, WebUI rendering, and backward-compatible Python API media events. Keep final generation output, seeds, sampling behaviour, and existing preview consumers unchanged.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Global Configuration > Previews exposes Off, RGB, and TAE (if available); TAE automatically falls back to RGB when the current model, output type, or decoder cannot use it.
- [x] #2 The taeltx2_3.safetensors decoder is loaded lazily, cached once per lifecycle, released safely, and its immutable source revision, filename, size, SHA-256, MIT attribution, and decoder mapping are documented.
- [x] #3 An eligible LTX-2.3/LTX-2 22B generation produces multi-frame preview media at multiple denoising steps, with the first useful preview by the second eligible callback and temporal samples distributed across the decoded clip.
- [x] #4 Preview capture, decoding, encoding, and delivery use bounded latest-wins/coalesced work queues, are generation-scoped, stale-result safe, and cancellation-safe; preview failure never fails generation.
- [ ] #5 The WebUI global TAE settings expose Preview FPS choices 16/8/4/2, multi-frame MP4/WebP previews render and play correctly, and completed/uploaded-video preview behavior is unchanged.
- [x] #6 Python API, CLI, WebUI, and MCP bridges expose structured MP4/WebP preview media while preserving existing PreviewUpdate.image consumers and avoiding unbounded event backlogs.
- [x] #7 Final output bytes/content, random-number behaviour, sampler behaviour, and RGB/Off compatibility remain unchanged.
- [x] #8 Focused tests and runtime smoke checks cover option validation, FPS-derived sampling, registry/capability filtering, missing weights, scheduling, MP4/WebP encoding, stale/cancelled previews, API compatibility, and final-output equivalence.
- [x] #9 User/developer documentation describes global configuration, Preview FPS sampling, MP4/WebP media events, weight provenance/license, limitations, and non-goals.
<!-- AC:END -->

## Definition of Done
<!-- DOD:BEGIN -->
- [ ] #1 Acceptance criteria are satisfied
- [x] #2 Relevant automated tests pass
- [x] #3 Lint, type-check, and build checks pass where applicable
- [x] #4 Documentation is updated where required
- [x] #5 Implementation summary and verification evidence are recorded
- [x] #6 No unrelated changes are included
<!-- DOD:END -->

## Implementation Plan

<!-- SECTION:PLAN:BEGIN -->
1. Replace the fixed TAE frame budget/playback controls with a global TAE Preview FPS choice (16/8/4/2) and a validated preview_fps option.
2. Derive each preview's uniformly distributed sample count from decoded clip duration and source FPS (for example, 241 frames at 24 FPS → 160 samples at 16 preview FPS), capped only by available frames and a 1024-frame safety ceiling.
3. Encode multi-frame previews independently with lazy PyAV fragmented H.264/NVENC, falling back to animated WebP without the old 4 MiB/frame-reduction policy; retain the existing bounded latest-wins worker.
4. Render MP4 previews as autoplaying muted looping video while preserving first-frame compatibility and structured API/CLI/MCP media.
5. Update configuration/help/API docs and focused tests, then run a real NVENC synthetic-preview smoke plus the existing preview suite and compile/diff checks.

Repair LTX preview callbacks: pass each loop's post-processed denoised prediction through the existing conditioning-clear/unpatchify bridge before advancing the sampler state; add focused regression coverage for Euler, gradient-Euler, and Res2S; verify with the isolated CUDA preview suite and a fixed-seed runtime smoke.

Preserve the normalized playback position of a Tiny-VAE video preview across Gradio HTML replacement using the existing renderer only; add one renderer contract assertion and visually inspect the local page where feasible.
<!-- SECTION:PLAN:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
Execution started after reviewing the implementation plan and repository memory. Current work will preserve unrelated user changes and track the live-preview feature as one focused implementation task.

Current-system audit: build_callback currently converts preview payloads to CPU and sends only preview; generate_preview is latent-RGB only; refresh_preview serializes every preview as JPEG; PreviewUpdate has no media field; SessionStream is unbounded.

Architecture choice: keep TAEHV/WebP/registry/weight logic in shared/preview and keep wgp.py as orchestration. GPU decode remains synchronous in the sampler callback; only CPU encoding is backgrounded.

External TAEHV source confirms NTCHW output, [0,1] image range, no latent scale/shift, and LTX-2.3 mapping to taeltx2_3; exact revision/hash will be recorded from the fetched asset metadata before enabling the capability.

Implemented the shared preview subsystem, pinned TAEHV decoder registry/loader, LTX latent adapter, adaptive scheduling, bounded worker, animated WebP encoding, generation lifecycle integration, API/CLI/WebUI media delivery, capability-driven controls, provenance/license docs, and focused tests.

Final verification: bundled Python ran 9 focused tests successfully; py_compile passed for wgp.py, API bridges, preview subsystem, and tests; git diff --check passed with only existing LF-to-CRLF normalization warnings.

Human-review limitation: the bundled runtime lacks torch, safetensors, and GPU execution, so real strict decoder loading, GPU decode, end-to-end WebUI/API generation, performance, and final-output equivalence checks were not runnable here.

Resumed from Human Review after auditing the full 1,441-line implementation plan. The initial pass covered the core path but left advanced controls, model capability metadata, static encoder fallback, and several fixture/integration checks weaker than the plan requires.

Completion audit fixed PreviewCoordinator decoder-cache lifecycle: close now invalidates the worker, unloads cached decoders, and clears the decoder reference; added a passing regression test.

Final verification after the lifecycle fix: bundled Python ran 15 focused tests with 2 skips (torch runtime and opt-in safetensors fixture unavailable), py_compile passed for WGP/API/preview/tests/benchmark, four modified default JSON files parsed successfully, git diff --check passed with only LF-to-CRLF normalization warnings, and scripts/preview_benchmark.py produced bounded animated-WebP output with encoded_frames=16 and pending_capacity=1.

Runtime boundary for human review: nvidia-smi sees an RTX 4070 Ti SUPER, but the available validation Python has neither torch nor safetensors; strict decoder fixture, GPU/end-to-end WebUI/API generation, target performance, and final-output equivalence remain deployment checks.

Final audit additionally covered the GPU OOM recovery path (sequential retry, CPU decoder fallback, persistent CPU selection) and MCP JSON media serialization (structured base64 PreviewMedia). Initial UI install-state visibility is now capability-driven at construction.

Final validation: 16 focused tests passed with 2 dependency-gated skips; full py_compile passed for WGP/API/MCP/preview/tests/benchmark; all four modified default JSON files parsed; git diff --check passed with only LF-to-CRLF normalization warnings; benchmark emitted animated_image with 16 frames and pending_capacity=1.

Full-plan audit additionally fixed immediate cancellation at both Gradio abort and SessionJob.cancel boundaries, and corrected initial GPU decoder-load OOM recovery so CPU fallback also applies before a decoder object exists.

Latest validation: full unittest discovery ran 35 tests with 2 expected skips (torch runtime and opt-in safetensors fixture); targeted compile, JSON parsing, diff check, and dependency-light animated-WebP benchmark also pass. Real decoder/GPU/end-to-end, target performance, and final-output-equivalence evidence remains unavailable because no project Python environment includes torch or safetensors.

Final current-state verification after the full-plan audit: unittest discovery ran 35 tests with 2 expected skips; full preview/API/WGP/MCP py_compile passed; dependency-light benchmark emitted animated_image with 16 frames and pending_capacity=1; git diff --check passed with only LF-to-CRLF normalization warnings.

The active goal remains intentionally uncompleted pending real-runtime evidence: no project or bundled Python environment currently provides torch or safetensors, so strict real-weight loading, actual LTX generation/WebUI/API animated playback, target RTX 4070 Ti Super performance gates, and final-output equivalence cannot be proven in this environment.

Added a dependency-light fake-runtime regression test for initial CUDA OOM recovery; it passes and verifies GPU load failure triggers CPU decoder reload, sequential decode, and persistent CPU mode.

After that test, full unittest discovery passes 36 tests with 2 expected skips; complete preview/API/WGP/MCP py_compile passes.

Added direct coverage for the four modified LTX default JSON profiles: each resolves to taeltx2_3 only through capability-bound registry metadata.

Latest full suite after that coverage passes 37 tests with 2 expected skips; complete preview/API/WGP/MCP py_compile still passes.

Real-runtime validation now completed in the user-approved isolated environment C:\tmp\wangp-preview-venv using torch 2.11.0+cu128 and safetensors 0.8.0 on an RTX 4070 Ti SUPER: the pinned 23,531,296-byte TAEHV weight loaded strictly with SHA-256 f0773b4e3e57318e6aa4dd4a35e1d16213a5f160fbc0376163f06888bbcbe246; a fixed CUDA latent decoded to 17 frames; the real coordinator published an 8-frame animated WebP from a temporal latent; and warm decoder mean was 3.95 ms with 35.32 MiB peak allocation.

Post-fix validation: CUDA runtime suite passed 38 tests with 0 skips; bundled runtime suite passed 38 tests with 2 expected dependency skips; complete py_compile passed in both runtimes; all four default JSON profiles parsed; git diff --check passed; dependency-light benchmark remained bounded with encoded_frames=16 and pending_capacity=1.

Remaining deployment gates are explicit: the checkout contains no full LTX model weights, so full generation callback timing, end-to-end WebUI/API generation, final-output/randomness/sampler equivalence, and target overhead <=10% cannot be proven locally.

Paused at user request after the strict option-boundary audit. Fixed PreviewOptions string boolean parsing in shared/preview/types.py and validated the 20-test preview suite in both runtimes (bundled: 20 pass, 2 expected skips; CUDA: 20 pass, 0 skips). Full LTX-2.3 22B generation, end-to-end WebUI/API behavior, final-output equivalence, and <=10% overhead remain pending approval to download the approximately 13.5 GB eligible NVFP4 checkpoint. Task remains In Progress.

User-provided C:\\WanGP_Models assets enabled real-runtime validation in C:\\tmp\\wangp-preview-venv (torch 2.11.0+cu128, safetensors 0.8.0, RTX 4070 Ti SUPER). Pinned decoder installed at C:\\WanGP_Models\\ckpts\\preview_decoders\\taehv\\taeltx2_3.safetensors with expected size/hash.

Real LTX-2.3 Distilled 1.1 CLI generation at 512x256: 17 frames, 8-step first pass plus 3-step second pass, TAE callbacks observed at multiple denoising steps, output saved successfully after converting PreviewOptions to JSON-safe metadata. Default adaptive TAE completed in 63.0s; identical Preview Off baseline completed in 67.4s. A representative 121-frame adaptive TAE run completed in 63.8s and saved a valid 121-frame MP4 with no OOM/fallback.

Final-output equivalence: fixed-seed Off and adaptive TAE 17-frame outputs decoded to identical (17,256,512,3) RGB arrays; max and mean absolute pixel difference were both 0. Focused bridge smoke and regression test confirmed preview_media becomes a structured PreviewUpdate with the legacy first frame and animated HTML. Final tests: 21 preview tests passed with 1 expected dependency skip; targeted compileall and git diff --check passed. The diagnostic WANGP_PREVIEW_TRACE flag was excluded from performance timings because it performs extra GPU reductions per callback.

Remaining human-review item: no browser-level Gradio interaction was exercised; WebUI control construction/renderer and API bridge were covered by code-path smoke checks, not a live browser session. The available LTX asset set was the Distilled 1.1 profile; Dev/I2V/sliding-window matrix cases remain untested.

Review remediation completed: normalized adaptive scheduling to one-based callbacks with first capture by callback two and final capture exactly once; preserve-duration WebP timing now uses existing clip duration after subsampling; SessionStream coalescing preserves FIFO order for surviving events; removed deprecated Pillow mode argument, duplicate CLI command handling, and dead registry fields/lookup. Verification: isolated CUDA environment ran 22 focused preview tests with 1 expected skip; targeted py_compile and git diff --check passed without warnings. WGP-2 remains In Progress because browser-level WebUI acceptance criterion 5 is still not verified.

User requested that preview settings be global. The frame limit will be labelled as sampled TAE frames per preview and explained as evenly spanning the whole clip while preserving approximate playback duration.

Moved all preview preferences from the generation form to Configuration → Previews. Persisted one validated preview_options object, retained explicit API/task override precedence, and kept the model-specific decoder install action beside the live preview because it is contextual rather than a preference.

Global TAE requests now normalize to RGB for unsupported/missing decoders and image/audio outputs. All advanced labels are TAE-prefixed; sampled-frame help explains full-clip temporal sampling and distinguishes approximate-duration playback from Fast loop.

Verification for this scope: isolated CUDA environment passed 22 focused preview tests with 1 expected skip; py_compile passed for wgp.py, configuration plugin, registry, and coordinator; scoped git diff --check passed. No live browser interaction or Configuration Apply callback test was available, so revised WebUI acceptance criteria 1 and 5 remain unchecked.

User approved replacing the fixed sampled-frame budget with duration-derived Preview FPS and adopting the referenced KJNodes transport concept. WanGP will implement this independently using standard PyAV/NVENC rather than copying external node code.

Preview FPS revision completed: exact choices 16/8/4/2 derive uniform samples from actual decoded clip timing with a 1024-sample ceiling; 241 frames at 24 FPS produces 160 samples at 16 Preview FPS.

Multi-frame transport now prefers in-memory fragmented H.264/NVENC MP4 and retains every selected frame in animated WebP fallback. The existing one-active/one-pending latest-wins worker, cancellation/stale suppression, and legacy first-frame API compatibility are unchanged.

Final evidence: focused preview suite 23 passed with 1 expected dependency skip; targeted py_compile and scoped diff checks passed; real 160-frame 512x288 NVENC smoke encoded video/mp4, decoded all 160 frames at stream rate 16, reported 10,000 ms, and produced 308,318 bytes. Independent reviewer verdict: ship.

Live WanGP launch was attempted in the validated environment. The runtime remained CPU-bound building the large app stack for about seven minutes without errors or opening port 7860; user asked to stop and will perform browser testing later. Both launcher/runtime processes and temporary logs were removed. WebUI acceptance criteria 1 and 5 remain unchecked pending that manual test.

Fixed #0035: every LTX sampler preview callback now uses a transient post-processed denoised latent before sampler advancement (Euler, gradient Euler, and Res2S). The actual sampler state, callback metadata, and final output path are unchanged. Evidence: C:\tmp\wangp-preview-venv\Scripts\python.exe -m unittest discover -s tests -p test_preview_subsystem.py => 24 passed, 1 expected skip; targeted py_compile and git diff --check passed. Independent review verdict: ship. Remaining verification: user visual retest with the supplied LTX workload.

Fixed #0036 in the renderer: MP4 previews retain their normalized playback phase across Gradio HTML replacement using browser state keyed by the HTML-escaped PreviewMedia generation ID. Invalid durations are ignored and restoration clamps below the end; image/modal behavior is untouched. Evidence: focused preview suite 24 passed with 1 expected skip; independent review verdict ship. Remaining verification: user browser retest after restarting WanGP.
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Implemented the complete Tiny VAE preview feature and the final Preview FPS transport revision. Preview preferences are global under Configuration → Previews with Off/RGB/TAE (if available), automatic TAE→RGB fallback, and TAE-only update/device/edge/FPS/WebP-fallback controls. TAE Preview FPS (16/8/4/2) derives uniformly distributed samples from actual decoded clip timing; multi-frame previews use bounded background fragmented H.264/NVENC MP4 with full-frame animated WebP and static-first-frame fallbacks. Structured WebUI/API/CLI/MCP media and legacy first-frame consumers remain compatible. Real LTX generation previously proved final-output identity and decoder performance; current focused suite passes 23 tests with 1 expected skip, compile/diff checks pass, and a 160-frame 512x288 NVENC smoke round-tripped all frames at 16 FPS/10 seconds in 308,318 bytes. Independent review found no required corrections. Remaining human-review gate is live browser validation of Configuration Apply and MP4/WebP playback.
<!-- SECTION:FINAL_SUMMARY:END -->
