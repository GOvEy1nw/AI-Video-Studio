import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { ConnectionIndicator } from "./ModelStatusDropdown";

const backend = {
  status: { connected: true, modelsLoaded: true },
  processStatus: "alive" as "alive" | "restarting" | "dead",
  restart: vi.fn().mockResolvedValue(undefined),
};

vi.mock("../hooks/use-backend", () => ({ useBackend: () => backend }));

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.clearAllMocks();
  backend.status.connected = true;
  backend.status.modelsLoaded = true;
  backend.processStatus = "alive";
});

it("restarts the ready inference engine from its status button", async () => {
  render(<ConnectionIndicator />);

  const button = screen.getByRole("button", {
    name: "Inference Engine Ready. Restart Inference Engine",
  });
  expect(button.getAttribute("title")).toBe("Inference Engine Ready");

  fireEvent.click(button);

  await waitFor(() => expect(backend.restart).toHaveBeenCalledOnce());
});

it("uses the shared restarting lifecycle state as its busy state", () => {
  backend.processStatus = "restarting";
  render(<ConnectionIndicator />);

  const button = screen.getByRole("button", {
    name: "Launching Inference Engine 0/2. Restart Inference Engine",
  });
  expect(button.hasAttribute("disabled")).toBe(true);
  expect(button.getAttribute("aria-busy")).toBe("true");
});

it("returns to connecting when the bridge arrives after the timeout", () => {
  vi.useFakeTimers();
  backend.status.connected = false;
  backend.status.modelsLoaded = false;
  const { rerender } = render(<ConnectionIndicator />);

  act(() => vi.advanceTimersByTime(60000));
  expect(screen.getByTitle("Inference Engine Disconnected")).toBeTruthy();

  backend.status.connected = true;
  rerender(<ConnectionIndicator />);
  expect(screen.getByTitle("Launching Inference Engine 1/2")).toBeTruthy();
});
