import type {
  ModelProfile,
  ModelProfileAvailability,
  ModelProfileDirectorRenderStrategyPolicy,
  ModelProfileHandlerOwner,
  ModelProfileSfxPolicy,
  ModelProfileSpeechPolicy,
  ModelProfileVideoAudioPolicy,
  ModelProfileVideoEditOperationPolicy,
  ModelProfileWire,
} from "../types/model-profiles";

const noHandler: ModelProfileHandlerOwner | null = null;

const disabledVideoAudio: ModelProfileVideoAudioPolicy = {
  status: "hidden",
  handler: noHandler,
  requiredPackIds: [],
  soundtrack: false,
  audioConditioning: false,
  controlVideoAudio: false,
  outputAudio: false,
  maxAudioInputs: 0,
};

const disabledSpeech: ModelProfileSpeechPolicy = {
  status: "hidden",
  handler: noHandler,
  requiredPackIds: [],
  referenceVoice: false,
  tts: false,
  maxReferenceInputs: 0,
  referenceRequired: false,
};

const disabledSfx: ModelProfileSfxPolicy = {
  status: "hidden",
  handler: noHandler,
  requiredPackIds: [],
  text: false,
  controlVideoAudio: false,
  maxDurationSeconds: null,
};

export type VideoAudioMode =
  | "soundtrack"
  | "audio_conditioning"
  | "control_video_audio"
  | "output_audio";

export function normalizeModelProfile(profile: ModelProfileWire): ModelProfile {
  return {
    ...profile,
    requiredPackIds: stringList(profile.requiredPackIds),
    systemDependencies: list(profile.systemDependencies),
    videoAudio: profile.videoAudio ?? disabledVideoAudio,
    speech: profile.speech ?? disabledSpeech,
    sfx: profile.sfx ?? disabledSfx,
    videoEdits: profile.videoEdits ?? { operations: [] },
    director: {
      ...profile.director,
      renderStrategies: list(profile.director.renderStrategies),
    },
  };
}

export function selectVideoAudioModes(profile: ModelProfile): VideoAudioMode[] {
  const policy = profile.videoAudio;
  if (!isProfileAvailable(profile) || !isSelectable(policy.status, policy.handler)) return [];
  return [
    ...(policy.soundtrack ? ["soundtrack" as const] : []),
    ...(policy.audioConditioning ? ["audio_conditioning" as const] : []),
    ...(policy.controlVideoAudio ? ["control_video_audio" as const] : []),
    ...(policy.outputAudio ? ["output_audio" as const] : []),
  ];
}

export function selectVideoEditOperations(
  profile: ModelProfile,
): ModelProfileVideoEditOperationPolicy[] {
  if (!isProfileAvailable(profile)) return [];
  return profile.videoEdits.operations.filter((operation) =>
    isSelectable(operation.status, operation.handler),
  );
}

export function selectDirectorRenderStrategies(
  profile: ModelProfile,
): ModelProfileDirectorRenderStrategyPolicy[] {
  if (!isProfileAvailable(profile)) return [];
  return profile.director.renderStrategies.filter((strategy) =>
    isSelectable(strategy.status, strategy.handler),
  );
}

export function getPolicyDisabledReason(
  policy: Pick<ModelProfileVideoEditOperationPolicy, "status" | "handler" | "disabledReason">,
  availability?: ModelProfileAvailability,
): string | null {
  if (policy.disabledReason) return policy.disabledReason;
  if (availability && !isAvailabilityAvailable(availability)) {
    return "Required model files are not installed.";
  }
  return isSelectable(policy.status, policy.handler) ? null : "This capability is unavailable.";
}

function isSelectable(status: ModelProfile["status"], handler: ModelProfileHandlerOwner | null): boolean {
  return status !== "hidden" && handler !== null;
}

function isProfileAvailable(profile: ModelProfile): boolean {
  return isAvailabilityAvailable(profile.availability);
}

function isAvailabilityAvailable(availability: ModelProfileAvailability): boolean {
  return availability === "available" || availability === "experimental";
}

function list<T>(value: T[] | undefined): T[] {
  return Array.isArray(value) ? value : [];
}

function stringList(value: string[] | undefined): string[] {
  return list(value).filter((item): item is string => typeof item === "string");
}
