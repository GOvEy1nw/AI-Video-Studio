import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type MouseEvent,
} from "react";
import { useProjects } from "@/contexts/ProjectContext";
import { useVideoProfiles } from "@/hooks/use-image-profiles";
import { createDirectorSequence } from "@/lib/director-timeline";
import { DirectorSidebar } from "./director/DirectorSidebar";
import { DirectorWorkspacePanel } from "./director/DirectorWorkspacePanel";

const STORAGE_KEY = "aivs-director-editor-layout-v2";
const DIRECTOR_TIMELINE_MIN_HEIGHT = 300;

interface DirectorLayout {
  leftWidth: number;
  assetsHeight: number;
  timelineHeight: number;
  settingsPercent: number;
}

const DEFAULT_LAYOUT: DirectorLayout = {
  leftWidth: 288,
  assetsHeight: 480,
  timelineHeight: 320,
  settingsPercent: 28,
};

function loadLayout(): DirectorLayout {
  try {
    const saved = {
      ...DEFAULT_LAYOUT,
      ...(JSON.parse(
        localStorage.getItem(STORAGE_KEY) || "{}",
      ) as Partial<DirectorLayout>),
    };
    return {
      ...saved,
      timelineHeight: Math.max(
        DIRECTOR_TIMELINE_MIN_HEIGHT,
        saved.timelineHeight,
      ),
    };
  } catch {
    return DEFAULT_LAYOUT;
  }
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function DirectorEditor() {
  const {
    currentProject,
    currentProjectId,
    currentTab,
    addAsset,
    updateAsset,
    addTakeToAsset,
    deleteAsset,
    deleteTakeFromAsset,
    setAssetActiveTake,
    createAssetBin,
    renameAssetBin,
    deleteAssetBin,
    setAssetBinColor,
    addDirectorTimeline,
    deleteDirectorTimeline,
    renameDirectorTimeline,
    duplicateDirectorTimeline,
    setActiveDirectorTimeline,
    updateDirectorTimeline,
  } = useProjects();
  const { profiles } = useVideoProfiles();
  const [layout, setLayout] = useState(loadLayout);
  const [openTimelineIds, setOpenTimelineIds] = useState<Set<string>>(
    new Set(),
  );
  const creatingInitialTimeline = useRef(false);
  const enabledProfiles = useMemo(
    () => profiles.filter((profile) => profile.director.enabled),
    [profiles],
  );
  const timelines = currentProject?.directorTimelines || [];
  const activeTimeline =
    timelines.find(
      (timeline) => timeline.id === currentProject?.activeDirectorTimelineId,
    ) ||
    timelines[0] ||
    null;
  const openTimelines = timelines.filter((timeline) =>
    openTimelineIds.has(timeline.id),
  );

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(layout));
  }, [layout]);

  useEffect(() => {
    if (timelines.length > 0) creatingInitialTimeline.current = false;
    if (
      !currentProjectId ||
      timelines.length > 0 ||
      creatingInitialTimeline.current
    )
      return;
    const profile = enabledProfiles[0];
    if (!profile) return;
    creatingInitialTimeline.current = true;
    addDirectorTimeline(
      currentProjectId,
      createDirectorSequence(
        profile.id,
        profile.ui.defaultResolutionTier,
        profile.ui.defaultAspectRatio,
      ),
    );
  }, [
    addDirectorTimeline,
    currentProjectId,
    enabledProfiles,
    timelines.length,
  ]);

  useEffect(() => {
    if (!activeTimeline) return;
    setOpenTimelineIds((current) => {
      const validIds = new Set(timelines.map((timeline) => timeline.id));
      const next = new Set([...current].filter((id) => validIds.has(id)));
      next.add(activeTimeline.id);
      return next;
    });
  }, [activeTimeline?.id, timelines]);

  const startResize = useCallback(
    (
      event: MouseEvent<HTMLDivElement>,
      key: keyof DirectorLayout,
      direction: number,
      min: number,
      max: number,
    ) => {
      event.preventDefault();
      const horizontal = key === "leftWidth" || key === "settingsPercent";
      const start = horizontal ? event.clientX : event.clientY;
      const initial = layout[key];
      const move = (moveEvent: globalThis.MouseEvent) => {
        const coordinate = horizontal ? moveEvent.clientX : moveEvent.clientY;
        setLayout((current) => ({
          ...current,
          [key]: clamp(initial + (coordinate - start) * direction, min, max),
        }));
      };
      const stop = () => {
        document.removeEventListener("mousemove", move);
        document.removeEventListener("mouseup", stop);
      };
      document.addEventListener("mousemove", move);
      document.addEventListener("mouseup", stop);
    },
    [layout],
  );

  if (!currentProject || !currentProjectId) return null;

  const addTimeline = () => {
    const profile = enabledProfiles[0];
    if (!profile) return;
    addDirectorTimeline(
      currentProjectId,
      createDirectorSequence(
        profile.id,
        profile.ui.defaultResolutionTier,
        profile.ui.defaultAspectRatio,
      ),
    );
  };

  const closeTimelineTab = (timelineId: string) => {
    if (openTimelineIds.size <= 1) return;
    const remaining = [...openTimelineIds].filter((id) => id !== timelineId);
    setOpenTimelineIds(new Set(remaining));
    if (activeTimeline?.id === timelineId && remaining[0])
      setActiveDirectorTimeline(currentProjectId, remaining[0]);
  };

  return (
    <div className="flex h-full min-h-0 bg-zinc-950">
      <div
        className="min-w-0 flex-shrink-0"
        style={{ width: layout.leftWidth }}
      >
        <DirectorSidebar
          isActive={currentTab === "director"}
          projectId={currentProjectId}
          assets={currentProject.assets}
          assetBins={currentProject.assetBins || []}
          assetBinColors={currentProject.assetBinColors || {}}
          timelines={timelines}
          activeTimelineId={activeTimeline?.id}
          assetsHeight={layout.assetsHeight}
          onAssetsResizeStart={(event) =>
            startResize(
              event,
              "assetsHeight",
              1,
              180,
              Math.max(240, window.innerHeight - 260),
            )
          }
          onAssignAssetToBin={(assetId, bin) =>
            updateAsset(currentProjectId, assetId, { bin })
          }
          onCreateBin={(name) => createAssetBin(currentProjectId, name)}
          onRenameBin={(oldName, newName) =>
            renameAssetBin(currentProjectId, oldName, newName)
          }
          onDeleteBin={(name) => deleteAssetBin(currentProjectId, name)}
          onSetBinColor={(name, colorLabel) =>
            setAssetBinColor(currentProjectId, name, colorLabel)
          }
          onAddAsset={(asset) => addAsset(currentProjectId, asset)}
          onUpdateAsset={(assetId, updates) =>
            updateAsset(currentProjectId, assetId, updates)
          }
          onDeleteAsset={(assetId) => deleteAsset(currentProjectId, assetId)}
          onSetAssetActiveTake={(assetId, takeIndex) =>
            setAssetActiveTake(currentProjectId, assetId, takeIndex)
          }
          onDeleteTake={(assetId, takeIndex) =>
            deleteTakeFromAsset(currentProjectId, assetId, takeIndex)
          }
          onAddTimeline={addTimeline}
          onSelectTimeline={(timelineId) =>
            setActiveDirectorTimeline(currentProjectId, timelineId)
          }
          onRenameTimeline={(timelineId, name) =>
            renameDirectorTimeline(
              currentProjectId,
              timelineId,
              name.trim() || "Director Timeline",
            )
          }
          onDuplicateTimeline={(timelineId) => {
            duplicateDirectorTimeline(currentProjectId, timelineId);
          }}
          onCloseTimelineTab={closeTimelineTab}
          onDeleteTimeline={(timelineId) =>
            deleteDirectorTimeline(currentProjectId, timelineId)
          }
        />
      </div>
      <div
        className="w-1 flex-shrink-0 cursor-col-resize bg-transparent hover:bg-blue-500/40 active:bg-blue-500/60 transition-colors relative group z-10"
        onMouseDown={(event) => startResize(event, "leftWidth", 1, 200, 480)}
        role="separator"
        aria-label="Resize Director sidebar"
      />
      <DirectorWorkspacePanel
        isActive={currentTab === "director"}
        projectId={currentProjectId}
        timeline={activeTimeline}
        timelines={timelines}
        assets={currentProject.assets}
        updateDirectorTimeline={updateDirectorTimeline}
        addAsset={addAsset}
        updateAsset={updateAsset}
        addTakeToAsset={addTakeToAsset}
        timelineHeight={layout.timelineHeight}
        onTimelineResizeStart={(event) =>
          startResize(
            event,
            "timelineHeight",
            -1,
            DIRECTOR_TIMELINE_MIN_HEIGHT,
            Math.max(320, window.innerHeight - 220),
          )
        }
        settingsPercent={layout.settingsPercent}
        onSettingsResizeStart={(event) => {
          const containerWidth =
            event.currentTarget.parentElement?.clientWidth || 1;
          startResize(event, "settingsPercent", 100 / containerWidth, 28, 68);
        }}
        openTimelines={openTimelines}
        onSelectTimeline={(timelineId) =>
          setActiveDirectorTimeline(currentProjectId, timelineId)
        }
        onCloseTimelineTab={closeTimelineTab}
        onAddTimeline={addTimeline}
      />
    </div>
  );
}
