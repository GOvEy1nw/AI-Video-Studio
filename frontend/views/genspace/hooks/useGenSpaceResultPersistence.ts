import {
  useEffect,
  useRef,
  type Dispatch,
  type MutableRefObject,
  type SetStateAction,
} from "react";
import type {
  GenSpaceRetakeSource,
  GenSpaceHandoffsContextType,
  ProjectAssetsContextType,
} from "../../../contexts/ProjectContext";
import {
  generatedPathToFileUrl,
  type GenerateMusicResult,
  type GenerateSfxResult,
  type GenerateSpeechResult,
} from "../../../hooks/use-generation";
import type { RetakeResult } from "../../../hooks/use-retake";
import { copyToAssetFolder } from "../../../lib/asset-copy";
import { logger } from "../../../lib/logger";
import type { Asset } from "../../../types/project";
import {
  buildGeneratedImageAsset,
  buildGeneratedMusicAsset,
  buildGeneratedSfxAsset,
  buildGeneratedSpeechAsset,
  buildGeneratedVideoAsset,
  buildReframeAsset,
  buildRetakeAsset,
} from "../logic/generation-assets";
import type {
  ImageSubmissionSnapshot,
  MusicSubmissionSnapshot,
  SfxSubmissionSnapshot,
  SpeechSubmissionSnapshot,
  ReframeSubmissionSnapshot,
  RetakeSubmissionSnapshot,
  VideoSubmissionSnapshot,
} from "../types";

type Projects = ProjectAssetsContextType;

export function useGenSpaceResultPersistence({
  videoUrl,
  videoPath,
  isGenerating,
  addAsset,
  reset,
  videoSubmissionRef,
  reframeSubmissionRef,
  retakeResult,
  isRetaking,
  retakeSubmissionRef,
  getProjectAssets,
  activeRetakeSource,
  setActiveRetakeSource,
  addTakeToAsset,
  setPendingRetakeUpdate,
  resetRetake,
  imageUrls,
  imagePaths,
  imageSubmissionRef,
  musicResult,
  musicSubmissionRef,
  sfxResult = null,
  sfxSubmissionRef,
  speechResult = null,
  speechSubmissionRef,
  onAssetAdded,
}: {
  videoUrl: string | null;
  videoPath: string | null;
  isGenerating: boolean;
  addAsset: Projects["addAsset"];
  reset: () => void;
  videoSubmissionRef: MutableRefObject<VideoSubmissionSnapshot | null>;
  reframeSubmissionRef: MutableRefObject<ReframeSubmissionSnapshot | null>;
  retakeResult: RetakeResult | null;
  isRetaking: boolean;
  retakeSubmissionRef: MutableRefObject<RetakeSubmissionSnapshot | null>;
  getProjectAssets: Projects["getProjectAssets"];
  activeRetakeSource: GenSpaceRetakeSource | null;
  setActiveRetakeSource: Dispatch<SetStateAction<GenSpaceRetakeSource | null>>;
  addTakeToAsset: Projects["addTakeToAsset"];
  setPendingRetakeUpdate: GenSpaceHandoffsContextType["setPendingRetakeUpdate"];
  resetRetake: () => void;
  imageUrls: string[];
  imagePaths: string[];
  imageSubmissionRef: MutableRefObject<ImageSubmissionSnapshot | null>;
  musicResult: GenerateMusicResult | null;
  musicSubmissionRef: MutableRefObject<MusicSubmissionSnapshot | null>;
  sfxResult?: GenerateSfxResult | null;
  sfxSubmissionRef?: MutableRefObject<SfxSubmissionSnapshot | null>;
  speechResult?: GenerateSpeechResult | null;
  speechSubmissionRef?: MutableRefObject<SpeechSubmissionSnapshot | null>;
  onAssetAdded?: (asset: Asset) => void;
}) {
  const persistedVideoKey = useRef<string | null>(null);
  const persistedImageKey = useRef<string | null>(null);
  const persistedMusicKey = useRef<string | null>(null);
  const persistedSfxKey = useRef<string | null>(null);
  const persistedSpeechKey = useRef<string | null>(null);

  useEffect(() => {
    if (!videoUrl || !videoPath || isGenerating) return;
    const reframe = reframeSubmissionRef.current;
    const video = videoSubmissionRef.current;
    const snapshot = reframe ?? video;
    if (!snapshot) return;
    const key = `${videoUrl}|${videoPath}`;
    if (persistedVideoKey.current === key) return;
    persistedVideoKey.current = key;

    void (async () => {
      try {
        const copied = await copyToAssetFolder(videoPath, snapshot.projectId);
        const finalPath = copied?.path ?? videoPath;
        const finalUrl = copied?.url ?? videoUrl;
        const createdAt = Date.now();
        const asset = addAsset(
          snapshot.projectId,
          reframe
            ? buildReframeAsset({
                snapshot: reframe,
                finalPath,
                finalUrl,
                createdAt,
              })
            : buildGeneratedVideoAsset({
                snapshot: video!,
                finalPath,
                finalUrl,
                createdAt,
            }),
        );
        onAssetAdded?.(asset);
        if (reframe) reframeSubmissionRef.current = null;
        else videoSubmissionRef.current = null;
        reset();
      } catch (error) {
        persistedVideoKey.current = null;
        logger.error(`Failed to persist generated video asset: ${error}`);
      }
    })();
  }, [
    addAsset,
    isGenerating,
    onAssetAdded,
    reframeSubmissionRef,
    reset,
    videoPath,
    videoSubmissionRef,
    videoUrl,
  ]);

  useEffect(() => {
    if (!sfxResult || isGenerating) return;
    const snapshot = sfxSubmissionRef?.current;
    if (!snapshot || persistedSfxKey.current === sfxResult.audioPath) return;
    persistedSfxKey.current = sfxResult.audioPath;
    void (async () => {
      try {
        const copied = await copyToAssetFolder(sfxResult.audioPath, snapshot.projectId);
        const finalPath = copied?.path ?? sfxResult.audioPath;
        const finalUrl = copied?.url ?? generatedPathToFileUrl(finalPath);
        const asset = addAsset(snapshot.projectId, buildGeneratedSfxAsset({ snapshot, result: sfxResult, finalPath, finalUrl, createdAt: Date.now() }));
        onAssetAdded?.(asset);
        if (sfxSubmissionRef) sfxSubmissionRef.current = null;
        reset();
      } catch (error) {
        persistedSfxKey.current = null;
        logger.error(`Failed to persist generated SFX asset: ${error}`);
      }
    })();
  }, [addAsset, isGenerating, onAssetAdded, reset, sfxResult, sfxSubmissionRef]);

  useEffect(() => {
    if (!speechResult || isGenerating) return;
    const snapshot = speechSubmissionRef?.current;
    if (!snapshot || persistedSpeechKey.current === speechResult.audioPath) return;
    persistedSpeechKey.current = speechResult.audioPath;
    void (async () => {
      try {
        const copied = await copyToAssetFolder(speechResult.audioPath, snapshot.projectId);
        const finalPath = copied?.path ?? speechResult.audioPath;
        const finalUrl = copied?.url ?? generatedPathToFileUrl(finalPath);
        const asset = addAsset(snapshot.projectId, buildGeneratedSpeechAsset({ snapshot, result: speechResult, finalPath, finalUrl, createdAt: Date.now() }));
        onAssetAdded?.(asset);
        if (speechSubmissionRef) speechSubmissionRef.current = null;
        reset();
      } catch (error) {
        persistedSpeechKey.current = null;
        logger.error(`Failed to persist generated speech asset: ${error}`);
      }
    })();
  }, [addAsset, isGenerating, onAssetAdded, reset, speechResult, speechSubmissionRef]);

  useEffect(() => {
    if (imageUrls.length === 0 || isGenerating) return;
    const snapshot = imageSubmissionRef.current;
    if (!snapshot) return;
    const key = `${imageUrls.join("|")}|${imagePaths.join("|")}`;
    if (persistedImageKey.current === key) return;
    persistedImageKey.current = key;

    void (async () => {
      try {
        for (let index = 0; index < imageUrls.length; index += 1) {
          const imageUrl = imageUrls[index];
          const sourcePath = imagePaths[index] || null;
          const copied = sourcePath
            ? await copyToAssetFolder(sourcePath, snapshot.projectId)
            : null;
          const finalPath = copied?.path ?? sourcePath ?? imageUrl;
          const finalUrl = copied?.url ?? imageUrl;
          const asset = addAsset(
            snapshot.projectId,
            buildGeneratedImageAsset({
              snapshot,
              finalPath,
              finalUrl,
              createdAt: Date.now(),
              }),
          );
          if (index === 0) onAssetAdded?.(asset);
        }
        imageSubmissionRef.current = null;
        reset();
      } catch (error) {
        persistedImageKey.current = null;
        logger.error(`Failed to persist generated image asset: ${error}`);
      }
    })();
  }, [
    addAsset,
    imagePaths,
    imageSubmissionRef,
    imageUrls,
    isGenerating,
    onAssetAdded,
    reset,
  ]);

  useEffect(() => {
    if (!musicResult || isGenerating) return;
    const snapshot = musicSubmissionRef.current;
    if (!snapshot) return;
    const key = musicResult.outputs.map(({ path }) => path).join("|");
    if (!key || persistedMusicKey.current === key) return;
    persistedMusicKey.current = key;

    void (async () => {
      try {
        const takes = [];
        for (const output of musicResult.outputs) {
          const copied = await copyToAssetFolder(
            output.path,
            snapshot.projectId,
          );
          const path = copied?.path ?? output.path;
          takes.push({
            path,
            url: copied?.url ?? generatedPathToFileUrl(path),
            createdAt: Date.now(),
            duration: output.durationSeconds,
            seed: output.seed,
            variationIndex: output.variationIndex,
          });
        }
        const asset = buildGeneratedMusicAsset({
          snapshot,
          result: musicResult,
          takes,
        });
        if (asset) {
          const addedAsset = addAsset(snapshot.projectId, asset);
          onAssetAdded?.(addedAsset);
        }
        musicSubmissionRef.current = null;
        reset();
      } catch (error) {
        persistedMusicKey.current = null;
        logger.error(`Failed to persist generated music asset: ${error}`);
      }
    })();
  }, [
    addAsset,
    isGenerating,
    musicResult,
    musicSubmissionRef,
    onAssetAdded,
    reset,
  ]);

  useEffect(() => {
    if (!retakeResult || isRetaking) return;
    const submission = retakeSubmissionRef.current;
    if (!submission) return;
    retakeSubmissionRef.current = null;
    void (async () => {
      try {
        const copied = await copyToAssetFolder(
          retakeResult.videoPath,
          submission.projectId,
        );
        const finalPath = copied?.path ?? retakeResult.videoPath;
        const finalUrl = copied?.url ?? retakeResult.videoUrl;
        const sourceAsset = activeRetakeSource?.assetId
          ? getProjectAssets(submission.projectId).find(
              ({ id }) => id === activeRetakeSource.assetId,
            )
          : undefined;
        if (sourceAsset) {
          const newTakeIndex = sourceAsset.takes?.length ?? 1;
          addTakeToAsset(submission.projectId, sourceAsset.id, {
            url: finalUrl,
            path: finalPath,
            createdAt: Date.now(),
          });
          if (activeRetakeSource?.linkedClipIds?.length) {
            setPendingRetakeUpdate({
              assetId: sourceAsset.id,
              clipIds: activeRetakeSource.linkedClipIds,
              newTakeIndex,
            });
          }
        } else {
          const asset = addAsset(
            submission.projectId,
            buildRetakeAsset({
              prompt: submission.prompt,
              duration: submission.input.duration,
              startTime: submission.input.startTime,
              finalPath,
              finalUrl,
              createdAt: Date.now(),
            }),
          );
          onAssetAdded?.(asset);
        }
        setActiveRetakeSource(null);
        resetRetake();
      } catch (error) {
        retakeSubmissionRef.current = submission;
        logger.error(`Failed to persist retake asset: ${error}`);
      }
    })();
  }, [
    activeRetakeSource,
    addAsset,
    addTakeToAsset,
    isRetaking,
    onAssetAdded,
    getProjectAssets,
    resetRetake,
    retakeResult,
    retakeSubmissionRef,
    setActiveRetakeSource,
    setPendingRetakeUpdate,
  ]);
}
