import { describe, expect, it } from "vitest";
import { z } from "zod";
import { createRegistry } from "../../src/core/modules/registry";
import { defineModule } from "../../src/core/modules/contracts";
import { builtInModules } from "../../src/modules";

const process = defineModule({
  type: "basic.process",
  title: "Process",
  category: "Basics",
  configSchema: z.strictObject({ description: z.string() }),
  defaultConfig: { description: "" },
  fields: [{ kind: "text", key: "description", label: "Description" }],
  ports: [
    { id: "in", direction: "input", dataType: "any" },
    { id: "out", direction: "output", dataType: "any" },
  ],
});

describe("module registry", () => {
  it("looks up a definition and lists it", () => {
    const registry = createRegistry([process]);
    expect(registry.get("basic.process")?.title).toBe("Process");
    expect(registry.list()).toHaveLength(1);
  });

  it("rejects duplicate types and ports", () => {
    expect(() => createRegistry([process, process])).toThrow(/duplicate/i);
    expect(() =>
      createRegistry([
        { ...process, ports: [process.ports[0]!, process.ports[0]!] },
      ]),
    ).toThrow(/port/i);
  });

  it("rejects invalid defaults and field keys", () => {
    expect(() =>
      createRegistry([{ ...process, defaultConfig: { description: 42 } }]),
    ).toThrow(/default/i);
    expect(() =>
      createRegistry([
        {
          ...process,
          fields: [{ kind: "text", key: "missing", label: "Missing" }],
        },
      ]),
    ).toThrow(/field/i);
  });

  it("validates all eight built-in modules and gives each node its own config", () => {
    const registry = createRegistry(builtInModules);
    expect(registry.list()).toHaveLength(8);
    const first = registry.createConfig("basic.process") as {
      description: string;
    };
    first.description = "Changed";
    expect(registry.createConfig("basic.process")).toEqual({ description: "" });
    expect(() => registry.createConfig("missing.type")).toThrow(/unknown/i);
  });

  it("isolates registered defaults from changes to the source definition", () => {
    const custom = { ...process, defaultConfig: { description: "Before" } };
    const registry = createRegistry([custom]);
    custom.defaultConfig.description = "After";
    expect(registry.createConfig("basic.process")).toEqual({
      description: "Before",
    });
  });
});
