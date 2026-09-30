import { describe, expect, it } from "vitest";
import { parseProjectShape } from "../../src/core/project/schema";

const minimal = {
  schemaVersion: 1,
  id: "project-1",
  name: "Demo",
  nodes: [],
  edges: [],
  scenarios: [],
};

describe("project shape", () => {
  it("accepts an empty, versioned document", () => {
    expect(parseProjectShape(minimal)).toEqual({ ok: true, value: minimal });
  });

  it.each([
    ["unsupported version", { ...minimal, schemaVersion: 2 }, "schemaVersion"],
    ["unknown field", { ...minimal, privateKey: "secret" }, ""],
    [
      "nonfinite coordinate",
      {
        ...minimal,
        nodes: [
          {
            id: "n",
            moduleType: "basic.process",
            label: "N",
            position: { x: Infinity, y: 0 },
            config: {},
          },
        ],
      },
      "nodes",
    ],
    [
      "negative event time",
      {
        ...minimal,
        scenarios: [
          {
            id: "s",
            name: "S",
            durationMs: 100,
            events: [
              {
                id: "e",
                atMs: -1,
                type: "log.append",
                message: "Hi",
                level: "info",
              },
            ],
          },
        ],
      },
      "scenarios",
    ],
    [
      "event past duration",
      {
        ...minimal,
        scenarios: [
          {
            id: "s",
            name: "S",
            durationMs: 100,
            events: [
              {
                id: "e",
                atMs: 101,
                type: "log.append",
                message: "Hi",
                level: "info",
              },
            ],
          },
        ],
      },
      "scenarios",
    ],
    [
      "duplicate node ID",
      {
        ...minimal,
        nodes: [
          {
            id: "n",
            moduleType: "basic.process",
            label: "N",
            position: { x: 0, y: 0 },
            config: {},
          },
          {
            id: "n",
            moduleType: "basic.process",
            label: "N",
            position: { x: 1, y: 1 },
            config: {},
          },
        ],
      },
      "nodes",
    ],
  ])("rejects %s with a path", (_label, input, path) => {
    const result = parseProjectShape(input);
    expect(result.ok).toBe(false);
    if (!result.ok)
      expect(result.errors.some((issue) => issue.path.startsWith(path))).toBe(
        true,
      );
  });

  it("does not mutate a frozen input", () => {
    const frozen = Object.freeze({ ...minimal });
    parseProjectShape(frozen);
    expect(frozen.name).toBe("Demo");
  });

  it("rejects unsupported events and non-JSON configuration", () => {
    const badEvent = {
      ...minimal,
      scenarios: [
        {
          id: "s",
          name: "S",
          durationMs: 10,
          events: [{ id: "e", atMs: 0, type: "arbitrary.run" }],
        },
      ],
    };
    expect(parseProjectShape(badEvent).ok).toBe(false);
    const badConfig = {
      ...minimal,
      nodes: [
        {
          id: "n",
          moduleType: "basic.process",
          label: "N",
          position: { x: 0, y: 0 },
          config: { fn: () => 1 },
        },
      ],
    };
    expect(parseProjectShape(badConfig).ok).toBe(false);
  });

  it("enforces collection and nesting bounds", () => {
    const tooManyNodes = {
      ...minimal,
      nodes: Array.from({ length: 201 }, (_, index) => ({
        id: `n${index}`,
        moduleType: "basic.process",
        label: "N",
        position: { x: 0, y: 0 },
        config: {},
      })),
    };
    expect(parseProjectShape(tooManyNodes).ok).toBe(false);
    let nested: unknown = "leaf";
    for (let index = 0; index < 25; index++) nested = { next: nested };
    expect(
      parseProjectShape({
        ...minimal,
        nodes: [
          {
            id: "n",
            moduleType: "basic.process",
            label: "N",
            position: { x: 0, y: 0 },
            config: nested,
          },
        ],
      }).ok,
    ).toBe(false);
  });

  it("preserves authored equal-time event order", () => {
    const events = [
      { id: "a", atMs: 0, type: "log.append", message: "First", level: "info" },
      {
        id: "b",
        atMs: 0,
        type: "log.append",
        message: "Second",
        level: "info",
      },
    ];
    const result = parseProjectShape({
      ...minimal,
      scenarios: [{ id: "s", name: "S", durationMs: 0, events }],
    });
    expect(result.ok).toBe(true);
    if (result.ok)
      expect(
        result.value.scenarios[0]?.events.map((event) => event.id),
      ).toEqual(["a", "b"]);
  });
});
