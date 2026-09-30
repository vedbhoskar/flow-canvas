import type { ModuleRegistry } from "../modules/registry";
import type {
  Result,
  VisualizerProject,
  VisualizerNode,
  VisualizerEdge,
} from "../project/schema";
import { validateProject } from "../project/validate";

export type GraphCommand =
  | { type: "node.add"; node: VisualizerNode }
  | { type: "node.rename"; nodeId: string; label: string }
  | { type: "node.config"; nodeId: string; config: unknown }
  | {
      type: "nodes.move";
      positions: { nodeId: string; position: { x: number; y: number } }[];
    }
  | { type: "edge.connect"; edge: VisualizerEdge }
  | { type: "selection.delete"; nodeIds: string[]; edgeIds: string[] }
  | {
      type: "selection.duplicate";
      nodeIds: string[];
      newNodeIds: Record<string, string>;
      newEdgeIds: Record<string, string>;
    }
  | { type: "project.rename"; name: string };

function error(message: string): Result<VisualizerProject> {
  return {
    ok: false,
    errors: [{ code: "invalid_command", path: "", message }],
  };
}

export function applyGraphCommand(
  document: VisualizerProject,
  command: GraphCommand,
  registry: ModuleRegistry,
): Result<VisualizerProject> {
  const baseline = validateProject(document, registry);
  if (!baseline.ok) return baseline;
  let candidate: unknown = document;
  switch (command.type) {
    case "node.add":
      candidate = { ...document, nodes: [...document.nodes, command.node] };
      break;
    case "node.rename":
      if (!document.nodes.some((node) => node.id === command.nodeId))
        return error("Node does not exist");
      candidate = {
        ...document,
        nodes: document.nodes.map((node) =>
          node.id === command.nodeId ? { ...node, label: command.label } : node,
        ),
      };
      break;
    case "node.config":
      if (!document.nodes.some((node) => node.id === command.nodeId))
        return error("Node does not exist");
      candidate = {
        ...document,
        nodes: document.nodes.map((node) =>
          node.id === command.nodeId
            ? { ...node, config: command.config }
            : node,
        ),
      };
      break;
    case "nodes.move": {
      const positions = new Map(
        command.positions.map((item) => [item.nodeId, item.position]),
      );
      if (
        [...positions.keys()].some(
          (id) => !document.nodes.some((node) => node.id === id),
        )
      )
        return error("Node does not exist");
      candidate = {
        ...document,
        nodes: document.nodes.map((node) =>
          positions.has(node.id)
            ? { ...node, position: positions.get(node.id) }
            : node,
        ),
      };
      break;
    }
    case "edge.connect":
      candidate = { ...document, edges: [...document.edges, command.edge] };
      break;
    case "selection.delete": {
      const nodeIds = new Set(command.nodeIds);
      const requestedEdges = new Set(command.edgeIds);
      const edges = document.edges.filter(
        (edge) =>
          !requestedEdges.has(edge.id) &&
          !nodeIds.has(edge.sourceNodeId) &&
          !nodeIds.has(edge.targetNodeId),
      );
      const edgeIds = new Set(edges.map((edge) => edge.id));
      candidate = {
        ...document,
        nodes: document.nodes.filter((node) => !nodeIds.has(node.id)),
        edges,
        scenarios: document.scenarios.map((scenario) => ({
          ...scenario,
          events: scenario.events.filter((event) => {
            if (event.type === "edge.status") return edgeIds.has(event.edgeId);
            if (event.type === "node.status" || event.type === "metric.set")
              return !nodeIds.has(event.nodeId);
            return !event.nodeId || !nodeIds.has(event.nodeId);
          }),
        })),
      };
      break;
    }
    case "selection.duplicate": {
      const selected = new Set(command.nodeIds);
      if (
        [...selected].some(
          (id) => !document.nodes.some((node) => node.id === id),
        )
      )
        return error("Node does not exist");
      const originals = document.nodes.filter((node) => selected.has(node.id));
      const internalEdges = document.edges.filter(
        (edge) =>
          selected.has(edge.sourceNodeId) && selected.has(edge.targetNodeId),
      );
      if (
        originals.some((node) => !command.newNodeIds[node.id]) ||
        internalEdges.some((edge) => !command.newEdgeIds[edge.id])
      )
        return error("Missing injected duplicate ID");
      candidate = {
        ...document,
        nodes: [
          ...document.nodes,
          ...originals.map((node) => ({
            ...node,
            id: command.newNodeIds[node.id],
            position: { x: node.position.x + 32, y: node.position.y + 32 },
            config: structuredClone(node.config),
          })),
        ],
        edges: [
          ...document.edges,
          ...internalEdges.map((edge) => ({
            ...edge,
            id: command.newEdgeIds[edge.id],
            sourceNodeId: command.newNodeIds[edge.sourceNodeId],
            targetNodeId: command.newNodeIds[edge.targetNodeId],
          })),
        ],
      };
      break;
    }
    case "project.rename":
      candidate = { ...document, name: command.name };
      break;
  }
  if (JSON.stringify(candidate) === JSON.stringify(document))
    return { ok: true, value: document };
  return validateProject(candidate, registry);
}
