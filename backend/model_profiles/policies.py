"""Typed, product-facing capability policy for curated model profiles."""

from __future__ import annotations

from dataclasses import dataclass
from typing import TYPE_CHECKING, Iterable, Literal

if TYPE_CHECKING:
    from model_profiles.types import ModelProfile

HandlerOwner = Literal["video_generation", "director_generation", "retake", "sfx_generation", "speech_generation"]
PolicyStatus = Literal["stable", "experimental", "hidden"]
SystemDependencyKind = Literal["lora", "checkpoint"]
VideoEditSourceBehavior = Literal["control_video", "continue_video", "source_video"]
VideoEditDurationBehavior = Literal["source_duration", "extend_by"]

HANDLER_OWNERS: frozenset[str] = frozenset(
    {"video_generation", "director_generation", "retake", "sfx_generation", "speech_generation"}
)


@dataclass(frozen=True)
class SystemDependency:
    id: str
    kind: SystemDependencyKind
    required_by: tuple[str, ...]
    user_selectable: Literal[False] = False


@dataclass(frozen=True)
class VideoAudioPolicy:
    status: PolicyStatus = "hidden"
    handler: HandlerOwner | None = None
    required_pack_ids: tuple[str, ...] = ()
    soundtrack: bool = False
    audio_conditioning: bool = False
    control_video_audio: bool = False
    output_audio: bool = False
    max_audio_inputs: int = 0


@dataclass(frozen=True)
class SpeechPolicy:
    status: PolicyStatus = "hidden"
    handler: HandlerOwner | None = None
    required_pack_ids: tuple[str, ...] = ()
    reference_voice: bool = False
    tts: bool = False
    max_reference_inputs: int = 0
    reference_required: bool = False


@dataclass(frozen=True)
class SfxPolicy:
    status: PolicyStatus = "hidden"
    handler: HandlerOwner | None = None
    required_pack_ids: tuple[str, ...] = ()
    text: bool = False
    control_video_audio: bool = False
    max_duration_seconds: int | None = None


@dataclass(frozen=True)
class VideoEditOperationPolicy:
    id: str
    status: PolicyStatus
    handler: HandlerOwner | None
    required_pack_ids: tuple[str, ...] = ()
    system_dependency_ids: tuple[str, ...] = ()
    source_behavior: VideoEditSourceBehavior = "control_video"
    duration_behavior: VideoEditDurationBehavior = "source_duration"
    disabled_reason: str | None = None


@dataclass(frozen=True)
class VideoEditPolicy:
    operations: tuple[VideoEditOperationPolicy, ...] = ()


@dataclass(frozen=True)
class DirectorRenderStrategyPolicy:
    id: str
    status: PolicyStatus
    handler: HandlerOwner | None
    required_pack_ids: tuple[str, ...] = ()
    max_duration_seconds: int | None = None


def validate_model_profile_policies(
    profiles: Iterable[ModelProfile], *, pack_ids: Iterable[str]
) -> None:
    """Reject policy references that cannot be fulfilled by this runtime."""

    known_pack_ids = set(pack_ids)
    for profile in profiles:
        dependencies = {dependency.id: dependency for dependency in profile.system_dependencies}
        operation_ids = {operation.id for operation in profile.video_edits.operations}

        _validate_policy(
            profile.id,
            "profile",
            profile.required_pack_ids,
            None,
            None,
            known_pack_ids,
        )
        _validate_policy(
            profile.id,
            "video audio",
            profile.video_audio.required_pack_ids,
            profile.video_audio.status,
            profile.video_audio.handler,
            known_pack_ids,
        )
        _validate_limit(profile.id, "video audio max inputs", profile.video_audio.max_audio_inputs)
        _validate_policy(
            profile.id,
            "speech",
            profile.speech.required_pack_ids,
            profile.speech.status,
            profile.speech.handler,
            known_pack_ids,
        )
        _validate_limit(profile.id, "speech max references", profile.speech.max_reference_inputs)
        _validate_policy(
            profile.id,
            "SFX",
            profile.sfx.required_pack_ids,
            profile.sfx.status,
            profile.sfx.handler,
            known_pack_ids,
        )
        if profile.sfx.max_duration_seconds is not None:
            _validate_limit(profile.id, "SFX max duration", profile.sfx.max_duration_seconds)

        for strategy in profile.director.render_strategies:
            _validate_policy(
                profile.id,
                f"Director strategy {strategy.id}",
                strategy.required_pack_ids,
                strategy.status,
                strategy.handler,
                known_pack_ids,
            )
            if strategy.max_duration_seconds is not None:
                _validate_limit(
                    profile.id, f"Director strategy {strategy.id} max duration", strategy.max_duration_seconds
                )

        for operation in profile.video_edits.operations:
            _validate_policy(
                profile.id,
                f"video edit {operation.id}",
                operation.required_pack_ids,
                operation.status,
                operation.handler,
                known_pack_ids,
            )
            for dependency_id in operation.system_dependency_ids:
                dependency = dependencies.get(dependency_id)
                if dependency is None:
                    raise ValueError(
                        f"{profile.id}: video edit {operation.id} references unknown system dependency {dependency_id}"
                    )
                if operation.id not in dependency.required_by:
                    raise ValueError(
                        f"{profile.id}: system dependency {dependency_id} must list {operation.id} in required_by"
                    )

        for dependency in profile.system_dependencies:
            if dependency.user_selectable is not False:
                raise ValueError(
                    f"{profile.id}: system dependency {dependency.id} must not be user selectable"
                )
            unknown_operations = set(dependency.required_by) - operation_ids
            if unknown_operations:
                raise ValueError(
                    f"{profile.id}: system dependency {dependency.id} references unknown operations {sorted(unknown_operations)}"
                )


def _validate_policy(
    profile_id: str,
    policy_name: str,
    required_pack_ids: tuple[str, ...],
    status: PolicyStatus | None,
    handler: HandlerOwner | None,
    known_pack_ids: set[str],
) -> None:
    unknown_packs = set(required_pack_ids) - known_pack_ids
    if unknown_packs:
        raise ValueError(f"{profile_id}: {policy_name} references unknown packs {sorted(unknown_packs)}")
    if status is not None and status != "hidden" and handler is None:
        raise ValueError(f"{profile_id}: {policy_name} has no handler owner")
    if handler is not None and handler not in HANDLER_OWNERS:
        raise ValueError(f"{profile_id}: {policy_name} has unsupported handler owner {handler}")


def _validate_limit(profile_id: str, name: str, value: int) -> None:
    if value < 0:
        raise ValueError(f"{profile_id}: {name} cannot be negative")
