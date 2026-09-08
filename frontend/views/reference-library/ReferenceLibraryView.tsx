import {
  Box,
  Image as ImageIcon,
  MapPin,
  Pencil,
  Search,
  Sparkles,
  Trash2,
  UserRound,
} from "lucide-react";
import { useMemo, useState } from "react";
import type {
  ReferenceEntity,
  ReferenceEntityKind,
} from "../../../shared/reference-library";
import {
  GalleryViewControls,
  type GalleryGridColumns,
} from "../../components/GalleryViewControls";
import { Button } from "../../components/ui/button";
import { useReferenceLibrary } from "../../contexts/ReferenceLibraryContext";
import { ReferenceEntityForm } from "./ReferenceEntityForm";
import { ReferenceDetailsPanel } from "./ReferenceDetailsPanel";

const filterOptions = [
  { value: "all", label: "All references", icon: Sparkles },
  { value: "cast", label: "Characters", icon: UserRound },
  { value: "location", label: "Locations", icon: MapPin },
  { value: "prop", label: "Props", icon: Box },
  { value: "other", label: "Other references", icon: ImageIcon },
] as const;

const gridClasses: Record<GalleryGridColumns, string> = {
  1: "grid-cols-1",
  2: "grid-cols-1 sm:grid-cols-2",
  3: "grid-cols-1 sm:grid-cols-2 xl:grid-cols-3",
  4: "grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4",
};

function ReferenceCard({
  entity,
  selected,
  viewMode,
  onEdit,
  onDelete,
}: {
  entity: ReferenceEntity;
  selected: boolean;
  viewMode: "grid" | "list";
  onEdit: () => void;
  onDelete: () => void;
}) {
  const preview = entity.visualReference;
  return (
    <div
      className={`asset-library-card group relative overflow-hidden rounded-xl border-2 bg-card transition-all ${
        selected
          ? "border-blue-500 ring-2 ring-blue-500/30"
          : "border-transparent hover:border-border"
      } ${viewMode === "list" ? "flex min-h-24" : ""}`}
    >
      <button
        type="button"
        aria-label={`Edit ${entity.name}`}
        onClick={onEdit}
        className={`min-w-0 text-left outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring/70 ${
          viewMode === "list" ? "flex flex-1" : "block w-full"
        }`}
      >
        <div
          className={`relative overflow-hidden bg-background ${
            viewMode === "list" ? "h-24 w-24 shrink-0" : "aspect-square w-full"
          }`}
        >
          {preview?.type === "image" ? (
            <img
              src={preview.url}
              alt=""
              loading="lazy"
              decoding="async"
              className="h-full w-full object-cover"
            />
          ) : preview?.type === "video" ? (
            <video
              src={preview.url}
              muted
              playsInline
              preload="metadata"
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-subtle-foreground">
              <ImageIcon className="h-8 w-8" />
            </div>
          )}
          {viewMode === "grid" ? (
            <div className="absolute inset-x-3 bottom-2 truncate rounded-lg bg-black/70 px-3 py-1.5 text-center text-sm font-medium text-white backdrop-blur-sm">
              {entity.name}
            </div>
          ) : null}
        </div>
        <div
          className={`min-w-0 ${
            viewMode === "list"
              ? "flex flex-1 flex-col justify-center px-3 pr-20"
              : "sr-only"
          }`}
        >
          <span className="truncate text-sm font-medium text-foreground">
            {entity.name}
          </span>
          <span className="truncate text-xs capitalize text-muted-foreground">
            {entity.kind === "cast" ? "Character" : entity.kind} · {entity.fidelity}
          </span>
          <span className="truncate text-2xs text-subtle-foreground">
            {entity.token}
          </span>
        </div>
      </button>
      <div className="absolute right-2 top-2 z-10 flex flex-col gap-1.5 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
        <Button
          type="button"
          variant="secondary"
          size="icon"
          aria-label={`Edit ${entity.name}`}
          title={`Edit ${entity.name}`}
          onClick={(event) => {
            event.stopPropagation();
            onEdit();
          }}
          className="h-8 w-8 bg-black/75 text-white hover:bg-black"
        >
          <Pencil className="h-3.5 w-3.5" />
        </Button>
        <Button
          type="button"
          variant="secondary"
          size="icon"
          aria-label={`Delete ${entity.name}`}
          title={`Delete ${entity.name}`}
          onClick={(event) => {
            event.stopPropagation();
            onDelete();
          }}
          className="h-8 w-8 bg-black/75 text-white hover:bg-red-600"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}

export function ReferenceLibraryView() {
  const { entities, error, loading, save, remove } = useReferenceLibrary();
  const [selected, setSelected] = useState<ReferenceEntity | null>(null);
  const [pendingDelete, setPendingDelete] = useState<ReferenceEntity | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<ReferenceEntityKind | "all">("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [gridColumns, setGridColumns] = useState<GalleryGridColumns>(4);
  const shown = useMemo(
    () =>
      entities.filter(
        (entity) =>
          (filter === "all" || entity.kind === filter) &&
          `${entity.name} ${entity.token}`
            .toLowerCase()
            .includes(search.toLowerCase()),
      ),
    [entities, filter, search],
  );

  const requestDelete = (entity: ReferenceEntity) => {
    setDeleteError(null);
    setPendingDelete(entity);
  };

  return (
    <>
      <div className="flex h-full min-h-0 flex-col gap-2 overflow-hidden bg-background p-2 lg:flex-row">
        <aside className="min-h-0 shrink-0 overflow-y-auto rounded-xl border border-border bg-surface lg:w-[26rem] 2xl:w-[30rem]">
          <ReferenceEntityForm
            entity={null}
            onSave={async (input) => { await save(input); }}
            allowReferenceImageGeneration
          />
        </aside>
        <section className="flex min-h-0 min-w-0 flex-1 flex-col rounded-xl border border-border bg-surface">
          <header className="shrink-0 p-4 pb-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h1 className="text-sm font-semibold text-foreground">Saved References</h1>
              <GalleryViewControls
                viewMode={viewMode}
                onViewModeChange={setViewMode}
                gridColumns={gridColumns}
                onGridColumnsChange={setGridColumns}
              />
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1 rounded-lg bg-card p-1">
                {filterOptions.map((option) => {
                  const Icon = option.icon;
                  return (
                    <Button
                      key={option.value}
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label={option.label}
                      aria-pressed={filter === option.value}
                      title={option.label}
                      onClick={() => setFilter(option.value)}
                      className={`h-8 w-8 ${
                        filter === option.value
                          ? "bg-surface-selected text-foreground"
                          : "text-subtle-foreground"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                    </Button>
                  );
                })}
              </div>
              <div className="relative min-w-44 flex-1 sm:max-w-xs">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  aria-label="Search references"
                  placeholder="Search references"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  className="h-9 w-full rounded-lg border border-border bg-input py-1.5 pl-8 pr-2 text-sm text-foreground placeholder:text-subtle-foreground focus:border-border-strong focus:outline-hidden"
                />
              </div>
            </div>
          </header>
          {error ? (
            <p role="alert" className="mx-4 mb-3 text-sm text-red-400">
              {error}
            </p>
          ) : null}
          <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4">
            {loading ? (
              <p className="text-sm text-muted-foreground">Loading references…</p>
            ) : shown.length === 0 ? (
              <div className="flex min-h-52 flex-col items-center justify-center rounded-xl border border-dashed border-border text-center text-muted-foreground">
                <ImageIcon className="mb-2 h-8 w-8 text-subtle-foreground" />
                <p className="text-sm">No saved references match this view.</p>
                <button
                  type="button"
                  onClick={() => {
                    setSearch("");
                    setFilter("all");
                    setSelected(null);
                  }}
                  className="mt-1 text-xs text-blue-400 hover:text-blue-300"
                >
                  Create a reference
                </button>
              </div>
            ) : (
              <div
                className={
                  viewMode === "grid"
                    ? `grid gap-3 ${gridClasses[gridColumns]}`
                    : "space-y-2"
                }
              >
                {shown.map((entity) => (
                  <ReferenceCard
                    key={entity.id}
                    entity={entity}
                    selected={selected?.id === entity.id}
                    viewMode={viewMode}
                    onEdit={() => setSelected(entity)}
                    onDelete={() => requestDelete(entity)}
                  />
                ))}
              </div>
            )}
          </div>
        </section>
        <ReferenceDetailsPanel
          entity={selected}
          onSave={async (input) => setSelected(await save(input))}
        />
      </div>
      {pendingDelete ? (
        <div className="fixed inset-0 z-70 flex items-center justify-center bg-overlay/70 p-4 backdrop-blur-xs">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-reference-title"
            className="w-full max-w-md rounded-xl border border-border bg-popover p-5 shadow-2xl"
          >
            <h2
              id="delete-reference-title"
              className="text-base font-semibold text-foreground"
            >
              Delete {pendingDelete.name}?
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              This removes the entity and its copied Reference Library media.
            </p>
            {deleteError ? (
              <p role="alert" className="mt-3 text-sm text-red-400">
                {deleteError}
              </p>
            ) : null}
            <div className="mt-5 flex justify-end gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setDeleteError(null);
                  setPendingDelete(null);
                }}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="destructive"
                onClick={async () => {
                  try {
                    await remove(pendingDelete.id);
                    if (selected?.id === pendingDelete.id) setSelected(null);
                    setDeleteError(null);
                    setPendingDelete(null);
                  } catch (reason) {
                    setDeleteError(
                      reason instanceof Error ? reason.message : String(reason),
                    );
                  }
                }}
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
