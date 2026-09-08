import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { ReferenceEntity, SaveReferenceEntityInput, StagedReferenceImage } from "../../shared/reference-library";

type ReferenceLibraryValue = {
  entities: readonly ReferenceEntity[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  save: (input: SaveReferenceEntityInput) => Promise<ReferenceEntity>;
  remove: (id: string) => Promise<void>;
  generatedImageForDraft: (draftId: string) => StagedReferenceImage | undefined;
  publishGeneratedImage: (draftId: string, image: StagedReferenceImage) => Promise<void>;
  clearGeneratedImage: (draftId: string) => Promise<void>;
};

const ReferenceLibraryContext = createContext<ReferenceLibraryValue | null>(null);

export function ReferenceLibraryProvider({ children }: { children: ReactNode }) {
  const [entities, setEntities] = useState<readonly ReferenceEntity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [generatedImages, setGeneratedImages] = useState<Readonly<Record<string, StagedReferenceImage>>>({});
  const generatedImagesRef = useRef<Readonly<Record<string, StagedReferenceImage>>>({});
  const clearedDraftIds = useRef(new Set<string>());
  const draftMutations = useRef(new Map<string, Promise<void>>());
  const mutateDraft = useCallback(async (draftId: string, operation: () => Promise<void>) => {
    const previous = draftMutations.current.get(draftId) ?? Promise.resolve();
    const next = previous.catch(() => undefined).then(operation);
    draftMutations.current.set(draftId, next);
    try {
      await next;
    } finally {
      if (draftMutations.current.get(draftId) === next) draftMutations.current.delete(draftId);
    }
  }, []);
  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      setEntities(await window.electronAPI.listReferenceEntities());
      setError(null);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : String(reason));
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => { void refresh(); }, [refresh]);
  const save = useCallback(async (input: SaveReferenceEntityInput) => {
    const entity = await window.electronAPI.saveReferenceEntity(input);
    setEntities((current) => {
      const index = current.findIndex((item) => item.id === entity.id);
      return index < 0 ? [...current, entity] : current.map((item) => item.id === entity.id ? entity : item);
    });
    setError(null);
    return entity;
  }, []);
  const remove = useCallback(async (id: string) => {
    await window.electronAPI.deleteReferenceEntity(id);
    setEntities((current) => current.filter((item) => item.id !== id));
    setError(null);
  }, []);
  const generatedImageForDraft = useCallback((draftId: string) => generatedImages[draftId], [generatedImages]);
  const publishGeneratedImage = useCallback((draftId: string, image: StagedReferenceImage) => mutateDraft(draftId, async () => {
    if (clearedDraftIds.current.has(draftId)) {
      await window.electronAPI.discardStagedReferenceImage(image.path);
      return;
    }
    const previous = generatedImagesRef.current[draftId];
    if (previous?.path === image.path) return;
    if (previous) await window.electronAPI.discardStagedReferenceImage(previous.path);
    const next = { ...generatedImagesRef.current, [draftId]: image };
    generatedImagesRef.current = next;
    setGeneratedImages(next);
  }), [mutateDraft]);
  const clearGeneratedImage = useCallback((draftId: string) => mutateDraft(draftId, async () => {
    clearedDraftIds.current.add(draftId);
    const previous = generatedImagesRef.current[draftId];
    if (!previous) return;
    await window.electronAPI.discardStagedReferenceImage(previous.path);
    const { [draftId]: _discarded, ...rest } = generatedImagesRef.current;
    generatedImagesRef.current = rest;
    setGeneratedImages(rest);
  }), [mutateDraft]);
  const value = useMemo(() => ({ entities, loading, error, refresh, save, remove, generatedImageForDraft, publishGeneratedImage, clearGeneratedImage }), [clearGeneratedImage, entities, error, generatedImageForDraft, loading, publishGeneratedImage, refresh, remove, save]);
  return <ReferenceLibraryContext.Provider value={value}>{children}</ReferenceLibraryContext.Provider>;
}

export function useReferenceLibrary(): ReferenceLibraryValue {
  const context = useContext(ReferenceLibraryContext);
  if (!context) throw new Error("useReferenceLibrary must be used within ReferenceLibraryProvider");
  return context;
}
