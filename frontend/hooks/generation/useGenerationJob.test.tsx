import { StrictMode, type ReactNode } from "react";
import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { backendFetch } from "../../lib/backend";
import { useGenerationJob } from "./useGenerationJob";

vi.mock("../../lib/backend", () => ({ backendFetch: vi.fn() }));

const fetchMock = vi.mocked(backendFetch);

afterEach(() => {
  vi.useRealTimers();
  fetchMock.mockReset();
});

describe("useGenerationJob", () => {
  it("publishes a successful terminal result and stops polling", async () => {
    vi.useFakeTimers();
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ status: "complete" }), { status: 200 }),
    );
    const { result } = renderHook(() => useGenerationJob());
    await act(async () => {
      await result.current.runJob({
        endpoint: "/api/test",
        body: {},
        initialStatus: "Working",
        parseResponse: async () => ({
          value: "done",
          patch: { progress: 100, statusMessage: "Complete!" },
        }),
      });
    });
    expect(result.current.state.progress).toBe(100);
    expect(result.current.state.isGenerating).toBe(false);
    await vi.advanceTimersByTimeAsync(1000);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("aborts and clears polling on unmount", async () => {
    vi.useFakeTimers();
    fetchMock.mockImplementation(
      () => new Promise<Response>(() => undefined),
    );
    const { result, unmount } = renderHook(() => useGenerationJob());
    void result.current.runJob({
      endpoint: "/api/test",
      body: {},
      initialStatus: "Working",
      parseResponse: async () => ({
        value: null,
        patch: {},
      }),
    });
    unmount();
    await vi.advanceTimersByTimeAsync(1000);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("reports backend errors", async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ error: "Backend failed" }), {
        status: 500,
      }),
    );
    const { result } = renderHook(() => useGenerationJob());
    await act(async () => {
      await result.current.runJob({
        endpoint: "/api/test",
        body: {},
        initialStatus: "Working",
        parseResponse: async () => ({ value: null, patch: {} }),
      });
    });
    expect(result.current.state.error).toBe("Backend failed");
  });

  it("uses the shared cancellation route", async () => {
    fetchMock.mockImplementation((url) =>
      url === "/api/generate/cancel"
        ? Promise.resolve(new Response(null, { status: 200 }))
        : new Promise<Response>(() => undefined),
    );
    const { result, unmount } = renderHook(() => useGenerationJob());
    void result.current.runJob({
      endpoint: "/api/test",
      body: {},
      initialStatus: "Working",
      parseResponse: async () => ({ value: null, patch: {} }),
    });
    await act(async () => result.current.cancel());
    expect(fetchMock).toHaveBeenCalledWith("/api/generate/cancel", {
      method: "POST",
    });
    unmount();
  });

  it("ignores an in-flight poll after the terminal response", async () => {
    vi.useFakeTimers();
    let finishPost: (response: Response) => void = () => undefined;
    let finishPoll: (response: Response) => void = () => undefined;
    fetchMock.mockImplementation(
      (url) =>
        new Promise<Response>((resolve) => {
          if (url === "/api/generation/progress") finishPoll = resolve;
          else finishPost = resolve;
        }),
    );
    const { result } = renderHook(() => useGenerationJob());
    let job: Promise<string | null> = Promise.resolve(null);
    act(() => {
      job = result.current.runJob({
        endpoint: "/api/test",
        body: {},
        initialStatus: "Working",
        parseResponse: async () => ({
          value: "done",
          patch: { progress: 100, statusMessage: "Complete!" },
        }),
      });
    });
    await act(async () => vi.advanceTimersByTimeAsync(500));
    finishPost(new Response("{}", { status: 200 }));
    await act(async () => void (await job));
    finishPoll(
      new Response(
        JSON.stringify({
          status: "running",
          phase: "inference",
          progress: 10,
        }),
        { status: 200 },
      ),
    );
    await act(async () => Promise.resolve());
    expect(result.current.state.progress).toBe(100);
    expect(result.current.state.statusMessage).toBe("Complete!");
  });

  it("remains mounted after StrictMode effect replay", async () => {
    fetchMock.mockResolvedValueOnce(new Response("{}", { status: 200 }));
    const wrapper = ({ children }: { children: ReactNode }) => (
      <StrictMode>{children}</StrictMode>
    );
    const { result } = renderHook(() => useGenerationJob(), { wrapper });
    await act(async () => {
      await result.current.runJob({
        endpoint: "/api/test",
        body: {},
        initialStatus: "Working",
        parseResponse: async () => ({
          value: null,
          patch: { progress: 100, statusMessage: "Complete!" },
        }),
      });
    });
    expect(result.current.state.progress).toBe(100);
  });
});
