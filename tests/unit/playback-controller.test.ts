import { describe, expect, it, vi } from "vitest";
import {
  createPlaybackController,
  type PlaybackClock,
} from "../../src/core/scenario/controller";
import type {
  Scenario,
  VisualizerProject,
} from "../../src/core/project/schema";

class ManualClock implements PlaybackClock {
  time = 0;
  nextId = 1;
  frames = new Map<number, () => void>();
  cancelled: (() => void)[] = [];
  now = () => this.time;
  requestFrame = (callback: () => void) => {
    const id = this.nextId++;
    this.frames.set(id, callback);
    return id;
  };
  cancelFrame = (id: number) => {
    const callback = this.frames.get(id);
    if (callback) this.cancelled.push(callback);
    this.frames.delete(id);
  };
  advance(ms: number) {
    this.time += ms;
    const callbacks = [...this.frames.values()];
    this.frames.clear();
    callbacks.forEach((callback) => callback());
  }
}
const document: VisualizerProject = {
  schemaVersion: 1,
  id: "p",
  name: "Demo",
  nodes: [],
  edges: [],
  scenarios: [],
};
const scenario: Scenario = {
  id: "s",
  name: "Run",
  durationMs: 3000,
  events: [
    {
      id: "zero",
      atMs: 0,
      type: "log.append",
      message: "Started",
      level: "info",
    },
    { id: "a", atMs: 1000, type: "node.status", nodeId: "n", status: "active" },
    {
      id: "b",
      atMs: 1000,
      type: "log.append",
      message: "Active",
      level: "info",
    },
    {
      id: "c",
      atMs: 3000,
      type: "node.status",
      nodeId: "n",
      status: "success",
    },
  ],
};

describe("playback controller", () => {
  it("fires timestamp-zero events on play and schedules one frame idempotently", () => {
    const clock = new ManualClock();
    const controller = createPlaybackController(document, scenario, clock);
    expect(controller.getSnapshot()).toMatchObject({
      status: "ready",
      elapsedMs: 0,
      cursor: 0,
    });
    controller.play();
    controller.play();
    expect(
      controller.getSnapshot().overlay.log.map((entry) => entry.id),
    ).toEqual(["zero"]);
    expect(controller.getSnapshot().cursor).toBe(1);
    expect(clock.frames.size).toBe(1);
  });

  it("pause and resume exclude paused wall time", () => {
    const clock = new ManualClock();
    const controller = createPlaybackController(document, scenario, clock);
    controller.play();
    clock.advance(500);
    controller.pause();
    expect(controller.getSnapshot()).toMatchObject({
      status: "paused",
      elapsedMs: 500,
    });
    clock.advance(2000);
    expect(controller.getSnapshot().elapsedMs).toBe(500);
    controller.play();
    clock.advance(500);
    expect(controller.getSnapshot().elapsedMs).toBe(1000);
    expect(controller.getSnapshot().overlay.nodeStatus.n).toBe("active");
  });

  it("step applies one entire timestamp group; restart resets overlay", () => {
    const clock = new ManualClock();
    const controller = createPlaybackController(document, scenario, clock);
    controller.step();
    expect(controller.getSnapshot()).toMatchObject({
      status: "paused",
      elapsedMs: 0,
      cursor: 1,
    });
    controller.step();
    expect(controller.getSnapshot()).toMatchObject({
      status: "paused",
      elapsedMs: 1000,
      cursor: 3,
    });
    expect(
      controller.getSnapshot().overlay.log.map((entry) => entry.id),
    ).toEqual(["zero", "b"]);
    controller.restart();
    expect(controller.getSnapshot()).toMatchObject({
      status: "ready",
      elapsedMs: 0,
      cursor: 0,
    });
    expect(controller.getSnapshot().overlay.log).toEqual([]);
  });

  it("catches all due events after a long frame and completes once", () => {
    const clock = new ManualClock();
    const controller = createPlaybackController(document, scenario, clock);
    controller.play();
    clock.advance(5000);
    expect(controller.getSnapshot()).toMatchObject({
      status: "completed",
      elapsedMs: 3000,
      cursor: 4,
    });
    expect(controller.getSnapshot().overlay.nodeStatus.n).toBe("success");
    controller.play();
    clock.advance(5000);
    expect(controller.getSnapshot().overlay.log).toHaveLength(2);
    expect(clock.frames.size).toBe(0);
  });

  it("zero-duration and empty scenarios complete; final step completes", () => {
    const clock = new ManualClock();
    const zero = createPlaybackController(
      document,
      { id: "z", name: "Zero", durationMs: 0, events: [] },
      clock,
    );
    zero.play();
    expect(zero.getSnapshot().status).toBe("completed");
    const controller = createPlaybackController(document, scenario, clock);
    controller.step();
    controller.step();
    controller.step();
    expect(controller.getSnapshot().status).toBe("completed");
  });

  it("dispose cancels frames and stale callbacks cannot update an old run", () => {
    const clock = new ManualClock();
    const old = createPlaybackController(document, scenario, clock);
    old.play();
    old.dispose();
    const newer = createPlaybackController(document, scenario, clock);
    newer.play();
    clock.cancelled.forEach((callback) => callback());
    expect(old.getSnapshot().cursor).toBe(1);
    expect(newer.getSnapshot().cursor).toBe(1);
    clock.advance(1000);
    expect(newer.getSnapshot().cursor).toBe(3);
  });

  it("restart invalidates an already queued callback and subscribers can detach", () => {
    const clock = new ManualClock();
    const controller = createPlaybackController(document, scenario, clock);
    const listener = vi.fn();
    const unsubscribe = controller.subscribe(listener);
    controller.play();
    const calls = listener.mock.calls.length;
    controller.restart();
    expect(listener.mock.calls.length).toBeGreaterThan(calls);
    clock.cancelled.forEach((callback) => callback());
    expect(controller.getSnapshot()).toMatchObject({
      status: "ready",
      cursor: 0,
    });
    unsubscribe();
    const afterDetach = listener.mock.calls.length;
    controller.play();
    expect(listener).toHaveBeenCalledTimes(afterDetach);
  });

  it("stepping an empty scenario moves to its duration and completes", () => {
    const clock = new ManualClock();
    const empty = createPlaybackController(
      document,
      { id: "e", name: "Empty", durationMs: 500, events: [] },
      clock,
    );
    empty.step();
    expect(empty.getSnapshot()).toMatchObject({
      status: "completed",
      elapsedMs: 500,
      cursor: 0,
    });
  });
});
