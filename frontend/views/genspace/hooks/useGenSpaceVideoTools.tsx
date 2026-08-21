import { useCallback, useState } from "react";
import type { ReframePanelState } from "../video/ReframePanel";
import { RetakePanel } from "../video/RetakePanel";
import type {
  GenSpaceMode,
  GenSpaceMediaInput,
  VideoProcessMode,
} from "../types";
import type { ReframeAspectMode } from "../video/reframe-outpaint";
import type { VideoToolId } from "../../../types/video-tools";

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
  isRetaking,
  retakeStatus,
}: {
  mode: GenSpaceMode;
  videoMode: VideoProcessMode;
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
  const [selectedTool, setSelectedToolState] = useState<VideoToolId>("reframe");
  const [toolInput, setToolInput] = useState<GenSpaceMediaInput | null>(null);
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
  const isRetakeMode = mode === "video" && videoMode === "retake";
  const isToolsMode = mode === "video" && videoMode === "reframe";
  const isReframeMode = isToolsMode && selectedTool === "reframe";

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
    setToolInput((current) => {
      if (!next.videoUrl) return current ? null : current;
      const path = next.videoPath ?? current?.path;
      const trimDuration = next.duration > 0 ? next.duration : undefined;
      const mediaDuration =
        next.videoDuration > 0 ? next.videoDuration : undefined;
      if (
        current?.url === next.videoUrl &&
        current.path === path &&
        current.role === "control_video" &&
        current.trimStartTime === next.startTime &&
        current.trimDuration === trimDuration &&
        current.mediaDuration === mediaDuration
      ) {
        return current;
      }
      return {
        id:
          current?.url === next.videoUrl ? current.id : crypto.randomUUID(),
        url: next.videoUrl,
        path,
        role: "control_video",
        type: "video",
        trimStartTime: next.startTime,
        trimDuration,
        mediaDuration,
      };
    });
  }, []);

  const setReframeSource = useCallback(
    (source: {
      videoUrl: string;
      videoPath: string;
      duration?: number;
      startTime?: number;
      trimDuration?: number;
      aspectMode?: ReframePanelState["aspectMode"];
      padding?: ReframePanelState["padding"];
    }) => {
      const aspectMode =
        source.aspectMode && source.aspectMode !== "custom"
          ? source.aspectMode
          : "16:9";
      const startTime = source.startTime ?? 0;
      const trimDuration = source.trimDuration ?? source.duration ?? 0;
      setReframeInput((current) => ({
        ...current,
        videoUrl: source.videoUrl,
        videoPath: source.videoPath,
        startTime,
        duration: trimDuration,
        videoDuration: source.duration ?? 0,
        aspectMode,
        ready: false,
      }));
      setToolInput((current) => ({
        id:
          current?.url === source.videoUrl
            ? current.id
            : crypto.randomUUID(),
        url: source.videoUrl,
        path: source.videoPath,
        role: "control_video",
        type: "video",
        trimStartTime: startTime,
        trimDuration: trimDuration || undefined,
        mediaDuration: source.duration,
      }));
      setReframePanelKey((current) => current + 1);
    },
    [],
  );

  const setReframeAspectMode = useCallback((aspectMode: ReframeAspectMode) => {
    setReframeInput((current) => ({ ...current, aspectMode }));
  }, []);

  const setSelectedTool = useCallback(
    (nextTool: VideoToolId) => {
      if (nextTool === "reframe" && selectedTool !== "reframe") {
        const videoUrl = toolInput?.url ?? null;
        const videoPath = toolInput?.path ?? null;
        const startTime = toolInput?.trimStartTime ?? 0;
        const trimDuration = toolInput?.trimDuration;
        const videoDuration = toolInput?.mediaDuration;
        setReframeInput((current) => ({
          ...current,
          videoUrl,
          videoPath,
          startTime,
          duration: trimDuration ?? videoDuration ?? 0,
          videoDuration: videoDuration ?? 0,
          videoWidth: 0,
          videoHeight: 0,
          ready: false,
        }));
        setReframePanelKey((current) => current + 1);
      }
      setSelectedToolState(nextTool);
    },
    [selectedTool, toolInput],
  );

  const panel = () =>
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
    ) : null;

  return {
    retakeInput,
    reframeInput,
    isRetakeMode,
    isToolsMode,
    isReframeMode,
    panel,
    reframePanelKey,
    handleReframePanelChange,
    setReframeSource,
    setReframeAspectMode,
    selectedTool,
    setSelectedTool,
    toolInput,
    setToolInput,
  };
}
