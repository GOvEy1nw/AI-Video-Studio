from __future__ import annotations

import argparse
from pathlib import Path


Replacement = tuple[str, str]


REPLACEMENTS: dict[str, tuple[Replacement, ...]] = {
    "shared/prompt_relay.py": (
        (
            """        visible_start = raw_max_frame * self.visible_start_ratio
        query_frames = raw_query_frames - visible_start
        max_frame = (raw_max_frame - visible_start).clamp_min(1.0)
        sigma_sq = 2.0 * self.sigma * self.sigma
        for segment in self.segments:
            start_key = min(segment.key_start, positive_len)
            end_key = min(segment.key_end, positive_len)
            if start_key >= end_key:
                continue
            start = torch.tensor(segment.start, device=device, dtype=torch.float32) * max_frame
            end = torch.tensor(segment.end, device=device, dtype=torch.float32) * max_frame
            length = (end - start).clamp_min(1.0)
            midpoint = (start + end) * 0.5
            window = (length * 0.5 - 2.0).clamp_min(0.0)
""",
            """        visible_start = torch.ceil(raw_max_frame * self.visible_start_ratio)
        query_frames = raw_query_frames - visible_start
        frame_count = (raw_max_frame - visible_start + 1.0).clamp_min(1.0)
        sigma_sq = 2.0 * self.sigma * self.sigma
        for segment in self.segments:
            start_key = min(segment.key_start, positive_len)
            end_key = min(segment.key_end, positive_len)
            if start_key >= end_key:
                continue
            start = torch.floor(segment.start * frame_count + 0.5)
            start = torch.minimum(start.clamp_min(0.0), frame_count - 1.0)
            end = torch.floor(segment.end * frame_count + 0.5)
            end = torch.minimum(torch.maximum(end, start + 1.0), frame_count)
            length = end - start
            midpoint = torch.floor((start + end - 1.0) * 0.5)
            window = (torch.floor(length * 0.5) - 2.0).clamp_min(0.0)
""",
        ),
        (
            """    tokenizer: Any,
    visible_frame_offset: int = 0,
) -> PromptRelayConditioning | None:
""",
            """    tokenizer: Any,
    visible_frame_offset: int = 0,
    epsilon: float = 1e-3,
) -> PromptRelayConditioning | None:
""",
        ),
        (
            """        video_mask_builder=_build_mask_builder(plan, video_context, video_mask, token_ranges, num_frames, frame_rate, visible_frame_offset),
        audio_mask_builder=None if audio_context is None else _build_mask_builder(plan, audio_context, audio_mask, token_ranges, num_frames, frame_rate, visible_frame_offset),
""",
            """        video_mask_builder=_build_mask_builder(plan, video_context, video_mask, token_ranges, num_frames, frame_rate, visible_frame_offset, epsilon),
        audio_mask_builder=None if audio_context is None else _build_mask_builder(plan, audio_context, audio_mask, token_ranges, num_frames, frame_rate, visible_frame_offset, epsilon),
""",
        ),
        (
            """    frame_rate: float,
    visible_frame_offset: int = 0,
) -> PromptRelayMaskBuilder | None:
""",
            """    frame_rate: float,
    visible_frame_offset: int = 0,
    epsilon: float = 1e-3,
) -> PromptRelayMaskBuilder | None:
""",
        ),
        (
            """    return PromptRelayMaskBuilder(_normalize_key_mask(mask, seq_len), runtime_segments, seq_len, visible_start_ratio=visible_start_ratio)
""",
            """    return PromptRelayMaskBuilder(_normalize_key_mask(mask, seq_len), runtime_segments, seq_len, visible_start_ratio=visible_start_ratio, epsilon=epsilon)
""",
        ),
    ),
    "models/ltx2/ltx2.py": (
        (
            """        sample_solver = sample_solver.lower()
        prompt_relay_frame_offset = 0
""",
            """        sample_solver = sample_solver.lower()
        relay_settings = custom_settings if isinstance(custom_settings, dict) else {}
        prompt_relay_epsilon = float(relay_settings.get(\"prompt_relay_epsilon\", 1e-3))
        if not 0.0 < prompt_relay_epsilon < 1.0:
            raise ValueError(\"prompt_relay_epsilon must be greater than 0 and less than 1\")
        prompt_relay_frame_offset = 0
""",
        ),
        (
            """                prompt_relay_frame_offset=prompt_relay_frame_offset,
                num_inference_steps=int(sampling_steps),
""",
            """                prompt_relay_frame_offset=prompt_relay_frame_offset,
                prompt_relay_epsilon=prompt_relay_epsilon,
                num_inference_steps=int(sampling_steps),
""",
        ),
        (
            """                prompt_relay_frame_offset=prompt_relay_frame_offset,
                images=images,
""",
            """                prompt_relay_frame_offset=prompt_relay_frame_offset,
                prompt_relay_epsilon=prompt_relay_epsilon,
                images=images,
""",
        ),
    ),
    "models/ltx2/ltx_pipelines/distilled.py": (
        (
            """        prompt_relay_frame_offset: int = 0,
        negative_prompt: str = DEFAULT_NEGATIVE_PROMPT,
""",
            """        prompt_relay_frame_offset: int = 0,
        prompt_relay_epsilon: float = 1e-3,
        negative_prompt: str = DEFAULT_NEGATIVE_PROMPT,
""",
        ),
        (
            """            relay_conditioning = encode_prompt_relay(prompt, encode_fn_with_masks, self.text_encoder_cache, self.device, num_frames, frame_rate, text_encoder.tokenizer, visible_frame_offset=prompt_relay_frame_offset)
""",
            """            relay_conditioning = encode_prompt_relay(
                prompt,
                encode_fn_with_masks,
                self.text_encoder_cache,
                self.device,
                num_frames,
                frame_rate,
                text_encoder.tokenizer,
                visible_frame_offset=prompt_relay_frame_offset,
                epsilon=prompt_relay_epsilon,
            )
""",
        ),
    ),
    "models/ltx2/ltx_pipelines/ti2vid_one_stage.py": (
        (
            """        prompt_relay_frame_offset: int = 0,
        audio_cfg_guidance_scale: float | None = None,
""",
            """        prompt_relay_frame_offset: int = 0,
        prompt_relay_epsilon: float = 1e-3,
        audio_cfg_guidance_scale: float | None = None,
""",
        ),
        (
            """        relay_conditioning = encode_prompt_relay(prompt, encode_fn_with_masks, self.text_encoder_cache, self.device, num_frames, frame_rate, text_encoder.tokenizer, visible_frame_offset=prompt_relay_frame_offset)
""",
            """        relay_conditioning = encode_prompt_relay(
            prompt,
            encode_fn_with_masks,
            self.text_encoder_cache,
            self.device,
            num_frames,
            frame_rate,
            text_encoder.tokenizer,
            visible_frame_offset=prompt_relay_frame_offset,
            epsilon=prompt_relay_epsilon,
        )
""",
        ),
    ),
    "models/ltx2/ltx_pipelines/ti2vid_two_stages.py": (
        (
            """        prompt_relay_frame_offset: int = 0,
        audio_cfg_guidance_scale: float | None = None,
""",
            """        prompt_relay_frame_offset: int = 0,
        prompt_relay_epsilon: float = 1e-3,
        audio_cfg_guidance_scale: float | None = None,
""",
        ),
        (
            """        relay_conditioning = encode_prompt_relay(prompt, encode_fn_with_masks, self.text_encoder_cache, self.device, num_frames, frame_rate, text_encoder.tokenizer, visible_frame_offset=prompt_relay_frame_offset)
""",
            """        relay_conditioning = encode_prompt_relay(
            prompt,
            encode_fn_with_masks,
            self.text_encoder_cache,
            self.device,
            num_frames,
            frame_rate,
            text_encoder.tokenizer,
            visible_frame_offset=prompt_relay_frame_offset,
            epsilon=prompt_relay_epsilon,
        )
""",
        ),
    ),
}


def main() -> None:
    parser = argparse.ArgumentParser(description="Reapply archived WanGP Prompt Relay experiment")
    parser.add_argument("wangp_root", nargs="?", default="Wan2GP", type=Path)
    parser.add_argument("--check", action="store_true", help="validate stock source without writing")
    args = parser.parse_args()

    changed: list[Path] = []
    for relative_path, replacements in REPLACEMENTS.items():
        path = args.wangp_root / relative_path
        source = path.read_text(encoding="utf-8")
        updated = source
        for before, after in replacements:
            if before not in updated:
                raise RuntimeError(f"Expected stock source block not found: {relative_path}")
            updated = updated.replace(before, after, 1)
        if not args.check:
            path.write_text(updated, encoding="utf-8")
        changed.append(path)

    action = "Ready to patch" if args.check else "Patched"
    print(f"{action}: {len(changed)} WanGP files")


if __name__ == "__main__":
    main()
