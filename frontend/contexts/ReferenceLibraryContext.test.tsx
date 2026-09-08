import { act, renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ReferenceLibraryProvider, useReferenceLibrary } from "./ReferenceLibraryContext";

const discardStagedReferenceImage = vi.fn().mockResolvedValue(undefined);

describe("ReferenceLibraryProvider generated drafts", () => {
  beforeEach(() => {
    discardStagedReferenceImage.mockClear();
    Object.assign(window, {
      electronAPI: {
        listReferenceEntities: vi.fn().mockResolvedValue([]),
        discardStagedReferenceImage,
      },
    });
  });

  it("cleans replaced, cleared, and late-completing staged images", async () => {
    const wrapper = ({ children }: { children: ReactNode }) => (
      <ReferenceLibraryProvider>{children}</ReferenceLibraryProvider>
    );
    const { result } = renderHook(() => useReferenceLibrary(), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));

    const first = { path: "C:\\staging\\first.png", url: "file:///C:/staging/first.png", fileName: "first.png" };
    const second = { path: "C:\\staging\\second.png", url: "file:///C:/staging/second.png", fileName: "second.png" };
    const late = { path: "C:\\staging\\late.png", url: "file:///C:/staging/late.png", fileName: "late.png" };
    await act(() => result.current.publishGeneratedImage("draft-1", first));
    await act(() => result.current.publishGeneratedImage("draft-1", second));
    expect(discardStagedReferenceImage).toHaveBeenCalledWith(first.path);

    await act(() => result.current.clearGeneratedImage("draft-1"));
    expect(discardStagedReferenceImage).toHaveBeenCalledWith(second.path);
    await act(() => result.current.publishGeneratedImage("draft-1", late));
    expect(discardStagedReferenceImage).toHaveBeenCalledWith(late.path);
    expect(result.current.generatedImageForDraft("draft-1")).toBeUndefined();
  });

  it("serializes clear behind an in-flight replacement cleanup", async () => {
    let releaseFirstCleanup!: () => void;
    const firstCleanup = new Promise<void>((resolve) => { releaseFirstCleanup = resolve; });
    discardStagedReferenceImage.mockImplementationOnce(() => firstCleanup);
    const wrapper = ({ children }: { children: ReactNode }) => (
      <ReferenceLibraryProvider>{children}</ReferenceLibraryProvider>
    );
    const { result } = renderHook(() => useReferenceLibrary(), { wrapper });
    await waitFor(() => expect(result.current.loading).toBe(false));

    const first = { path: "C:\\staging\\race-first.png", url: "file:///C:/staging/race-first.png", fileName: "race-first.png" };
    const replacement = { path: "C:\\staging\\race-replacement.png", url: "file:///C:/staging/race-replacement.png", fileName: "race-replacement.png" };
    await act(() => result.current.publishGeneratedImage("race-draft", first));
    const replacing = result.current.publishGeneratedImage("race-draft", replacement);
    const clearing = result.current.clearGeneratedImage("race-draft");
    releaseFirstCleanup();
    await act(async () => { await Promise.all([replacing, clearing]); });

    expect(discardStagedReferenceImage).toHaveBeenCalledWith(first.path);
    expect(discardStagedReferenceImage).toHaveBeenCalledWith(replacement.path);
    expect(result.current.generatedImageForDraft("race-draft")).toBeUndefined();
  });
});
