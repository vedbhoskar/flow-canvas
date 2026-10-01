import type { Scenario, VisualizerProject } from "../project/schema";
import {
  applyEvent,
  createOverlay,
  orderedEvents,
  type Overlay,
} from "./reducer";

export type PlaybackClock = {
  now(): number;
  requestFrame(callback: () => void): number;
  cancelFrame(id: number): void;
};
export type PlaybackSnapshot = {
  status: "ready" | "playing" | "paused" | "completed";
  elapsedMs: number;
  cursor: number;
  overlay: Overlay;
};
export type PlaybackController = {
  play(): void;
  pause(): void;
  step(): void;
  restart(): void;
  dispose(): void;
  getSnapshot(): PlaybackSnapshot;
  subscribe(listener: () => void): () => void;
};

export function createPlaybackController(
  document: VisualizerProject,
  scenario: Scenario,
  clock: PlaybackClock,
): PlaybackController {
  const events = orderedEvents(scenario.events);
  let snapshot: PlaybackSnapshot = {
    status: "ready",
    elapsedMs: 0,
    cursor: 0,
    overlay: createOverlay(document),
  };
  let startedAt = 0;
  let frameId: number | null = null;
  let generation = 0;
  let disposed = false;
  const listeners = new Set<() => void>();

  function publish(next: PlaybackSnapshot) {
    if (
      next.status === snapshot.status &&
      next.elapsedMs === snapshot.elapsedMs &&
      next.cursor === snapshot.cursor &&
      next.overlay === snapshot.overlay
    )
      return;
    snapshot = next;
    for (const listener of listeners) listener();
  }

  function invalidateFrame() {
    generation += 1;
    if (frameId !== null) clock.cancelFrame(frameId);
    frameId = null;
  }

  function advance(elapsedMs: number, status: PlaybackSnapshot["status"]) {
    const elapsed = Math.min(scenario.durationMs, Math.max(0, elapsedMs));
    let cursor = snapshot.cursor;
    let overlay = snapshot.overlay;
    while (cursor < events.length && events[cursor]!.atMs <= elapsed) {
      overlay = applyEvent(overlay, events[cursor]!);
      cursor += 1;
    }
    const finalStatus = elapsed >= scenario.durationMs ? "completed" : status;
    publish({ status: finalStatus, elapsedMs: elapsed, cursor, overlay });
    if (finalStatus === "completed") invalidateFrame();
  }

  function requestNext() {
    if (disposed || snapshot.status !== "playing" || frameId !== null) return;
    const currentGeneration = generation;
    frameId = clock.requestFrame(() => {
      if (disposed || generation !== currentGeneration) return;
      frameId = null;
      advance(clock.now() - startedAt, "playing");
      requestNext();
    });
  }

  function pause() {
    if (disposed || snapshot.status !== "playing") return;
    invalidateFrame();
    advance(clock.now() - startedAt, "paused");
  }

  return {
    play() {
      if (
        disposed ||
        snapshot.status === "playing" ||
        snapshot.status === "completed"
      )
        return;
      startedAt = clock.now() - snapshot.elapsedMs;
      advance(snapshot.elapsedMs, "playing");
      requestNext();
    },
    pause,
    step() {
      if (disposed || snapshot.status === "completed") return;
      if (snapshot.status === "playing") pause();
      if (
        snapshot.elapsedMs >= scenario.durationMs &&
        snapshot.status !== "ready"
      )
        return;
      const next = events[snapshot.cursor];
      if (!next) advance(scenario.durationMs, "completed");
      else advance(Math.max(snapshot.elapsedMs, next.atMs), "paused");
    },
    restart() {
      if (disposed) return;
      invalidateFrame();
      publish({
        status: "ready",
        elapsedMs: 0,
        cursor: 0,
        overlay: createOverlay(document),
      });
    },
    dispose() {
      if (disposed) return;
      disposed = true;
      invalidateFrame();
      listeners.clear();
    },
    getSnapshot: () => snapshot,
    subscribe(listener) {
      if (disposed) return () => {};
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}
