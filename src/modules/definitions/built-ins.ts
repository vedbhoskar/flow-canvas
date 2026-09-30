import { z } from "zod";
import {
  defineModule,
  type PortDefinition,
} from "../../core/modules/contracts";

const input: PortDefinition = { id: "in", direction: "input", dataType: "any" };
const output: PortDefinition = {
  id: "out",
  direction: "output",
  dataType: "any",
};
const twoPorts = [input, output] as const;

export const processModule = defineModule({
  type: "basic.process",
  title: "Process",
  category: "Basics",
  configSchema: z.strictObject({ description: z.string().max(2000) }),
  defaultConfig: { description: "" },
  fields: [
    { kind: "text", key: "description", label: "Description", multiline: true },
  ],
  ports: twoPorts,
});

export const decisionModule = defineModule({
  type: "basic.decision",
  title: "Decision",
  category: "Basics",
  configSchema: z.strictObject({ condition: z.string().min(1).max(2000) }),
  defaultConfig: { condition: "Condition met?" },
  fields: [{ kind: "text", key: "condition", label: "Condition" }],
  ports: [
    input,
    { id: "yes", direction: "output", dataType: "signal" },
    { id: "no", direction: "output", dataType: "signal" },
  ] as const,
});

export const serviceModule = defineModule({
  type: "system.service",
  title: "Service",
  category: "Systems",
  configSchema: z.strictObject({
    protocol: z.enum(["HTTP", "RPC", "Event"]),
    latencyMs: z.number().finite().nonnegative(),
  }),
  defaultConfig: { protocol: "HTTP" as const, latencyMs: 100 },
  fields: [
    {
      kind: "select",
      key: "protocol",
      label: "Protocol",
      options: ["HTTP", "RPC", "Event"],
    },
    { kind: "number", key: "latencyMs", label: "Latency (ms)", min: 0 },
  ],
  ports: twoPorts,
});

export const databaseModule = defineModule({
  type: "system.database",
  title: "Database",
  category: "Systems",
  configSchema: z.strictObject({
    engine: z.enum(["PostgreSQL", "SQLite", "Other"]),
    readOnly: z.boolean(),
  }),
  defaultConfig: { engine: "PostgreSQL" as const, readOnly: false },
  fields: [
    {
      kind: "select",
      key: "engine",
      label: "Engine",
      options: ["PostgreSQL", "SQLite", "Other"],
    },
    { kind: "boolean", key: "readOnly", label: "Read only" },
  ],
  ports: twoPorts,
});

export const agentModule = defineModule({
  type: "agent.worker",
  title: "Agent",
  category: "Agents",
  configSchema: z.strictObject({
    role: z.string().min(1).max(2000),
    task: z.string().max(2000),
  }),
  defaultConfig: { role: "Researcher", task: "" },
  fields: [
    { kind: "text", key: "role", label: "Role" },
    { kind: "text", key: "task", label: "Task", multiline: true },
  ],
  ports: twoPorts,
});

export const poolModule = defineModule({
  type: "simulation.pool",
  title: "Resource Pool",
  category: "Simulation",
  configSchema: z.strictObject({
    capacity: z.number().finite().nonnegative(),
    unit: z.string().min(1).max(2000),
  }),
  defaultConfig: { capacity: 100, unit: "units" },
  fields: [
    { kind: "number", key: "capacity", label: "Capacity", min: 0 },
    { kind: "text", key: "unit", label: "Unit" },
  ],
  ports: twoPorts,
});

export const metricModule = defineModule({
  type: "utility.metric",
  title: "Metric",
  category: "Utility",
  configSchema: z.strictObject({
    initialValue: z.number().finite(),
    unit: z.string().min(1).max(2000),
  }),
  defaultConfig: { initialValue: 0, unit: "units" },
  fields: [
    { kind: "number", key: "initialValue", label: "Initial value" },
    { kind: "text", key: "unit", label: "Unit" },
  ],
  ports: [],
  supportsMetric: true,
});

export const noteModule = defineModule({
  type: "utility.note",
  title: "Note",
  category: "Utility",
  configSchema: z.strictObject({ text: z.string().max(2000) }),
  defaultConfig: { text: "Add a note" },
  fields: [{ kind: "text", key: "text", label: "Text", multiline: true }],
  ports: [],
});
