import { describe, expect, it } from "vitest";
import {
  applyEvent,
  createOverlay,
  orderedEvents,
  reduceEventPrefix,
} from "../../src/core/scenario/reducer";
import type { ScenarioEvent } from "../../src/core/scenario/events";
import type { VisualizerProject } from "../../src/core/project/schema";

const document: VisualizerProject = {
  schemaVersion: 1,
  id: "p",
  name: "Demo",
  nodes: [],
  edges: [],
  scenarios: [],
};
const events: ScenarioEvent[] = [
  {
    id: "late",
    atMs: 200,
    type: "node.status",
    nodeId: "n",
    status: "success",
  },
  {
    id: "first",
    atMs: 100,
    type: "node.status",
    nodeId: "n",
    status: "active",
  },
  { id: "second", atMs: 100, type: "metric.set", nodeId: "m", value: 3 },
  { id: "third", atMs: 100, type: "metric.set", nodeId: "m", value: 5 },
  {
    id: "log",
    atMs: 100,
    type: "log.append",
    message: "Started",
    level: "info",
  },
];

describe("pure scenario reducer", () => {
  it("starts with an empty overlay and changes only the targeted field", () => {
    const baseline = createOverlay(document);
    expect(baseline).toEqual({
      nodeStatus: {},
      edgeStatus: {},
      metrics: {},
      log: [],
    });
    const node = applyEvent(baseline, {
      id: "a",
      atMs: 0,
      type: "node.status",
      nodeId: "n",
      status: "active",
    });
    expect(node.nodeStatus).toEqual({ n: "active" });
    expect(node.edgeStatus).toEqual({});
    expect(baseline.nodeStatus).toEqual({});
    const edge = applyEvent(node, {
      id: "b",
      atMs: 0,
      type: "edge.status",
      edgeId: "e",
      status: "warning",
    });
    expect(edge.edgeStatus).toEqual({ e: "warning" });
    expect(edge.nodeStatus).toEqual({ n: "active" });
  });

  it("orders tied events in document order and replaces metrics", () => {
    expect(orderedEvents(events).map((event) => event.id)).toEqual([
      "first",
      "second",
      "third",
      "log",
      "late",
    ]);
    const overlay = reduceEventPrefix(document, events, 4);
    expect(overlay.nodeStatus.n).toBe("active");
    expect(overlay.metrics.m).toBe(5);
    expect(overlay.log.map((entry) => entry.id)).toEqual(["log"]);
  });

  it("replay is deterministic and does not mutate input events or baseline", () => {
    const frozen = Object.freeze(
      events.map((event) => Object.freeze({ ...event })),
    );
    const before = JSON.stringify(document);
    const first = reduceEventPrefix(document, frozen, frozen.length);
    const second = reduceEventPrefix(document, frozen, frozen.length);
    expect(first).toEqual(second);
    expect(first.nodeStatus.n).toBe("success");
    expect(JSON.stringify(document)).toBe(before);
    expect(reduceEventPrefix(document, frozen, 0)).toEqual(
      createOverlay(document),
    );
  });
});
