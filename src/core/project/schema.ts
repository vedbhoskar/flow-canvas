import { z } from "zod";
import { scenarioEventSchema } from "../scenario/events";

export type ValidationIssue = { code: string; path: string; message: string };
export type Result<T> =
  { ok: true; value: T } | { ok: false; errors: ValidationIssue[] };

const id = z.string().min(1).max(100);
const label = z.string().min(1).max(120);
const coordinate = z.number().finite();
const position = z.strictObject({ x: coordinate, y: coordinate });

export const visualizerNodeSchema = z.strictObject({
  id,
  moduleType: id,
  label,
  position,
  config: z.json(),
});

export const visualizerEdgeSchema = z.strictObject({
  id,
  sourceNodeId: id,
  sourcePortId: id,
  targetNodeId: id,
  targetPortId: id,
  label: label.optional(),
});

export const scenarioSchema = z
  .strictObject({
    id,
    name: label,
    durationMs: z.number().int().nonnegative(),
    events: z.array(scenarioEventSchema).max(5000),
  })
  .superRefine((scenario, ctx) => {
    const seen = new Set<string>();
    scenario.events.forEach((event, index) => {
      if (seen.has(event.id))
        ctx.addIssue({
          code: "custom",
          path: ["events", index, "id"],
          message: `Duplicate event ID: ${event.id}`,
        });
      seen.add(event.id);
      if (event.atMs > scenario.durationMs)
        ctx.addIssue({
          code: "custom",
          path: ["events", index, "atMs"],
          message: "Event occurs after scenario duration",
        });
    });
  });

export const visualizerProjectSchema = z
  .strictObject({
    schemaVersion: z.literal(1),
    id,
    name: label,
    description: z.string().max(2000).optional(),
    nodes: z.array(visualizerNodeSchema).max(200),
    edges: z.array(visualizerEdgeSchema).max(500),
    scenarios: z.array(scenarioSchema).max(10),
    viewport: z
      .strictObject({
        x: coordinate,
        y: coordinate,
        zoom: z.number().finite().positive(),
      })
      .optional(),
  })
  .superRefine((project, ctx) => {
    for (const collection of ["nodes", "edges", "scenarios"] as const) {
      const seen = new Set<string>();
      project[collection].forEach((item, index) => {
        if (seen.has(item.id))
          ctx.addIssue({
            code: "custom",
            path: [collection, index, "id"],
            message: `Duplicate ${collection} ID: ${item.id}`,
          });
        seen.add(item.id);
      });
    }
  });

export type VisualizerProject = z.infer<typeof visualizerProjectSchema>;
export type VisualizerNode = z.infer<typeof visualizerNodeSchema>;
export type VisualizerEdge = z.infer<typeof visualizerEdgeSchema>;
export type Scenario = z.infer<typeof scenarioSchema>;

function depthExceeded(
  value: unknown,
  depth = 0,
  seen = new WeakSet<object>(),
): boolean {
  if (depth > 20) return true;
  if (value === null || typeof value !== "object") return false;
  if (seen.has(value)) return true;
  seen.add(value);
  const exceeded = Object.values(value).some((child) =>
    depthExceeded(child, depth + 1, seen),
  );
  seen.delete(value);
  return exceeded;
}

export function parseProjectShape(input: unknown): Result<VisualizerProject> {
  if (depthExceeded(input))
    return {
      ok: false,
      errors: [
        {
          code: "too_deep",
          path: "",
          message: "Project exceeds the maximum nesting depth",
        },
      ],
    };
  const parsed = visualizerProjectSchema.safeParse(input);
  if (parsed.success) return { ok: true, value: parsed.data };
  return {
    ok: false,
    errors: parsed.error.issues.map((issue) => ({
      code: issue.code,
      path: issue.path.join("."),
      message: issue.message,
    })),
  };
}
