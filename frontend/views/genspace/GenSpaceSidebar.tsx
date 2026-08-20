import { GenSpaceModeTabs } from "./GenSpaceModeTabs";
import { AudioGenPanel } from "./audio/AudioGenPanel";
import { ImageGenPanel } from "./image/ImageGenPanel";
import { getGenSpaceModeAccentStyle } from "./mode-accent";
import type { GenSpaceSidebarController } from "./types";
import { VideoGenPanel } from "./video/VideoGenPanel";

export function GenSpaceSidebar({
  controller,
}: {
  controller: GenSpaceSidebarController;
}) {
  return (
    <div
      className="genspace-mode-theme flex h-full bg-background"
      data-genspace-mode={controller.mode}
      style={getGenSpaceModeAccentStyle(controller.mode)}
    >
      <GenSpaceModeTabs
        mode={controller.mode}
        onChange={controller.setMode}
        favouriteIds={controller.workflow.favouriteIds}
        onSelectWorkflow={controller.workflow.select}
        onToggleFavourite={controller.workflow.toggleFavourite}
        onReorderFavourite={controller.workflow.reorderFavourite}
        onConfirmReorder={controller.workflow.confirmFavouriteOrder}
      />
      <div
        data-workflow-catalogue-host
        className="relative min-w-0 flex-1 overflow-y-auto bg-card m-2 ml-0 rounded-2xl"
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
