import { GenSpaceGallery } from "./GenSpaceGallery";
import { GenSpaceOverlays } from "./GenSpaceOverlays";
import { GenSpaceSelectedGeneration } from "./GenSpaceSelectedGeneration";
import { GenSpaceSidebar } from "./GenSpaceSidebar";
import { GenSpaceResizeHandle } from "./GenSpaceResizeHandle";
import { useGenSpaceController } from "./hooks/useGenSpaceController";
import { useState } from "react";

export function GenSpaceWorkspace({ isActive }: { isActive: boolean }) {
  const controller = useGenSpaceController(isActive);
  const [leftWidth, setLeftWidth] = useState<number>();
  const [rightWidth, setRightWidth] = useState<number>();
  const resize = (
    setWidth: (value: number) => void,
    current: number | undefined,
    delta: number,
  ) => setWidth(Math.min(25, Math.max(15, (current ?? 25) + delta / 4)));
  return (
    <div {...controller.rootProps}>
      <GenSpaceGallery
        {...controller.gallery}
        style={{
          width: rightWidth ? rightWidth + "vw" : "clamp(15vw, 15vw, 25vw)",
        }}
        onResize={(delta) => resize(setRightWidth, rightWidth, delta / 4)}
      />
      <GenSpaceSelectedGeneration
        {...controller.selectedGeneration}
        isActive={isActive}
        style={{
          left: leftWidth ? leftWidth + "vw" : "clamp(20vw, 25vw, 25vw)",
          right: rightWidth ? rightWidth + "vw" : "clamp(15vw, 15vw, 25vw)",
        }}
      />
      <aside
        className="absolute inset-y-0 left-0 z-20"
        style={{
          width: leftWidth ? leftWidth + "vw" : "clamp(20vw, 25vw, 25vw)",
        }}
      >
        <GenSpaceSidebar controller={controller.sidebar} />
        <GenSpaceResizeHandle
          label="Resize prompt sidebar"
          side="left"
          onResize={(delta) => resize(setLeftWidth, leftWidth, delta / 4)}
        />
      </aside>
      <GenSpaceOverlays {...controller.overlays} />
    </div>
  );
}
