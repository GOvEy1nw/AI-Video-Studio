import { GenSpaceGallery } from "./GenSpaceGallery";
import { GenSpaceOverlays } from "./GenSpaceOverlays";
import { GenSpaceSelectedGeneration } from "./GenSpaceSelectedGeneration";
import { GenSpaceSidebar } from "./GenSpaceSidebar";
import { useGenSpaceController } from "./hooks/useGenSpaceController";

export function GenSpaceWorkspace({ isActive }: { isActive: boolean }) {
  const controller = useGenSpaceController(isActive);
  return (
    <div {...controller.rootProps}>
      <GenSpaceGallery
        {...controller.gallery}
        style={{
          width: "15rem",
        }}
      />
      <GenSpaceSelectedGeneration
        {...controller.selectedGeneration}
        isActive={isActive}
        style={{
          left: "25rem",
          right: "15rem",
        }}
      />
      <aside
        className="absolute inset-y-0 left-0 z-20"
        style={{
          width: "25rem",
        }}
      >
        <GenSpaceSidebar controller={controller.sidebar} />
      </aside>
      <GenSpaceOverlays {...controller.overlays} />
    </div>
  );
}
