import { describe, expect, it } from "vitest";
import api from "../../src/examples/api-lifecycle.json";
import research from "../../src/examples/agent-research.json";
import redistribution from "../../src/examples/resource-redistribution.json";
import { createRegistry } from "../../src/core/modules/registry";
import { builtInModules } from "../../src/modules";
import { validateProject } from "../../src/core/project/validate";
import { reduceEventPrefix } from "../../src/core/scenario/reducer";
import { projectToFlow } from "../../src/adapters/react-flow/project";

const registry = createRegistry(builtInModules);
const cases = [
  {
    name: "API lifecycle",
    input: api,
    expected: {
      nodeStatus: {
        gateway: "success",
        auth: "success",
        service: "success",
        database: "success",
        denied: "warning",
      },
      edgeStatus: {
        "gateway-auth": "active",
        "auth-service": "success",
        "service-database": "success",
        "auth-denied": "warning",
      },
      metrics: {},
      logIds: ["a2", "a10", "a18"],
    },
  },
  {
    name: "Agent research",
    input: research,
    expected: {
      nodeStatus: {
        planner: "success",
        web: "success",
        docs: "success",
        review: "success",
      },
      edgeStatus: {
        "planner-web": "active",
        "planner-docs": "active",
        "docs-review": "active",
        "web-review": "active",
      },
      metrics: { progress: 100 },
      logIds: ["r3", "r17", "r20"],
    },
  },
  {
    name: "Resource redistribution",
    input: redistribution,
    expected: {
      nodeStatus: {
        pool: "success",
        "node-1": "success",
        "node-2": "success",
        "node-3": "success",
        "node-4": "warning",
        "node-5": "success",
      },
      edgeStatus: {
        "pool-1": "active",
        "pool-2": "active",
        "pool-3": "active",
        "pool-4": "active",
        "resale-5": "success",
      },
      metrics: { unused: 0 },
      logIds: ["d3", "d16", "d20", "d25"],
    },
  },
];

describe("scripted examples", () => {
  it.each(cases)("fully validates and replays $name", ({ input, expected }) => {
    const parsed = validateProject(input, registry);
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    const scenario = parsed.value.scenarios[0]!;
    expect(scenario.durationMs).toBe(3000);
    const overlay = reduceEventPrefix(
      parsed.value,
      scenario.events,
      scenario.events.length,
    );
    expect(overlay.nodeStatus).toEqual(expected.nodeStatus);
    expect(overlay.edgeStatus).toEqual(expected.edgeStatus);
    expect(overlay.metrics).toEqual(expected.metrics);
    expect(overlay.log.map((entry) => entry.id)).toEqual(expected.logIds);
  });

  it("uses parallel research timestamps and visible secondary redistribution", () => {
    const researchRun = research.scenarios[0]!;
    expect(
      researchRun.events.filter(
        (event) => event.atMs === 500 && event.type === "node.status",
      ),
    ).toHaveLength(3);
    const parsed = validateProject(redistribution, registry);
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    expect(
      parsed.value.edges.some(
        (edge) =>
          edge.id === "resale-5" &&
          edge.sourceNodeId === "node-4" &&
          edge.targetNodeId === "node-5",
      ),
    ).toBe(true);
    const initial = projectToFlow(parsed.value, registry);
    const metric = initial.nodes.find((node) => node.id === "unused");
    expect(metric?.data.metricValue).toBe(20);
    const final = reduceEventPrefix(
      parsed.value,
      parsed.value.scenarios[0]!.events,
      parsed.value.scenarios[0]!.events.length,
    );
    expect(
      projectToFlow(parsed.value, registry, [], [], [], final).nodes.find(
        (node) => node.id === "unused",
      )?.data.metricValue,
    ).toBe(0);
  });
});
