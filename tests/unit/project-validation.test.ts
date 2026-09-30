import { describe, expect, it } from "vitest";
import { createRegistry } from "../../src/core/modules/registry";
import { validateProject } from "../../src/core/project/validate";
import { builtInModules } from "../../src/modules";
import { defineModule } from "../../src/core/modules/contracts";
import { z } from "zod";

const registry = createRegistry(builtInModules);
const node = (id: string, moduleType = "basic.process") => ({
  id,
  moduleType,
  label: id,
  position: { x: 0, y: 0 },
  config:
    moduleType === "basic.process"
      ? { description: "" }
      : moduleType === "utility.metric"
        ? { initialValue: 0, unit: "units" }
        : { text: "Note" },
});
const edge = (
  sourceNodeId: string,
  targetNodeId: string,
  sourcePortId = "out",
  targetPortId = "in",
) => ({ id: "e", sourceNodeId, sourcePortId, targetNodeId, targetPortId });
const project = (
  nodes: Array<{
    id: string;
    moduleType: string;
    label: string;
    position: { x: number; y: number };
    config: unknown;
  }>,
  edges: ReturnType<typeof edge>[] = [],
  events: object[] = [],
) => ({
  schemaVersion: 1,
  id: "p",
  name: "Project",
  nodes,
  edges,
  scenarios: [{ id: "s", name: "Scenario", durationMs: 100, events }],
});

describe("complete project validation", () => {
  it("accepts a cycle and compatible connections", () => {
    const input = project(
      [node("a"), node("b")],
      [edge("a", "b"), { ...edge("b", "a"), id: "e2" }],
    );
    expect(validateProject(input, registry).ok).toBe(true);
  });

  it.each([
    ["unknown type", project([node("a", "missing.type")])],
    ["bad config", project([{ ...node("a"), config: { text: "wrong" } }])],
    ["missing target", project([node("a")], [edge("a", "b")])],
    [
      "missing port",
      project([node("a"), node("b")], [edge("a", "b", "absent")]),
    ],
    ["self edge", project([node("a")], [edge("a", "a")])],
    [
      "duplicate endpoints",
      project(
        [node("a"), node("b")],
        [edge("a", "b"), { ...edge("a", "b"), id: "e2" }],
      ),
    ],
    [
      "bad event target",
      project(
        [node("a")],
        [],
        [
          {
            id: "event",
            atMs: 0,
            type: "node.status",
            nodeId: "missing",
            status: "active",
          },
        ],
      ),
    ],
    [
      "metric event on process",
      project(
        [node("a")],
        [],
        [{ id: "event", atMs: 0, type: "metric.set", nodeId: "a", value: 4 }],
      ),
    ],
  ])("rejects %s", (_label, input) => {
    expect(validateProject(input, registry).ok).toBe(false);
  });

  it("rejects a signal output connected to a data-only input", () => {
    const sender = defineModule({
      type: "test.sender",
      title: "Sender",
      category: "Test",
      configSchema: z.strictObject({}),
      defaultConfig: {},
      fields: [],
      ports: [{ id: "out", direction: "output", dataType: "signal" }],
    });
    const receiver = defineModule({
      type: "test.receiver",
      title: "Receiver",
      category: "Test",
      configSchema: z.strictObject({}),
      defaultConfig: {},
      fields: [],
      ports: [{ id: "in", direction: "input", dataType: "data" }],
    });
    const customRegistry = createRegistry([sender, receiver]);
    const input = project(
      [
        { ...node("a"), moduleType: "test.sender", config: {} },
        { ...node("b"), moduleType: "test.receiver", config: {} },
      ],
      [edge("a", "b")],
    );
    const result = validateProject(input, customRegistry);
    expect(result.ok).toBe(false);
    if (!result.ok)
      expect(
        result.errors.some((issue) => issue.code === "incompatible_ports"),
      ).toBe(true);
  });
});
