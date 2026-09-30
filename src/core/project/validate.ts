import type { ModuleRegistry } from "../modules/registry";
import {
  parseProjectShape,
  type Result,
  type ValidationIssue,
  type VisualizerProject,
} from "./schema";

export function validateProject(
  input: unknown,
  registry: ModuleRegistry,
): Result<VisualizerProject> {
  const parsed = parseProjectShape(input);
  if (!parsed.ok) return parsed;
  const project = parsed.value;
  const errors: ValidationIssue[] = [];
  const nodes = new Map(project.nodes.map((node) => [node.id, node]));
  const edges = new Set(project.edges.map((edge) => edge.id));
  project.nodes.forEach((node, index) => {
    const definition = registry.get(node.moduleType);
    if (!definition)
      errors.push({
        code: "unknown_module",
        path: `nodes.${index}.moduleType`,
        message: `Unknown module: ${node.moduleType}`,
      });
    else if (!definition.configSchema.safeParse(node.config).success)
      errors.push({
        code: "invalid_config",
        path: `nodes.${index}.config`,
        message: `Invalid configuration for ${node.moduleType}`,
      });
  });
  const endpoints = new Set<string>();
  project.edges.forEach((edge, index) => {
    const source = nodes.get(edge.sourceNodeId);
    const target = nodes.get(edge.targetNodeId);
    const sourcePort =
      source &&
      registry
        .get(source.moduleType)
        ?.ports.find((port) => port.id === edge.sourcePortId);
    const targetPort =
      target &&
      registry
        .get(target.moduleType)
        ?.ports.find((port) => port.id === edge.targetPortId);
    const path = `edges.${index}`;
    if (!source || !target)
      errors.push({
        code: "missing_node",
        path,
        message: "Connection references a missing node",
      });
    if (source && target && source.id === target.id)
      errors.push({
        code: "self_link",
        path,
        message: "A node cannot connect to itself",
      });
    if (source && !sourcePort)
      errors.push({
        code: "missing_port",
        path: `${path}.sourcePortId`,
        message: "Source port does not exist",
      });
    if (target && !targetPort)
      errors.push({
        code: "missing_port",
        path: `${path}.targetPortId`,
        message: "Target port does not exist",
      });
    if (
      sourcePort &&
      targetPort &&
      (sourcePort.direction !== "output" ||
        targetPort.direction !== "input" ||
        (sourcePort.dataType !== "any" &&
          targetPort.dataType !== "any" &&
          sourcePort.dataType !== targetPort.dataType))
    )
      errors.push({
        code: "incompatible_ports",
        path,
        message: "Connection ports are incompatible",
      });
    const key = [
      edge.sourceNodeId,
      edge.sourcePortId,
      edge.targetNodeId,
      edge.targetPortId,
    ].join("\u0000");
    if (endpoints.has(key))
      errors.push({
        code: "duplicate_connection",
        path,
        message: "Duplicate connection",
      });
    endpoints.add(key);
  });
  project.scenarios.forEach((scenario, scenarioIndex) => {
    scenario.events.forEach((event, eventIndex) => {
      const path = `scenarios.${scenarioIndex}.events.${eventIndex}`;
      if (event.type === "edge.status" && !edges.has(event.edgeId))
        errors.push({
          code: "missing_edge",
          path: `${path}.edgeId`,
          message: "Event references a missing edge",
        });
      if (
        event.type === "node.status" ||
        event.type === "metric.set" ||
        (event.type === "log.append" && event.nodeId)
      ) {
        const nodeId = event.nodeId;
        const node = nodeId ? nodes.get(nodeId) : undefined;
        if (!node)
          errors.push({
            code: "missing_node",
            path: `${path}.nodeId`,
            message: "Event references a missing node",
          });
        else if (
          event.type === "metric.set" &&
          !registry.get(node.moduleType)?.supportsMetric
        )
          errors.push({
            code: "not_metric",
            path: `${path}.nodeId`,
            message: "Metric event requires a metric-capable module",
          });
      }
    });
  });
  return errors.length ? { ok: false, errors } : { ok: true, value: project };
}
