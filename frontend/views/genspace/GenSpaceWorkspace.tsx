import { GenSpaceGallery } from "./GenSpaceGallery";
import { GenSpaceOverlays } from "./GenSpaceOverlays";
import { GenSpaceSelectedGeneration } from "./GenSpaceSelectedGeneration";
import { GenSpaceSidebar } from "./GenSpaceSidebar";
import { useGenSpaceController } from "./hooks/useGenSpaceController";

export function GenSpaceWorkspace() {
  const controller = useGenSpaceController();
  return (
    <div {...controller.rootProps}>
      <GenSpaceGallery {...controller.gallery} />
      <GenSpaceSelectedGeneration {...controller.selectedGeneration} />
      <aside className="absolute inset-y-0 left-0 z-20 w-[480px]">
        <GenSpaceSidebar controller={controller.sidebar} />
      </aside>
      <GenSpaceOverlays {...controller.overlays} />
    </div>
  );
}

