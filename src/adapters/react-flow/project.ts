import type { Edge, Node } from "@xyflow/react";
import type { ModuleRegistry } from "../../core/modules/registry";
import type { PortDefinition } from "../../core/modules/contracts";
import type { VisualizerProject } from "../../core/project/schema";
import type { Overlay, VisualStatus } from "../../core/scenario/reducer";

export type ProjectionOverlay = Partial<
  Pick<Overlay, "nodeStatus" | "edgeStatus" | "metrics">
>;
export type ModuleNodeData = {
  title: string;
  label: string;
  category: string;
  moduleType: string;
  ports: readonly PortDefinition[];
  status: VisualStatus;
  metricValue: number | undefined;
  metricUnit: string | undefined;
};
export type ModuleFlowNode = Node<ModuleNodeData, "module">;
export type ModuleFlowEdge = Edge;

export function projectToFlow(
  project: VisualizerProject,
  registry: ModuleRegistry,
  selectedNodeIds: readonly string[] = [],
  selectedEdgeIds: readonly string[] = [],
  movementDraft: readonly {
    nodeId: string;
    position: { x: number; y: number };
  }[] = [],
  overlay: ProjectionOverlay = {},
): { nodes: ModuleFlowNode[]; edges: ModuleFlowEdge[] } {
  const draft = new Map(
    movementDraft.map((item) => [item.nodeId, item.position]),
  );
  return {
    nodes: project.nodes.map((node) => {
      const definition = registry.get(node.moduleType);
      const config =
        typeof node.config === "object" &&
        node.config !== null &&
        !Array.isArray(node.config)
          ? node.config
          : {};
      return {
        id: node.id,
        type: "module",
        position: draft.get(node.id) ?? node.position,
        selected: selectedNodeIds.includes(node.id),
        data: {
          title: definition?.title ?? node.moduleType,
          label: node.label,
          category: definition?.category ?? "Unknown",
          moduleType: node.moduleType,
          ports: definition?.ports ?? [],
          status: overlay.nodeStatus?.[node.id] ?? "idle",
          metricValue:
            overlay.metrics?.[node.id] ??
            (definition?.supportsMetric &&
            typeof config.initialValue === "number"
              ? config.initialValue
              : undefined),
          metricUnit: typeof config.unit === "string" ? config.unit : undefined,
        },
      };
    }),
    edges: project.edges.map((edge) => ({
      id: edge.id,
      source: edge.sourceNodeId,
      sourceHandle: edge.sourcePortId,
      target: edge.targetNodeId,
      targetHandle: edge.targetPortId,
      label: edge.label,
      selected: selectedEdgeIds.includes(edge.id),
      data: { status: overlay.edgeStatus?.[edge.id] ?? "idle" },
      style: {
        stroke: (
          {
            idle: "#677388",
            active: "#22d3ee",
            success: "#34d399",
            warning: "#fbbf24",
            error: "#fb7185",
          } as const
        )[overlay.edgeStatus?.[edge.id] ?? "idle"],
        strokeWidth: overlay.edgeStatus?.[edge.id] ? 2.5 : 1.5,
      },
      animated: overlay.edgeStatus?.[edge.id] === "active",
    })),
  };
}
