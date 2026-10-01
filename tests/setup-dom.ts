import "@testing-library/jest-dom/vitest";
import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

// jsdom has no layout observers; browser acceptance tests exercise real sizing.
if (typeof window !== "undefined" && typeof ResizeObserver === "undefined") {
  globalThis.ResizeObserver = class implements ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}

afterEach(() => cleanup());
