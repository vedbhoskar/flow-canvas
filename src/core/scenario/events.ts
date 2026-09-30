import { z } from "zod";

const eventBase = {
  id: z.string().min(1).max(100),
  atMs: z.number().int().nonnegative(),
};

export const scenarioEventSchema = z.discriminatedUnion("type", [
  z.strictObject({
    ...eventBase,
    type: z.literal("node.status"),
    nodeId: z.string().min(1).max(100),
    status: z.enum(["idle", "active", "success", "warning", "error"]),
  }),
  z.strictObject({
    ...eventBase,
    type: z.literal("edge.status"),
    edgeId: z.string().min(1).max(100),
    status: z.enum(["idle", "active", "success", "warning", "error"]),
  }),
  z.strictObject({
    ...eventBase,
    type: z.literal("metric.set"),
    nodeId: z.string().min(1).max(100),
    value: z.number().finite(),
  }),
  z.strictObject({
    ...eventBase,
    type: z.literal("log.append"),
    message: z.string().min(1).max(1000),
    level: z.enum(["info", "warning", "error"]),
    nodeId: z.string().min(1).max(100).optional(),
  }),
]);

export type ScenarioEvent = z.infer<typeof scenarioEventSchema>;
