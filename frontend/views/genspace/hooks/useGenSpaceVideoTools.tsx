import { useCallback, useRef, useState, type ReactNode } from "react";
import { ReframePanel, type ReframePanelState } from "../video/ReframePanel";
import { RetakePanel } from "../video/RetakePanel";
import type {
  GenSpaceMode,
  ReframeSubmissionSnapshot,
  RetakeSubmissionSnapshot,
  VideoProcessMode,
} from "../types";
import type { ReframeAspectMode } from "../video/reframe-outpaint";

export interface GenSpaceRetakeInput {
  videoUrl: string | null;
  videoPath: string | null;
  startTime: number;
  duration: number;
  videoDuration: number;
  ready: boolean;
}

export function useGenSpaceVideoTools({
  mode,
  videoMode,
  isGenerating,
  generationStatus,
  isRetaking,
  retakeStatus,
}: {
  mode: GenSpaceMode;
  videoMode: VideoProcessMode;
  isGenerating: boolean;
  generationStatus: string;
  isRetaking: boolean;
  retakeStatus: string;
}) {
  const [retakeInput, setRetakeInput] = useState<GenSpaceRetakeInput>({
    videoUrl: null,
    videoPath: null,
    startTime: 0,
    duration: 0,
    videoDuration: 0,
    ready: false,
  });
  const [reframeInput, setReframeInput] = useState<ReframePanelState>({
    videoUrl: null,
    videoPath: null,
    startTime: 0,
    duration: 0,
    videoDuration: 0,
    videoWidth: 0,
    videoHeight: 0,
    aspectMode: "16:9",
    padding: { top: 0, bottom: 0, left: 0, right: 0 },
    ready: false,
  });
  const [reframePanelKey, setReframePanelKey] = useState(0);
  const [reframeInitial, setReframeInitial] = useState<{
    videoUrl: string | null;
    videoPath: string | null;
    duration?: number;
    aspectMode?: ReframePanelState["aspectMode"];
    padding?: ReframePanelState["padding"];
  }>({ videoUrl: null, videoPath: null });
  const reframeSubmissionRef = useRef<ReframeSubmissionSnapshot | null>(null);
  const retakeSubmissionRef = useRef<RetakeSubmissionSnapshot | null>(null);
  const isRetakeMode = mode === "video" && videoMode === "retake";
  const isReframeMode = mode === "video" && videoMode === "reframe";

  const handleRetakePanelChange = useCallback((next: GenSpaceRetakeInput) => {
    setRetakeInput((current) =>
      current.videoUrl === next.videoUrl &&
      current.videoPath === next.videoPath &&
      current.startTime === next.startTime &&
      current.duration === next.duration &&
      current.videoDuration === next.videoDuration &&
      current.ready === next.ready
        ? current
        : next,
    );
  }, []);

  const handleReframePanelChange = useCallback((next: ReframePanelState) => {
    setReframeInput((current) =>
      current.videoUrl === next.videoUrl &&
      current.videoPath === next.videoPath &&
      current.startTime === next.startTime &&
      current.duration === next.duration &&
      current.videoDuration === next.videoDuration &&
      current.videoWidth === next.videoWidth &&
      current.videoHeight === next.videoHeight &&
      current.aspectMode === next.aspectMode &&
      current.padding.top === next.padding.top &&
      current.padding.bottom === next.padding.bottom &&
      current.padding.left === next.padding.left &&
      current.padding.right === next.padding.right &&
      current.ready === next.ready
        ? current
        : next,
    );
  }, []);

  const setReframeSource = useCallback(
    (source: {
      videoUrl: string;
      videoPath: string;
      duration?: number;
      aspectMode?: ReframePanelState["aspectMode"];
      padding?: ReframePanelState["padding"];
    }) => {
      setReframeInput((current) => ({
        ...current,
        aspectMode:
          source.aspectMode && source.aspectMode !== "custom"
            ? source.aspectMode
            : "16:9",
      }));
      setReframeInitial(source);
      setReframePanelKey((current) => current + 1);
    },
    [],
  );

  const setReframeAspectMode = useCallback((aspectMode: ReframeAspectMode) => {
    setReframeInput((current) => ({ ...current, aspectMode }));
  }, []);

  const panel = (controls?: ReactNode) =>
    isRetakeMode ? (
      <div className="max-h-[52vh] overflow-y-auto">
        <RetakePanel
          initialVideoUrl={null}
          initialVideoPath={null}
          resetKey={0}
          isProcessing={isRetaking}
          processingStatus={retakeStatus}
          onChange={handleRetakePanelChange}
        />
      </div>
    ) : isReframeMode ? (
      <div className="max-h-[52vh] overflow-y-auto">
        <ReframePanel
          initialVideoUrl={reframeInitial.videoUrl}
          initialVideoPath={reframeInitial.videoPath}
          initialDuration={reframeInitial.duration}
          aspectMode={reframeInput.aspectMode}
          initialPadding={reframeInitial.padding}
          resetKey={reframePanelKey}
          isProcessing={isGenerating}
          processingStatus={generationStatus}
          controls={controls}
          onChange={handleReframePanelChange}
        />
      </div>
    ) : null;

  return {
    retakeInput,
    reframeInput,
    reframeSubmissionRef,
    retakeSubmissionRef,
    isRetakeMode,
    isReframeMode,
    panel,
    setReframeSource,
    setReframeAspectMode,
  };
}
