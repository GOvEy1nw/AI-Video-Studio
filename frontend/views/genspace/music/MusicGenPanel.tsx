import { Music } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { ModelDropdownTrigger } from "../../../components/ModelDropdownTrigger";
import { SettingsDropdown } from "../../../components/SettingsDropdown";
import { GenerateButton } from "../components/GenerateButton";
import { GenPanelSection } from "../components/GenPanelSection";
import { PromptActions } from "../components/PromptActions";
import { PromptEditor } from "../components/PromptEditor";
import type { MusicGenPanelController } from "../types";
import {
  hasMusicKeyword,
  MUSIC_KEYWORDS,
  toggleMusicKeyword,
} from "./music-keywords";
import { MusicAdvancedSettings } from "./MusicAdvancedSettings";
import { MusicMediaInputs } from "./MusicMediaInputs";
import { MusicSettings } from "./MusicSettings";

export function MusicGenPanel({
  controller,
}: {
  controller: MusicGenPanelController;
}) {
  const [keywordCategory, setKeywordCategory] =
    useState<keyof typeof MUSIC_KEYWORDS>("Genre");
  const keywordRowRef = useRef<HTMLDivElement>(null);
  const [keywordOverflow, setKeywordOverflow] = useState({
    left: false,
    right: false,
  });
  const { prompt, generation, profiles, music, media } = controller;
  const selectedProfile =
    profiles.options.find(
      (profile) => profile.id === music.settings.profileId,
    ) ?? profiles.options[0];
  const updateKeywordOverflow = useCallback(() => {
    const row = keywordRowRef.current;
    if (!row) return;
    setKeywordOverflow({
      left: row.scrollLeft > 1,
      right: row.scrollLeft + row.clientWidth < row.scrollWidth - 1,
    });
  }, []);

  useEffect(() => {
    updateKeywordOverflow();
    window.addEventListener("resize", updateKeywordOverflow);
    return () => window.removeEventListener("resize", updateKeywordOverflow);
  }, [keywordCategory, updateKeywordOverflow]);

  return (
    <>
      <GenPanelSection title="Model" className="text-xs text-zinc-400">
        <SettingsDropdown
          title="MUSIC MODEL"
          value={selectedProfile?.id ?? ""}
          onChange={(profileId) =>
            music.setSettings({ ...music.settings, profileId })
          }
          options={profiles.options.map((profile) => ({
            value: profile.id,
            label: profile.displayName,
            disabled:
              profile.availability === "missing_model_files" ||
              profile.availability === "unsupported",
          }))}
          placement="bottom"
          variant="model"
          trigger={
            selectedProfile ? (
              <ModelDropdownTrigger
                profile={selectedProfile}
                modelDownload={profiles.modelDownload}
                icon={<Music className="h-5 w-5" />}
              />
            ) : (
              <span className="text-zinc-500">Loading models…</span>
            )
          }
        />
      </GenPanelSection>
      <MusicMediaInputs
        coverInput={music.settings.coverAudioInput}
        referenceTimbreInput={music.settings.referenceTimbreAudioInput}
        coverStrength={music.settings.coverStrength}
        onInputChange={(role, input) =>
          music.setSettings({
            ...music.settings,
            [role === "cover"
              ? "coverAudioInput"
              : "referenceTimbreAudioInput"]: input,
          })
        }
        onCoverStrengthChange={(coverStrength) =>
          music.setSettings({ ...music.settings, coverStrength })
        }
        resolveInputFileUrl={media.resolveInputFileUrl}
        syncInputFileToGallery={media.syncInputFileToGallery}
      />
      <GenPanelSection title="Song Prompt" borderBottom={false}>
        <div
          role="tablist"
          aria-label="Keyword type"
          className="mb-1.5 flex flex-row gap-1 rounded-md p-0.5"
        >
          {(["Genre", "Mood", "Vibe", "Instruments"] as const).map(
            (category) => (
              <button
                key={category}
                type="button"
                role="tab"
                aria-selected={keywordCategory === category}
                onClick={() => setKeywordCategory(category)}
                className={`flex items-center gap-2 rounded-full px-3 py-1 text-sm font-medium ${
                  keywordCategory === category
                    ? "bg-zinc-800 text-white"
                    : "text-zinc-500 hover:text-zinc-200"
                }`}
              >
                {category}
              </button>
            ),
          )}
        </div>
        <div className="relative">
          <div
            key={keywordCategory}
            ref={keywordRowRef}
            aria-label={`${keywordCategory} keywords`}
            onScroll={updateKeywordOverflow}
            className="flex min-w-0 gap-1 overflow-x-auto scrollbar-none [&::-webkit-scrollbar]:hidden"
          >
            {MUSIC_KEYWORDS[keywordCategory].map((keyword) => {
              const active = hasMusicKeyword(prompt.value, keyword);
              return (
                <button
                  key={keyword}
                  type="button"
                  onClick={() =>
                    prompt.setValue(toggleMusicKeyword(prompt.value, keyword))
                  }
                  className={`shrink-0 rounded-full border px-2 py-0.5 text-[12px] ${
                    active
                      ? "border-violet-500 bg-violet-500/20 text-violet-200"
                      : "border-zinc-700 text-zinc-500 hover:text-zinc-200"
                  }`}
                >
                  {keyword}
                </button>
              );
            })}
          </div>
          {keywordOverflow.left && (
            <div
              data-testid="keyword-fade-left"
              className="pointer-events-none absolute inset-y-0 left-0 w-20 bg-linear-to-r from-zinc-900 to-transparent"
            />
          )}
          {keywordOverflow.right && (
            <div
              data-testid="keyword-fade-right"
              className="pointer-events-none absolute inset-y-0 right-0 w-20 bg-linear-to-l from-zinc-900 to-transparent"
            />
          )}
        </div>
      </GenPanelSection>
      <PromptEditor
        title=""
        height="h-12"
        value={prompt.value}
        onChange={(value) => prompt.setValue(value.slice(0, 512))}
        onSubmit={generation.submit}
        canSubmit={generation.canSubmit}
        disabled={generation.isRunning}
        placeholder="Warm cinematic ambient music with soft piano and strings…"
        maxLength={512}
        actions={
          <PromptActions
            seedLocked={prompt.seedLocked}
            lockedSeed={prompt.lockedSeed}
            onSeedChange={prompt.setSeed}
            disabled={generation.isRunning}
            prompt={prompt.value}
            onEnhance={() =>
              music.setSettings({
                ...music.settings,
                enhanceDescription: !music.settings.enhanceDescription,
              })
            }
            enhanceEnabled={music.settings.enhanceDescription}
            enhanceTitle="Auto-enhance the song prompt"
          />
        }
      />
      <MusicSettings
        description={prompt.value}
        settings={music.settings}
        onChange={music.setSettings}
        profile={selectedProfile}
        onComposeLyrics={music.composeLyrics}
        disabled={generation.isRunning}
        isComposing={music.isComposingLyrics}
      />
      <MusicAdvancedSettings
        settings={music.settings}
        onChange={music.setSettings}
        profile={selectedProfile}
      />
      <div className="flex flex-wrap items-center gap-1.5 border-t border-zinc-800/60 px-4 py-3 text-xs text-zinc-400">
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
