import { useEffect, useRef, useState } from "react";
import { Plus, Folder, MoreVertical, Trash2, Pencil } from "lucide-react";
import {
  useProjectList,
  useProjectNavigation,
} from "../contexts/ProjectContext";
import { AivsLogo } from "../components/AivsLogo";
import { Button } from "../components/ui/button";
import { FloatingMenu } from "../components/FloatingMenu";
import { SidebarUtilityButtons } from "../components/SidebarUtilityButtons";
import type { Project } from "../types/project";

function formatDate(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function ProjectCard({
  project,
  onOpen,
  onDelete,
  onRename,
}: {
  project: Project;
  onOpen: () => void;
  onDelete: () => void;
  onRename: () => void;
}) {
  const [showMenu, setShowMenu] = useState(false);
  const [imgError, setImgError] = useState(false);
  const menuTriggerRef = useRef<HTMLButtonElement>(null);

  const bestThumbnail =
    project.thumbnail ||
    project.assets.find((asset) => asset.type === "image")?.url ||
    project.assets.find((asset) => asset.type === "video")?.thumbnail;

  return (
    <div
      className="group relative overflow-hidden rounded-lg border border-border bg-surface transition-colors hover:border-border-strong cursor-pointer"
      onClick={onOpen}
    >
      {/* Thumbnail */}
      <div className="relative flex aspect-video items-center justify-center overflow-hidden bg-surface-raised">
        {bestThumbnail && !imgError ? (
          <img
            src={bestThumbnail}
            alt={project.name}
            loading="lazy"
            decoding="async"
            className="w-full h-full object-cover"
            onError={() => setImgError(true)}
          />
        ) : (
          <Folder className="h-12 w-12 text-subtle-foreground" />
        )}
        {/* Hover overlay */}
        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>

      {/* Info */}
      <div className="p-3">
        <h3 className="truncate font-medium text-foreground">{project.name}</h3>
        <p className="mt-1 text-xs text-subtle-foreground">
          {formatDate(project.updatedAt)}
        </p>
      </div>

      {/* Menu button */}
      <button
        ref={menuTriggerRef}
        onClick={(e) => {
          e.stopPropagation();
          setShowMenu(!showMenu);
        }}
        className="absolute top-2 right-2 p-1.5 rounded-sm bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70"
      >
        <MoreVertical className="h-4 w-4 text-white" />
      </button>

      {/* Dropdown menu */}
      {showMenu && (
        <FloatingMenu
          anchorRef={menuTriggerRef}
          placement="bottom-end"
          role="menu"
          className="min-w-[120px] overflow-y-auto rounded-lg border border-border bg-popover py-1 shadow-lg"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => {
              onRename();
              setShowMenu(false);
            }}
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-muted-foreground hover:bg-surface-hover"
          >
            <Pencil className="h-4 w-4" />
            Rename
          </button>
          <button
            onClick={() => {
              onDelete();
              setShowMenu(false);
            }}
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-red-400 hover:bg-surface-hover"
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </button>
        </FloatingMenu>
      )}
    </div>
  );
}

export function Home() {
  const { projects, createProject, deleteProject, renameProject } =
    useProjectList();
  const { openProject } = useProjectNavigation();
  const [isCreating, setIsCreating] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const heroVideoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = heroVideoRef.current;
    if (!video) return;
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => {
      if (document.hidden || mediaQuery.matches) video.pause();
      else void video.play().catch(() => undefined);
    };
    sync();
    document.addEventListener("visibilitychange", sync);
    mediaQuery.addEventListener("change", sync);
    return () => {
      document.removeEventListener("visibilitychange", sync);
      mediaQuery.removeEventListener("change", sync);
      video.pause();
    };
  }, []);

  const handleCreateProject = () => {
    if (newProjectName.trim()) {
      const project = createProject(newProjectName.trim());
      setNewProjectName("");
      setIsCreating(false);
      openProject(project.id);
    }
  };

  const handleRenameProject = (id: string, currentName: string) => {
    setRenamingId(id);
    setRenameValue(currentName);
  };

  const submitRename = () => {
    if (renamingId && renameValue.trim()) {
      renameProject(renamingId, renameValue.trim());
    }
    setRenamingId(null);
    setRenameValue("");
  };

  return (
    <div className="h-full bg-background text-foreground flex">
      {/* Sidebar */}
      <aside className="w-64 rounded-2xl bg-card m-2 flex flex-col">
        <div className="p-6">
          <AivsLogo className="h-6 w-auto text-foreground mb-2" />
          <p className="text-muted-foreground text-xs">
            Local-Only AI Video Studio
          </p>
          <p className="text-subtle-foreground text-2xs">Powered by WanGP</p>
        </div>

        <nav className="flex-1 px-3">
          <button className="w-full px-3 py-2 rounded-lg bg-surface-selected text-foreground text-left text-sm font-medium flex items-center gap-2">
            <Folder className="h-4 w-4" />
            Home
          </button>

          {projects.length > 0 && (
            <div className="mt-6">
              <h4 className="px-3 text-xs font-semibold text-subtle-foreground uppercase tracking-wider mb-2">
                Recent Projects
              </h4>
              {projects.slice(0, 5).map((project) => (
                <button
                  key={project.id}
                  onClick={() => openProject(project.id)}
                  className="w-full px-3 py-2 rounded-lg text-muted-foreground hover:bg-surface-hover hover:text-foreground text-left text-sm flex items-center gap-2 transition-colors truncate"
                >
                  <Folder className="h-4 w-4 shrink-0" />
                  <span className="truncate">{project.name}</span>
                </button>
              ))}
            </div>
          )}
        </nav>

        <div className="space-y-3 p-4">
          <button
            onClick={() => setIsCreating(true)}
            className="w-full px-3 py-2 rounded-lg bg-primary hover:bg-blue-500 text-primary-foreground text-sm font-medium flex items-center justify-center gap-2 transition-colors"
          >
            <Plus className="h-4 w-4" />
            New Project
          </button>
          <SidebarUtilityButtons />
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {/* Projects Grid */}
        <div className="p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-foreground">Projects</h2>
          </div>

          {projects.length === 0 ? (
            <div className="text-center py-16">
              <Folder className="h-16 w-16 text-subtle-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-muted-foreground mb-2">
                No projects yet
              </h3>
              <p className="text-subtle-foreground mb-6">
                Create your first project to get started
              </p>
              <Button
                onClick={() => setIsCreating(true)}
                className="bg-primary hover:bg-blue-500"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Project
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {projects.map((project) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  onOpen={() => openProject(project.id)}
                  onDelete={() => {
                    if (confirm(`Delete "${project.name}"?`)) {
                      deleteProject(project.id);
                    }
                  }}
                  onRename={() => handleRenameProject(project.id, project.name)}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Create Project Modal */}
      {isCreating && (
        <div className="fixed inset-0 bg-overlay/70 flex items-center justify-center z-50">
          <div className="bg-card rounded-xl p-6 w-full max-w-md border border-border">
            <h2 className="text-xl font-semibold text-foreground mb-4">
              Create New Project
            </h2>
            <input
              type="text"
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              placeholder="Project name"
              className="w-full px-4 py-3 rounded-lg bg-input border border-border text-foreground placeholder:text-subtle-foreground focus:outline-hidden focus:border-primary"
              autoFocus
              onKeyDown={(e) => e.key === "Enter" && handleCreateProject()}
            />
            <div className="flex gap-3 mt-6">
              <Button
                variant="outline"
                onClick={() => {
                  setIsCreating(false);
                  setNewProjectName("");
                }}
                className="flex-1 border-border"
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateProject}
                disabled={!newProjectName.trim()}
                className="flex-1 bg-primary hover:bg-blue-500"
              >
                Create
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Rename Modal */}
      {renamingId && (
        <div className="fixed inset-0 bg-overlay/70 flex items-center justify-center z-50">
          <div className="bg-card rounded-xl p-6 w-full max-w-md border border-border">
            <h2 className="text-xl font-semibold text-foreground mb-4">
              Rename Project
            </h2>
            <input
              type="text"
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              placeholder="Project name"
              className="w-full px-4 py-3 rounded-lg bg-input border border-border text-foreground placeholder:text-subtle-foreground focus:outline-hidden focus:border-primary"
              autoFocus
              onKeyDown={(e) => e.key === "Enter" && submitRename()}
            />
            <div className="flex gap-3 mt-6">
              <Button
                variant="outline"
                onClick={() => {
                  setRenamingId(null);
                  setRenameValue("");
                }}
                className="flex-1 border-border"
              >
                Cancel
              </Button>
              <Button
                onClick={submitRename}
                disabled={!renameValue.trim()}
                className="flex-1 bg-primary hover:bg-blue-500"
              >
                Save
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
