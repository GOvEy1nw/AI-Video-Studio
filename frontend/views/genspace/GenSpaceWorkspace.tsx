import { GenSpaceGallery } from "./GenSpaceGallery";
import { GenSpaceOverlays } from "./GenSpaceOverlays";
import { GenSpaceSelectedGeneration } from "./GenSpaceSelectedGeneration";
import { GenSpaceSidebar } from "./GenSpaceSidebar";
import { useGenSpaceController } from "./hooks/useGenSpaceController";
import { ReferenceLibraryView } from "../reference-library/ReferenceLibraryView";

export function GenSpaceWorkspace({
  isActive,
  showReferences = false,
}: {
  isActive: boolean;
  showReferences?: boolean;
}) {
  const controller = useGenSpaceController(isActive && !showReferences);
  const galleryWidth = 25;
  const sidebarWidth = 35;
  const railWidth = 4.5;
  const selectedGenerationWidth = galleryWidth + sidebarWidth;

  return (
    <div {...controller.rootProps}>
      <GenSpaceGallery
        {...controller.gallery}
        style={{
          width: galleryWidth + "rem",
          left: sidebarWidth + "rem",
          display: showReferences ? "none" : undefined,
        }}
      />
      <GenSpaceSelectedGeneration
        {...controller.selectedGeneration}
        isActive={isActive && !showReferences}
        style={{
          left: selectedGenerationWidth + "rem",
          right: "0rem",
          display: showReferences ? "none" : undefined,
        }}
      />
      {showReferences ? (
        <div
          className="absolute inset-y-0 right-0"
          style={{ left: railWidth + "rem" }}
        >
          <ReferenceLibraryView />
        </div>
      ) : null}
      <aside
        className="absolute inset-y-0 left-0 z-20"
        style={{
          width: (showReferences ? railWidth : sidebarWidth) + "rem",
        }}
      >
        <GenSpaceSidebar
          controller={controller.sidebar}
          railOnly={showReferences}
        />
      </aside>
      <div hidden={showReferences}>
        <GenSpaceOverlays {...controller.overlays} />
      </div>
    </div>
  );
}
