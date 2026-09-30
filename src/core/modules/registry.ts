import type { ModuleDefinition } from "./contracts";

export type ModuleRegistry = {
  get(type: string): ModuleDefinition | undefined;
  list(): readonly ModuleDefinition[];
  createConfig(type: string): unknown;
};

function deepFreeze<T>(value: T): T {
  if (value !== null && typeof value === "object") {
    for (const child of Object.values(value)) deepFreeze(child);
    Object.freeze(value);
  }
  return value;
}

export function createRegistry(
  definitions: readonly ModuleDefinition[],
): ModuleRegistry {
  const byType = new Map<string, ModuleDefinition>();
  for (const definition of definitions) {
    if (!/^[a-z][a-z0-9-]*\.[a-z][a-z0-9-]*$/.test(definition.type))
      throw new Error(`Invalid module type: ${definition.type}`);
    if (byType.has(definition.type))
      throw new Error(`Duplicate module type: ${definition.type}`);
    if (!definition.configSchema.safeParse(definition.defaultConfig).success)
      throw new Error(`Invalid default config for ${definition.type}`);
    const config = definition.defaultConfig;
    if (typeof config !== "object" || config === null || Array.isArray(config))
      throw new Error(
        `Default config must be an object for ${definition.type}`,
      );
    const keys = new Set(Object.keys(config));
    const fieldKeys = new Set<string>();
    for (const field of definition.fields) {
      if (!keys.has(field.key) || fieldKeys.has(field.key))
        throw new Error(
          `Invalid or duplicate field ${field.key} in ${definition.type}`,
        );
      fieldKeys.add(field.key);
      const value = (config as Record<string, unknown>)[field.key];
      if (field.kind === "text" && typeof value !== "string")
        throw new Error(`Invalid text field ${field.key}`);
      if (
        field.kind === "number" &&
        (typeof value !== "number" || !Number.isFinite(value))
      )
        throw new Error(`Invalid number field ${field.key}`);
      if (
        field.kind === "number" &&
        typeof value === "number" &&
        ((field.min !== undefined && value < field.min) ||
          (field.max !== undefined && value > field.max))
      )
        throw new Error(`Default outside number field bounds: ${field.key}`);
      if (field.kind === "boolean" && typeof value !== "boolean")
        throw new Error(`Invalid boolean field ${field.key}`);
      if (
        field.kind === "select" &&
        (!field.options.length || !field.options.includes(value as string))
      )
        throw new Error(`Invalid select field ${field.key}`);
    }
    const portIds = new Set<string>();
    for (const port of definition.ports) {
      if (!port.id || portIds.has(port.id))
        throw new Error(`Duplicate or empty port in ${definition.type}`);
      portIds.add(port.id);
    }
    byType.set(
      definition.type,
      Object.freeze({
        ...definition,
        defaultConfig: deepFreeze(structuredClone(definition.defaultConfig)),
        fields: Object.freeze(
          definition.fields.map((field) =>
            deepFreeze({
              ...field,
              ...(field.kind === "select"
                ? { options: [...field.options] }
                : {}),
            }),
          ),
        ),
        ports: Object.freeze(
          definition.ports.map((port) => Object.freeze({ ...port })),
        ),
      }),
    );
  }
  const list = Object.freeze([...byType.values()]);
  return Object.freeze({
    get: (type: string) => byType.get(type),
    list: () => list,
    createConfig: (type: string) => {
      const definition = byType.get(type);
      if (!definition) throw new Error(`Unknown module type: ${type}`);
      return structuredClone(definition.defaultConfig);
    },
  });
}
