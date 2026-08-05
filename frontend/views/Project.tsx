import { lazy, Suspense, useEffect, useState, type ReactNode } from "react";
import { ArrowLeft, Sparkles, Film, Clapperboard } from "lucide-react";
import { useProjects } from "../contexts/ProjectContext";
import { AivsLogo } from "../components/AivsLogo";
import { Button } from "../components/ui/button";
import type { ProjectTab } from "../types/project";

const loadGenSpace = () => import("./GenSpace");
const loadDirectorEditor = () => import("./DirectorEditor");
const loadVideoEditor = () => import("./VideoEditor");

const LazyGenSpace = lazy(async () => {
  const { GenSpace } = await loadGenSpace();
  return { default: GenSpace };
});
const LazyDirectorEditor = lazy(async () => {
  const { DirectorEditor } = await loadDirectorEditor();
  return { default: DirectorEditor };
});
const LazyVideoEditor = lazy(async () => {
  const { VideoEditor } = await loadVideoEditor();
  return { default: VideoEditor };
});

const workspaceLoaders: Record<ProjectTab, () => Promise<unknown>> = {
  "gen-space": loadGenSpace,
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
  return <div className="h-full bg-zinc-950" />;
}

export function Project() {
  const { currentProject, currentTab, setCurrentTab, goHome } = useProjects();
  const [visitedTabs, setVisitedTabs] = useState<ReadonlySet<ProjectTab>>(
    () => new Set([currentTab]),
  );

  useEffect(() => {
    setVisitedTabs((current) => addVisitedTab(current, currentTab));
  }, [currentTab]);

  if (!currentProject) {
    return (
      <div className="h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-zinc-400 mb-4">Project not found</p>
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
    <div className="h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="flex items-center px-4 py-3 border-b border-zinc-800">
        <div className="flex-1 flex items-center gap-4">
          {/* Back button and logo */}
          <button
            onClick={goHome}
            className="p-2 rounded-lg hover:bg-zinc-800 transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-zinc-400" />
          </button>

          <AivsLogo className="h-6 w-auto text-white" />

          {/* Project name */}
          <span className="text-white font-medium">{currentProject.name}</span>
        </div>

        {/* Center - Tabs */}
        <div className="flex items-center gap-1 bg-zinc-900 rounded-lg p-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onPointerEnter={() => void workspaceLoaders[tab.id]()}
              onFocus={() => void workspaceLoaders[tab.id]()}
              onClick={() => {
                setVisitedTabs((current) => addVisitedTab(current, tab.id));
                setCurrentTab(tab.id);
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                currentTab === tab.id
                  ? "bg-zinc-800 text-white"
                  : "text-zinc-400 hover:text-white"
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
            className="absolute inset-0 z-10 bg-zinc-950"
          >
            <Suspense fallback={<WorkspaceFallback />}>
              <LazyGenSpace isActive={currentTab === "gen-space"} />
            </Suspense>
          </div>
        ) : null}
        {visitedTabs.has("director") ? (
          <div
            hidden={currentTab !== "director"}
            className="absolute inset-0 z-10 bg-zinc-950"
          >
            <Suspense fallback={<WorkspaceFallback />}>
              <LazyDirectorEditor isActive={currentTab === "director"} />
            </Suspense>
          </div>
        ) : null}
        {visitedTabs.has("video-editor") ? (
          <div
            hidden={currentTab !== "video-editor"}
            className="absolute inset-0 z-10 bg-zinc-950"
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
