import type { z } from "zod";

export type PortDefinition = {
  id: string;
  direction: "input" | "output";
  dataType: "any" | "signal" | "data";
};
export type FieldDescriptor =
  | { kind: "text"; key: string; label: string; multiline?: boolean }
  | { kind: "number"; key: string; label: string; min?: number; max?: number }
  | { kind: "boolean"; key: string; label: string }
  | { kind: "select"; key: string; label: string; options: readonly string[] };

export type ModuleDefinition<TConfig = unknown> = {
  type: string;
  title: string;
  category: string;
  configSchema: z.ZodType<TConfig>;
  defaultConfig: TConfig;
  fields: readonly FieldDescriptor[];
  ports: readonly PortDefinition[];
  supportsMetric?: boolean;
};

export function defineModule<TConfig>(
  definition: ModuleDefinition<TConfig>,
): ModuleDefinition<TConfig> {
  return definition;
}
