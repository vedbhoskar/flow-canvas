import type { PlaybackClock } from "../../core/scenario/controller";

export function createBrowserClock(): PlaybackClock {
  return {
    now: () => performance.now(),
    requestFrame: (callback) => window.requestAnimationFrame(callback),
    cancelFrame: (id) => window.cancelAnimationFrame(id),
  };
}
