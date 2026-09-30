import { describe, expect, it } from "vitest";
import { applyGraphCommand } from "../../src/core/graph/commands";
import { createRegistry } from "../../src/core/modules/registry";
import { validateProject } from "../../src/core/project/validate";
import { builtInModules } from "../../src/modules";

const registry = createRegistry(builtInModules);
const node = (id: string) => ({
  id,
  moduleType: "basic.process",
  label: id,
  position: { x: 0, y: 0 },
  config: { description: "" },
});
const edge = (id: string, sourceNodeId: string, targetNodeId: string) => ({
  id,
  sourceNodeId,
  sourcePortId: "out",
  targetNodeId,
  targetPortId: "in",
});
const document = () => ({
  schemaVersion: 1 as const,
  id: "p",
  name: "Project",
  nodes: [node("a"), node("b")],
  edges: [edge("e", "a", "b")],
  scenarios: [
    {
      id: "s",
      name: "S",
      durationMs: 100,
      events: [
        {
          id: "es",
          type: "node.status" as const,
          atMs: 0,
          nodeId: "a",
          status: "active" as const,
        },
        {
          id: "ee",
          type: "edge.status" as const,
          atMs: 1,
          edgeId: "e",
          status: "active" as const,
        },
        {
          id: "el",
          type: "log.append" as const,
          atMs: 2,
          nodeId: "a",
          message: "A",
          level: "info" as const,
        },
        {
          id: "eu",
          type: "log.append" as const,
          atMs: 3,
          message: "Keep",
          level: "info" as const,
        },
      ],
    },
  ],
});

describe("graph commands", () => {
  it("adds and connects valid elements", () => {
    const added = applyGraphCommand(
      document(),
      { type: "node.add", node: node("c") },
      registry,
    );
    expect(added.ok).toBe(true);
    if (!added.ok) return;
    const connected = applyGraphCommand(
      added.value,
      { type: "edge.connect", edge: edge("e2", "b", "c") },
      registry,
    );
    expect(connected.ok).toBe(true);
    if (connected.ok) expect(connected.value.edges).toHaveLength(2);
  });

  it("rejects bad connections without changing input", () => {
    const before = document();
    const result = applyGraphCommand(
      before,
      { type: "edge.connect", edge: edge("bad", "missing", "a") },
      registry,
    );
    expect(result.ok).toBe(false);
    expect(before.edges).toHaveLength(1);
  });

  it("moves nodes together and renames a project", () => {
    const moved = applyGraphCommand(
      document(),
      {
        type: "nodes.move",
        positions: [
          { nodeId: "a", position: { x: 10, y: 20 } },
          { nodeId: "b", position: { x: 30, y: 40 } },
        ],
      },
      registry,
    );
    expect(moved.ok).toBe(true);
    if (!moved.ok) return;
    expect(moved.value.nodes.map((item) => item.position.x)).toEqual([10, 30]);
    const renamed = applyGraphCommand(
      moved.value,
      { type: "project.rename", name: "New title" },
      registry,
    );
    if (renamed.ok) expect(renamed.value.name).toBe("New title");
  });

  it("deletes incident edges and targeted events while retaining untargeted logs", () => {
    const result = applyGraphCommand(
      document(),
      { type: "selection.delete", nodeIds: ["a"], edgeIds: [] },
      registry,
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.nodes.map((item) => item.id)).toEqual(["b"]);
    expect(result.value.edges).toEqual([]);
    expect(result.value.scenarios[0]?.events.map((event) => event.id)).toEqual([
      "eu",
    ]);
  });

  it("duplicates selected nodes and their internal edge with injected IDs", () => {
    const result = applyGraphCommand(
      document(),
      {
        type: "selection.duplicate",
        nodeIds: ["a", "b"],
        newNodeIds: { a: "a2", b: "b2" },
        newEdgeIds: { e: "e2" },
      },
      registry,
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.nodes.slice(2).map((item) => item.position)).toEqual([
      { x: 32, y: 32 },
      { x: 32, y: 32 },
    ]);
    expect(result.value.edges[1]).toMatchObject({
      sourceNodeId: "a2",
      targetNodeId: "b2",
    });
    expect(result.value.scenarios[0]?.events).toHaveLength(4);
  });

  it("rejects invalid config and preserves frozen inputs", () => {
    const initial = document();
    Object.freeze(initial);
    const invalid = applyGraphCommand(
      initial,
      { type: "node.config", nodeId: "a", config: { description: 7 } },
      registry,
    );
    expect(invalid.ok).toBe(false);
    expect(validateProject(initial, registry).ok).toBe(true);
  });

  it("returns the same document for an empty selection and rejects duplicate IDs", () => {
    const initial = document();
    const noop = applyGraphCommand(
      initial,
      { type: "selection.delete", nodeIds: [], edgeIds: [] },
      registry,
    );
    if (noop.ok) expect(noop.value).toBe(initial);
    expect(
      applyGraphCommand(
        initial,
        { type: "node.add", node: node("a") },
        registry,
      ).ok,
    ).toBe(false);
    expect(
      applyGraphCommand(
        initial,
        {
          type: "selection.duplicate",
          nodeIds: ["a", "b"],
          newNodeIds: { a: "a2", b: "b2" },
          newEdgeIds: {},
        },
        registry,
      ).ok,
    ).toBe(false);
  });
});
