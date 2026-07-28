import {
  AlertCircle,
  Clock,
  Image,
  Monitor,
  Music,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { ModelDropdownTrigger } from "../../../components/ModelDropdownTrigger";
import { SettingsDropdown } from "../../../components/SettingsDropdown";
import { detectMediaType } from "../../../lib/media-import";
import {
  AUDIO_MEDIA_ROLE_SET,
  GUIDE_MEDIA_ROLE_SET,
} from "../constants";
import { AspectIcon } from "../components/AspectIcon";
import { GenerateButton } from "../components/GenerateButton";
import { GenPanelSection } from "../components/GenPanelSection";
import { PromptActions } from "../components/PromptActions";
import { PromptEditor } from "../components/PromptEditor";
import type { VideoGenPanelController } from "../types";
import { formatTrimTimecode } from "./VideoTrimPanel";
import { VideoMediaInputs } from "./VideoMediaInputs";
import { VideoModeTabs } from "./VideoModeTabs";

const MAX_DURATION: Record<string, number> = {
  "540p": 20,
  "720p": 10,
  "1080p": 5,
};

function LightricksIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 28 28" fill="none">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M17.0073 8.18934C16.3266 5.6556 14.9346 2.06903 12.3065 2.06903C9.27204 2.06903 6.86627 7.24621 5.45487 11.7948C4.79654 13.9203 4.35877 15.9049 4.17755 17.1736C4.10214 17.5829 4.06274 18.0044 4.06274 18.4347C4.06274 22.2903 7.22553 25.4338 11.1133 25.4338C15.5206 25.4338 23.9376 22.7073 23.9376 18.4347C23.9376 17.1179 23.1376 15.948 21.9018 14.9595C22.4493 13.7707 22.847 12.648 23.001 11.705C23.1934 10.5053 23.0074 9.5494 22.4429 8.88217C21.7692 8.07382 20.7107 7.85572 19.6586 7.84288C18.8826 7.84288 17.9777 7.96904 17.0073 8.18934ZM11.1133 12.9816C8.07878 12.9816 5.60884 15.4258 5.60884 18.4347C5.60884 21.4435 8.07878 23.8878 11.1133 23.8878C14.1478 23.8878 16.6178 21.4435 16.6178 18.4347C16.6178 15.4258 14.1478 12.9816 11.1133 12.9816Z"
        fill="currentColor"
      />
    </svg>
  );
}

function LegacyPromptMedia({
  controller,
}: {
  controller: VideoGenPanelController;
}) {
  const { media } = controller;
  const imageRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLInputElement>(null);
  const [imageDrag, setImageDrag] = useState(false);
  const [audioDrag, setAudioDrag] = useState(false);

  const applyFile = async (file: File) => {
    const kind = detectMediaType(file.name, file.type);
    if (kind !== "image" && kind !== "audio") return;
    const url = await media.resolveInputFileUrl(
      file,
      media.syncInputFileToGallery,
    );
    if (kind === "image") media.setInputImage(url);
    else media.setInputAudio(url);
  };

  const drop = (kind: "image" | "audio") =>
    async (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      setImageDrag(false);
      setAudioDrag(false);
      const raw = event.dataTransfer.getData("asset");
      if (raw) {
        try {
          const asset = JSON.parse(raw) as { type: string; url: string };
          if (asset.type === kind) {
            if (kind === "image") media.setInputImage(asset.url);
            else media.setInputAudio(asset.url);
          }
        } catch {
          return;
        }
        return;
      }
      const file = event.dataTransfer.files?.[0];
      if (file) await applyFile(file);
    };

  return (
    <>
      <div
        className={`relative mx-2 mt-2 flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-lg border-2 border-dashed transition-colors ${
          imageDrag
            ? "border-blue-500 bg-blue-500/10"
            : "border-zinc-700 hover:border-zinc-500"
        }`}
        onDragOver={(event) => {
          event.preventDefault();
          setImageDrag(true);
        }}
        onDragLeave={() => setImageDrag(false)}
        onDrop={drop("image")}
        onClick={() => imageRef.current?.click()}
      >
        {media.inputImage ? (
          <>
            <img
              src={media.inputImage}
              alt=""
              className="h-full w-full rounded-md object-cover"
            />
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                media.setInputImage(null);
              }}
              className="absolute -right-1 -top-1 z-10 rounded-full bg-zinc-800 p-0.5 text-zinc-400 hover:text-white"
            >
              <X className="h-3 w-3" />
            </button>
          </>
        ) : (
          <Image className="h-4 w-4 text-zinc-500" />
        )}
        <input
          ref={imageRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) void applyFile(file);
            event.target.value = "";
          }}
        />
      </div>
      <div
        className={`relative mt-2 flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-lg border-2 border-dashed transition-colors ${
          audioDrag
            ? "border-emerald-500 bg-emerald-500/10"
            : media.inputAudio
              ? "border-emerald-600"
              : "border-zinc-700 hover:border-zinc-500"
        }`}
        onDragOver={(event) => {
          event.preventDefault();
          setAudioDrag(true);
        }}
        onDragLeave={() => setAudioDrag(false)}
        onDrop={drop("audio")}
        onClick={() => audioRef.current?.click()}
      >
        <Music
          className={`h-4 w-4 ${
            media.inputAudio ? "text-emerald-400" : "text-zinc-500"
          }`}
        />
        {media.inputAudio ? (
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              media.setInputAudio(null);
            }}
            className="absolute -right-1 -top-1 z-10 rounded-full bg-zinc-800 p-0.5 text-zinc-400 hover:text-white"
          >
            <X className="h-3 w-3" />
          </button>
        ) : null}
        <input
          ref={audioRef}
          type="file"
          accept=".mp3,.wav,.ogg,.aac,.flac,.m4a,audio/*"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) void applyFile(file);
            event.target.value = "";
          }}
        />
      </div>
    </>
  );
}

export function VideoGenPanel({
  controller,
}: {
  controller: VideoGenPanelController;
}) {
  const { prompt, generation, settings, media, profiles, videoTools } =
    controller;
  const videoSettings = settings.value;
  const patchVideoSettings = settings.patch;
  const selectedProfile =
    profiles.options.find(
      (profile) => profile.id === videoSettings.profileId,
    ) ?? profiles.options[0];
  const isRetake = videoTools.mode === "retake";
  const isReframe = videoTools.mode === "reframe";
  const isPanelMode = isRetake || isReframe;
  const guide = media.inputs.find(({ role }) => GUIDE_MEDIA_ROLE_SET.has(role));
  const isContinueVideo = guide?.role === "continue_video";
  const autoDuration =
    guide?.trimDuration ?? guide?.mediaDuration ?? 0;
  const durationFollowsGuide = !!guide && !isContinueVideo;
  const hasAudioInput =
    !!media.inputAudio ||
    media.inputs.some(({ role }) => AUDIO_MEDIA_ROLE_SET.has(role));
  const resolutionOptions =
    selectedProfile?.ui.allowedResolutionTiers ?? ["540p", "720p", "1080p"];
  const durationOptions = [5, 6, 8, 10, 20].filter(
    (duration) =>
      duration <= (MAX_DURATION[videoSettings.resolution] ?? 20),
  );

  useEffect(() => {
    if (!selectedProfile) return;
    const aspect = selectedProfile.ui.allowedAspectRatios.includes(
        videoSettings.aspectRatio,
      )
        ? videoSettings.aspectRatio
        : selectedProfile.ui.defaultAspectRatio;
    const resolution = selectedProfile.ui.allowedResolutionTiers.includes(
        videoSettings.resolution,
      )
        ? videoSettings.resolution
        : selectedProfile.ui.defaultResolutionTier;
    if (
      videoSettings.profileId !== selectedProfile.id ||
      videoSettings.aspectRatio !== aspect ||
      videoSettings.resolution !== resolution
    ) {
      patchVideoSettings({
        profileId: selectedProfile.id,
        aspectRatio: aspect,
        resolution,
      });
    }
  }, [patchVideoSettings, selectedProfile, videoSettings]);

  const modelOptions = profiles.options.map((profile) => ({
    value: profile.id,
    label:
      profile.displayName +
      (profile.status === "experimental" ? " (experimental)" : ""),
    disabled:
      profile.availability === "missing_model_files" ||
      profile.availability === "unsupported",
  }));

  return (
    <>
      <GenPanelSection title="Model" className="text-xs text-zinc-400">
        {selectedProfile ? (
          <SettingsDropdown
            title="VIDEO MODEL"
            value={selectedProfile.id}
            onChange={(profileId) => patchVideoSettings({ profileId })}
            options={modelOptions}
            placement="bottom"
            variant="model"
            trigger={
              <ModelDropdownTrigger
                profile={selectedProfile}
                modelDownload={profiles.modelDownload}
                icon={<LightricksIcon className="h-5 w-5" />}
              />
            }
          />
        ) : (
          <div className="flex items-center gap-1.5 rounded-md bg-zinc-800/50 px-2 py-1.5 text-zinc-500">
            <AlertCircle className="h-3.5 w-3.5" />
            <span>Loading models…</span>
          </div>
        )}
      </GenPanelSection>
      <VideoModeTabs mode={videoTools.mode} onChange={videoTools.setMode} />
      {!isPanelMode ? (
        <VideoMediaInputs
          inputs={media.inputs}
          onChange={media.setInputs}
          profile={selectedProfile}
          useAudioTrack={media.useAudioTrack}
          onUseAudioTrackChange={media.setUseAudioTrack}
          resolveInputFileUrl={media.resolveInputFileUrl}
          syncInputFileToGallery={media.syncInputFileToGallery}
        />
      ) : null}
      {isPanelMode && videoTools.panel ? (
        <div className="border-b border-zinc-800/60 bg-zinc-950/20">
          {videoTools.panel}
        </div>
      ) : null}
      <PromptEditor
        value={prompt.value}
        onChange={prompt.setValue}
        onSubmit={generation.submit}
        canSubmit={generation.canSubmit}
        disabled={generation.isRunning}
        placeholder={
          isReframe
            ? "optional text prompt to drive outpainting..."
            : isRetake
              ? "Describe what should happen in the selected section..."
              : "The woman sips from a cup of coffee..."
        }
        leading={
          !isPanelMode &&
          !selectedProfile?.inputMedia.supportsImageInputs ? (
            <LegacyPromptMedia controller={controller} />
          ) : undefined
        }
        actions={
          !isPanelMode ? (
            <PromptActions
              seedLocked={prompt.seedLocked}
              lockedSeed={prompt.lockedSeed}
              onSeedChange={prompt.setSeed}
              disabled={generation.isRunning}
              prompt={prompt.value}
              onEnhance={prompt.enhance}
              isEnhancing={prompt.isEnhancing}
            />
          ) : undefined
        }
      />
      <div className="flex flex-wrap items-center gap-1.5 border-t border-zinc-800/60 px-4 py-3 text-xs text-zinc-400">
        {isRetake ? (
          <div className="pr-2 text-[10px] text-zinc-500">
            Trim in the panel above, then retake
          </div>
        ) : isReframe ? (
          <div className="flex items-center gap-2">
            <SettingsDropdown
              title="RESOLUTION"
              value={videoSettings.resolution}
              onChange={(resolution) => patchVideoSettings({ resolution })}
              options={resolutionOptions.map((value) => ({
                value,
                label: value,
              }))}
              trigger={
                <>
                  <Monitor className="h-3.5 w-3.5" />
                  <span>{videoSettings.resolution.replace("p", "")}</span>
                </>
              }
            />
            <div className="flex items-center gap-1.5 rounded-md bg-zinc-800/40 px-2 py-1 text-zinc-400">
              <Clock className="h-3.5 w-3.5" />
              <span>{videoTools.reframeDurationSeconds.toFixed(1)}s auto</span>
            </div>
          </div>
        ) : (
          <>
            {durationFollowsGuide ? (
              <button
                type="button"
                disabled
                className="flex cursor-not-allowed items-center gap-1.5 rounded-md bg-zinc-800/40 px-2 py-1 text-zinc-500"
              >
                <Clock className="h-3.5 w-3.5" />
                <span>auto</span>
                {autoDuration > 0 ? (
                  <span className="text-zinc-600">
                    {formatTrimTimecode(autoDuration)}
                  </span>
                ) : null}
              </button>
            ) : (
              <SettingsDropdown
                title={isContinueVideo ? "EXTEND BY" : "DURATION"}
                value={String(videoSettings.duration)}
                onChange={(value) =>
                  patchVideoSettings({ duration: Number(value) })
                }
                options={durationOptions.map((value) => ({
                  value: String(value),
                  label: `${isContinueVideo ? "+" : ""}${value} Sec`,
                }))}
                trigger={
                  <>
                    <Clock className="h-3.5 w-3.5" />
                    <span>
                      {isContinueVideo ? "+" : ""}
                      {videoSettings.duration}s
                    </span>
                  </>
                }
              />
            )}
            <SettingsDropdown
              title="RESOLUTION"
              value={videoSettings.resolution}
              onChange={(resolution) =>
                patchVideoSettings({
                  resolution,
                  duration: Math.min(
                    videoSettings.duration,
                    MAX_DURATION[resolution] ?? 20,
                  ),
                })
              }
              options={resolutionOptions.map((value) => ({
                value,
                label: value,
              }))}
              trigger={
                <>
                  <Monitor className="h-3.5 w-3.5" />
                  <span>{videoSettings.resolution.replace("p", "")}</span>
                </>
              }
            />
            <SettingsDropdown
              title="ASPECT RATIO"
              value={videoSettings.aspectRatio}
              onChange={(aspectRatio) => patchVideoSettings({ aspectRatio })}
              options={
                hasAudioInput
                  ? [{ value: "16:9", label: "16:9" }]
                  : (
                      selectedProfile?.ui.allowedAspectRatios ?? [
                        "16:9",
                        "9:16",
                      ]
                    ).map((value) => ({ value, label: value }))
              }
              trigger={
                <>
                  <AspectIcon className="h-3.5 w-3.5" />
                  <span>{videoSettings.aspectRatio}</span>
                </>
              }
            />
          </>
        )}
        <GenerateButton
          onClick={generation.submit}
          disabled={!generation.canSubmit}
          loading={generation.isRunning}
          label={generation.label}
          icon={generation.icon}
        />
      </div>
    </>
  );
}
