import { describe, expect, it } from "vitest";
import { createRegistry } from "../../src/core/modules/registry";
import { builtInModules } from "../../src/modules";
import {
  parseProjectJson,
  serializeProject,
} from "../../src/core/project/serialize";
import type { VisualizerProject } from "../../src/core/project/schema";

const registry = createRegistry(builtInModules);
const project: VisualizerProject = {
  schemaVersion: 1,
  id: "p",
  name: "Export",
  nodes: [
    {
      id: "n",
      moduleType: "basic.process",
      label: "Process",
      position: { x: 12, y: 20 },
      config: { description: "" },
    },
  ],
  edges: [],
  scenarios: [],
};

describe("project JSON", () => {
  it("round-trips a validated document and viewport without editor state", () => {
    const json = serializeProject(project, { x: 2, y: 3, zoom: 1.5 });
    expect(JSON.parse(json)).toMatchObject({
      id: "p",
      viewport: { x: 2, y: 3, zoom: 1.5 },
    });
    expect(json).not.toMatch(/selectedNodeIds|history|overlay/);
    expect(parseProjectJson(json, registry)).toEqual({
      ok: true,
      value: { ...project, viewport: { x: 2, y: 3, zoom: 1.5 } },
    });
  });

  it("rejects invalid JSON, unknown modules and future schema versions", () => {
    expect(parseProjectJson("{", registry).ok).toBe(false);
    expect(
      parseProjectJson(
        JSON.stringify({ ...project, schemaVersion: 2 }),
        registry,
      ).ok,
    ).toBe(false);
    expect(
      parseProjectJson(
        JSON.stringify({
          ...project,
          nodes: [{ ...project.nodes[0], moduleType: "missing.example" }],
        }),
        registry,
      ).ok,
    ).toBe(false);
  });

  it("rejects oversized and deeply nested input before parsing it", () => {
    expect(parseProjectJson(" ".repeat(2_000_001), registry).ok).toBe(false);
    let nested: unknown = "leaf";
    for (let i = 0; i < 25; i += 1) nested = { nested };
    expect(parseProjectJson(JSON.stringify(nested), registry).ok).toBe(false);
  });
});
