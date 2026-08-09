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
      className="genspace-mode-theme flex h-full flex-col overflow-y-auto border-r border-zinc-800 bg-zinc-900"
      data-genspace-mode={controller.mode}
      style={getGenSpaceModeAccentStyle(controller.mode)}
    >
      <GenSpaceModeTabs mode={controller.mode} onChange={controller.setMode} />
      {controller.mode === "image" ? (
        <ImageGenPanel controller={controller.image} />
      ) : controller.mode === "video" ? (
        <VideoGenPanel controller={controller.video} />
      ) : (
        <AudioGenPanel controller={controller.audio} />
      )}
    </div>
  );
}
