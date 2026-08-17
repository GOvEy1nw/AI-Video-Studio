import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { backendFetch } from "../../../lib/backend";
import type { UpscaleMethod } from "../../../types/upscale";
import { getUpscaleSelectionForKind, useGenSpaceUpscaleState } from "./useGenSpaceUpscaleState";

vi.mock("../../../lib/backend", () => ({ backendFetch: vi.fn() }));
const fetchMock = vi.mocked(backendFetch);

afterEach(() => fetchMock.mockReset());

describe("getUpscaleSelectionForKind", () => {
  it("uses the displayed compatible fallback for cross-kind submissions", () => {
    const methods: UpscaleMethod[] = [
      { id: "lanczos", label: "Lanczos", mediaKinds: ["image", "video"], scales: [1, 2] },
      { id: "ltx25", label: "LTX", mediaKinds: ["video"], scales: [2] },
    ];

    expect(getUpscaleSelectionForKind(methods, "ltx25", 2, "image")).toEqual({
      methods: [methods[0]], method: "lanczos", scale: 2,
    });
  });

  it("surfaces a catalog failure and retries", async () => {
    const methods: UpscaleMethod[] = [
      { id: "lanczos", label: "Lanczos", mediaKinds: ["image", "video"], scales: [2] },
    ];
    fetchMock
      .mockRejectedValueOnce(new Error("offline"))
      .mockResolvedValueOnce(new Response(JSON.stringify({ methods }), { status: 200 }));

    const { result } = renderHook(() => useGenSpaceUpscaleState());
    await waitFor(() => expect(result.current.catalogError).toBe("Could not load upscale methods"));
    expect(result.current.selectionForKind("image").method).toBeNull();

    act(() => result.current.retryCatalog());
    await waitFor(() => expect(result.current.selectionForKind("image").method).toBe("lanczos"));
    expect(result.current.catalogError).toBeNull();
  });
});
