import { useCallback, useEffect, useMemo, useState } from "react";
import { backendFetch } from "../../../lib/backend";
import type { UpscaleMediaKind, UpscaleMethod, UpscaleMethodId } from "../../../types/upscale";

export function getUpscaleSelectionForKind(
  methods: UpscaleMethod[],
  requestedMethod: UpscaleMethodId,
  requestedScale: number,
  mediaKind: UpscaleMediaKind,
) {
  const compatible = methods.filter((item) => item.mediaKinds.includes(mediaKind));
  const selected = compatible.find((item) => item.id === requestedMethod) ?? compatible[0];
  return {
    methods: compatible,
    method: selected?.id ?? null,
    scale: selected?.scales.includes(requestedScale)
      ? requestedScale
      : selected?.scales[0] ?? null,
  };
}

export function useGenSpaceUpscaleState() {
  const [methods, setMethods] = useState<UpscaleMethod[]>([]);
  const [method, setMethod] = useState<UpscaleMethodId>("lanczos");
  const [scale, setScale] = useState(2);
  const [catalogError, setCatalogError] = useState<string | null>(null);
  const [isCatalogLoading, setCatalogLoading] = useState(true);
  const [catalogVersion, setCatalogVersion] = useState(0);

  useEffect(() => {
    let ignored = false;
    setCatalogError(null);
    setCatalogLoading(true);
    void backendFetch("/api/media-upscale/catalog")
      .then(async (response) => {
        if (!response.ok) throw new Error("Could not load upscale methods");
        return (await response.json()) as { methods?: UpscaleMethod[] };
      })
      .then(({ methods: next = [] }) => {
        if (!ignored) setMethods(next);
      })
      .catch(() => {
        if (!ignored) {
          setMethods([]);
          setCatalogError("Could not load upscale methods");
        }
      })
      .finally(() => {
        if (!ignored) setCatalogLoading(false);
      });
    return () => { ignored = true; };
  }, [catalogVersion]);

  const retryCatalog = useCallback(() => setCatalogVersion((version) => version + 1), []);

  const selectionForKind = useMemo(
    () => (mediaKind: UpscaleMediaKind) => getUpscaleSelectionForKind(methods, method, scale, mediaKind),
    [methods, method, scale],
  );

  return { method, setMethod, scale, setScale, selectionForKind, catalogError, isCatalogLoading, retryCatalog };
}
