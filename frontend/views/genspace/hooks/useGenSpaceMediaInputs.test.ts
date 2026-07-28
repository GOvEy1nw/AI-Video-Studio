import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useGenSpaceMediaInputs } from "./useGenSpaceMediaInputs";

describe("useGenSpaceMediaInputs", () => {
  it("revokes only fallback object URLs it owns", async () => {
    const create = vi.fn(() => "blob:owned");
    const revoke = vi.fn();
    Object.defineProperties(URL, {
      createObjectURL: { configurable: true, value: create },
      revokeObjectURL: { configurable: true, value: revoke },
    });
    const { result, unmount } = renderHook(() => useGenSpaceMediaInputs());

    await act(async () => {
      expect(
        await result.current.resolveInputFileUrl(
          new File(["image"], "image.png", { type: "image/png" }),
        ),
      ).toBe("blob:owned");
      expect(
        await result.current.resolveInputFileUrl(
          new File(["image"], "stored.png", { type: "image/png" }),
          async () => "file:///C:/stored.png",
        ),
      ).toBe("file:///C:/stored.png");
    });
    unmount();

    expect(create).toHaveBeenCalledOnce();
    expect(revoke).toHaveBeenCalledOnce();
    expect(revoke).toHaveBeenCalledWith("blob:owned");
  });
});
