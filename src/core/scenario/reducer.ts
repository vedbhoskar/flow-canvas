import type { VisualizerProject } from "../project/schema";
import type { ScenarioEvent } from "./events";

export type VisualStatus = "idle" | "active" | "success" | "warning" | "error";
export type LogEntry = Extract<ScenarioEvent, { type: "log.append" }>;
export type Overlay = {
  nodeStatus: Record<string, VisualStatus>;
  edgeStatus: Record<string, VisualStatus>;
  metrics: Record<string, number>;
  log: LogEntry[];
};

export function createOverlay(document: VisualizerProject): Overlay {
  if (document.schemaVersion !== 1)
    throw new Error("Unsupported project version");
  return { nodeStatus: {}, edgeStatus: {}, metrics: {}, log: [] };
}

export function applyEvent(overlay: Overlay, event: ScenarioEvent): Overlay {
  switch (event.type) {
    case "node.status":
      return {
        ...overlay,
        nodeStatus: { ...overlay.nodeStatus, [event.nodeId]: event.status },
      };
    case "edge.status":
      return {
        ...overlay,
        edgeStatus: { ...overlay.edgeStatus, [event.edgeId]: event.status },
      };
    case "metric.set":
      return {
        ...overlay,
        metrics: { ...overlay.metrics, [event.nodeId]: event.value },
      };
    case "log.append":
      return { ...overlay, log: [...overlay.log, { ...event }] };
  }
}

export function orderedEvents(
  events: readonly ScenarioEvent[],
): ScenarioEvent[] {
  return events
    .map((event, index) => ({ event, index }))
    .sort(
      (left, right) =>
        left.event.atMs - right.event.atMs || left.index - right.index,
    )
    .map(({ event }) => event);
}

export function reduceEventPrefix(
  document: VisualizerProject,
  events: readonly ScenarioEvent[],
  count: number,
): Overlay {
  return orderedEvents(events)
    .slice(0, Math.max(0, count))
    .reduce(applyEvent, createOverlay(document));
}
