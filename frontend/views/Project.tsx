import { lazy, Suspense, useEffect, useState, type ReactNode } from "react";
import { ArrowLeft, Sparkles, Film, Clapperboard, Loader2 } from "lucide-react";
import {
  useProjectMeta,
  useProjectNavigation,
} from "../contexts/ProjectContext";
import { AivsLogo } from "../components/AivsLogo";
import { Button } from "../components/ui/button";
import type { ProjectTab } from "../types/project";
import { GenSpace } from "./GenSpace";

const loadDirectorEditor = () => import("./DirectorEditor");
const loadVideoEditor = () => import("./VideoEditor");

const LazyDirectorEditor = lazy(async () => {
  const { DirectorEditor } = await loadDirectorEditor();
  return { default: DirectorEditor };
});
const LazyVideoEditor = lazy(async () => {
  const { VideoEditor } = await loadVideoEditor();
  return { default: VideoEditor };
});

const workspaceLoaders: Partial<Record<ProjectTab, () => Promise<unknown>>> = {
  director: loadDirectorEditor,
  "video-editor": loadVideoEditor,
};

export function addVisitedTab(
  current: ReadonlySet<ProjectTab>,
  tab: ProjectTab,
): ReadonlySet<ProjectTab> {
  if (current.has(tab)) return current;
  const next = new Set(current);
  next.add(tab);
  return next;
}

function WorkspaceFallback() {
  return (
    <div
      role="status"
      className="flex h-full items-center justify-center gap-2 bg-background text-sm text-muted-foreground"
    >
      <Loader2
        aria-hidden="true"
        className="h-5 w-5 animate-spin text-primary"
      />
      <span>Loading workspace...</span>
    </div>
  );
}

export function Project() {
  const { currentProjectMeta } = useProjectMeta();
  const { currentTab, setCurrentTab, goHome } = useProjectNavigation();
  const [visitedTabs, setVisitedTabs] = useState<ReadonlySet<ProjectTab>>(
    () => new Set([currentTab]),
  );

  useEffect(() => {
    setVisitedTabs((current) => addVisitedTab(current, currentTab));
  }, [currentTab]);

  if (!currentProjectMeta) {
    return (
      <div className="h-full bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Project not found</p>
          <Button onClick={goHome}>Go Home</Button>
        </div>
      </div>
    );
  }

  const tabs: { id: ProjectTab; label: string; icon: ReactNode }[] = [
    {
      id: "gen-space",
      label: "Quick Gen",
      icon: <Sparkles className="h-4 w-4" />,
    },
    {
      id: "director",
      label: "Director",
      icon: <Clapperboard className="h-4 w-4" />,
    },
    {
      id: "video-editor",
      label: "Video Editor",
      icon: <Film className="h-4 w-4" />,
    },
  ];

  return (
    <div className="h-full bg-background flex flex-col">
      {/* Header */}
      <header className="flex items-center px-4 py-3 bg-card">
        <div className="flex-1 flex items-center gap-4">
          {/* Back button and logo */}
          <button
            onClick={goHome}
            className="p-2 rounded-lg hover:bg-surface-hover transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-muted-foreground" />
          </button>

          <AivsLogo className="h-6 w-auto text-foreground" />

          {/* Project name */}
          <span className="text-foreground font-medium">
            {currentProjectMeta.name}
          </span>
        </div>

        {/* Center - Tabs */}
        <div className="flex items-center gap-1 bg-card rounded-lg p-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onPointerEnter={() => void workspaceLoaders[tab.id]?.()}
              onFocus={() => void workspaceLoaders[tab.id]?.()}
              onClick={() => {
                setVisitedTabs((current) => addVisitedTab(current, tab.id));
                setCurrentTab(tab.id);
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                currentTab === tab.id
                  ? "bg-surface-selected text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Right spacer - equal to left to keep tabs centered */}
        <div className="flex-1" />
      </header>

      {/* Visited workspaces stay mounted for state, but inactive layers do not render. */}
      <main className="flex-1 overflow-hidden relative">
        {visitedTabs.has("gen-space") ? (
          <div
            hidden={currentTab !== "gen-space"}
            className="absolute inset-0 z-10 bg-background"
          >
            <GenSpace isActive={currentTab === "gen-space"} />
          </div>
        ) : null}
        {visitedTabs.has("director") ? (
          <div
            hidden={currentTab !== "director"}
            className="absolute inset-0 z-10 bg-background"
          >
            <Suspense fallback={<WorkspaceFallback />}>
              <LazyDirectorEditor isActive={currentTab === "director"} />
            </Suspense>
          </div>
        ) : null}
        {visitedTabs.has("video-editor") ? (
          <div
            hidden={currentTab !== "video-editor"}
            className="absolute inset-0 z-10 bg-background"
          >
            <Suspense fallback={<WorkspaceFallback />}>
              <LazyVideoEditor isActive={currentTab === "video-editor"} />
            </Suspense>
          </div>
        ) : null}
      </main>
    </div>
  );
}
