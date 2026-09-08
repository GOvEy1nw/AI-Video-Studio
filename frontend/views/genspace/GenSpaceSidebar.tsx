import { GenSpaceModeTabs } from "./GenSpaceModeTabs";
import { AudioGenPanel } from "./audio/AudioGenPanel";
import { ImageGenPanel } from "./image/ImageGenPanel";
import { getGenSpaceModeAccentStyle } from "./mode-accent";
import type { GenSpaceSidebarController } from "./types";
import { VideoGenPanel } from "./video/VideoGenPanel";
import { useProjectNavigation } from "../../contexts/ProjectContext";

export function GenSpaceSidebar({
  controller,
  railOnly = false,
}: {
  controller: GenSpaceSidebarController;
  railOnly?: boolean;
}) {
  const { currentView, setCurrentView } = useProjectNavigation();

  return (
    <div
      className="genspace-mode-theme flex h-full bg-background"
      data-genspace-mode={controller.mode}
      style={getGenSpaceModeAccentStyle(controller.mode)}
    >
      <GenSpaceModeTabs
        mode={controller.mode}
        onChange={(mode) => {
          controller.setMode(mode);
          setCurrentView("project");
        }}
        referencesActive={currentView === "references"}
        onOpenReferences={() => setCurrentView("references")}
        favouriteIds={controller.workflow.favouriteIds}
        onSelectWorkflow={(workflowId) => {
          controller.workflow.select(workflowId);
          setCurrentView("project");
        }}
        onToggleFavourite={controller.workflow.toggleFavourite}
        onReorderFavourite={controller.workflow.reorderFavourite}
        onConfirmReorder={controller.workflow.confirmFavouriteOrder}
      />
      <div
        hidden={railOnly}
        data-workflow-catalogue-host
        className="relative min-w-0 flex-1 overflow-y-auto bg-card m-2 ml-0 rounded-2xl border border-border"
      >
        {controller.mode === "image" ? (
          <ImageGenPanel controller={controller.image} />
        ) : controller.mode === "video" ? (
          <VideoGenPanel controller={controller.video} />
        ) : (
          <AudioGenPanel controller={controller.audio} />
        )}
      </div>
    </div>
  );
}
