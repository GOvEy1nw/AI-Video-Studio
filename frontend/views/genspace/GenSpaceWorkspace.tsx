import { GenSpaceGallery } from "./GenSpaceGallery";
import { GenSpaceOverlays } from "./GenSpaceOverlays";
import { GenSpaceSelectedGeneration } from "./GenSpaceSelectedGeneration";
import { GenSpaceSidebar } from "./GenSpaceSidebar";
import { useGenSpaceController } from "./hooks/useGenSpaceController";

export function GenSpaceWorkspace({ isActive }: { isActive: boolean }) {
  const controller = useGenSpaceController(isActive);
  const galleryWidth = 25;
  const sidebarWidth = 25;
  const selectedGenerationWidth = galleryWidth + sidebarWidth;

  return (
    <div {...controller.rootProps}>
      <GenSpaceGallery
        {...controller.gallery}
        style={{
          width: galleryWidth + "rem",
          left: sidebarWidth + "rem",
        }}
      />
      <GenSpaceSelectedGeneration
        {...controller.selectedGeneration}
        isActive={isActive}
        style={{
          left: selectedGenerationWidth + "rem",
          right: "0rem",
        }}
      />
      <aside
        className="absolute inset-y-0 left-0 z-20"
        style={{
          width: sidebarWidth + "rem",
        }}
      >
        <GenSpaceSidebar controller={controller.sidebar} />
      </aside>
      <GenSpaceOverlays {...controller.overlays} />
    </div>
  );
}
