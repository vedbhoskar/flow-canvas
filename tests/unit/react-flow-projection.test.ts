import { describe, expect, it } from "vitest";
import { projectToFlow } from "../../src/adapters/react-flow/project";
import { createRegistry } from "../../src/core/modules/registry";
import { builtInModules } from "../../src/modules";
import type { VisualizerProject } from "../../src/core/project/schema";

const registry = createRegistry(builtInModules);
const document: VisualizerProject = {
  schemaVersion: 1,
  id: "p",
  name: "Example",
  nodes: [
    {
      id: "a",
      moduleType: "basic.process",
      label: "A",
      position: { x: 10, y: 20 },
      config: { description: "" },
    },
    {
      id: "b",
      moduleType: "basic.process",
      label: "B",
      position: { x: 200, y: 20 },
      config: { description: "" },
    },
  ],
  edges: [
    {
      id: "e",
      sourceNodeId: "a",
      sourcePortId: "out",
      targetNodeId: "b",
      targetPortId: "in",
    },
  ],
  scenarios: [],
};

describe("React Flow projection", () => {
  it("preserves document identities, positions and port references", () => {
    const view = projectToFlow(document, registry);
    expect(view.nodes.map((node) => [node.id, node.position])).toEqual([
      ["a", { x: 10, y: 20 }],
      ["b", { x: 200, y: 20 }],
    ]);
    expect(view.nodes[0]?.data.ports.map((port) => port.id)).toEqual([
      "in",
      "out",
    ]);
    expect(view.edges[0]).toMatchObject({
      id: "e",
      source: "a",
      sourceHandle: "out",
      target: "b",
      targetHandle: "in",
    });
  });

  it("layers selection, drag drafts and runtime status without changing the document", () => {
    const baseline = JSON.stringify(document);
    const view = projectToFlow(
      document,
      registry,
      ["a"],
      ["e"],
      [{ nodeId: "a", position: { x: 50, y: 70 } }],
      { nodeStatus: { a: "active" }, edgeStatus: { e: "success" } },
    );
    expect(view.nodes[0]).toMatchObject({
      selected: true,
      position: { x: 50, y: 70 },
      data: { status: "active" },
    });
    expect(view.edges[0]).toMatchObject({
      selected: true,
      data: { status: "success" },
    });
    expect(JSON.stringify(document)).toBe(baseline);
    expect(document.nodes[0]).not.toHaveProperty("data");
  });
});
