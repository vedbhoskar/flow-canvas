import type { ModuleRegistry } from "../modules/registry";
import type { Result, VisualizerProject } from "./schema";
import { validateProject } from "./validate";

export type SavedViewport = { x: number; y: number; zoom: number };

export function serializeProject(
  project: VisualizerProject,
  viewport?: SavedViewport,
): string {
  return JSON.stringify(
    { ...project, ...(viewport ? { viewport } : {}) },
    null,
    2,
  );
}

export function parseProjectJson(
  text: string,
  registry: ModuleRegistry,
): Result<VisualizerProject> {
  if (text.length > 2_000_000)
    return {
      ok: false,
      errors: [
        { code: "too_large", path: "", message: "Project file exceeds 2 MB" },
      ],
    };
  try {
    return validateProject(JSON.parse(text), registry);
  } catch {
    return {
      ok: false,
      errors: [
        {
          code: "invalid_json",
          path: "",
          message: "Project file is not valid JSON",
        },
      ],
    };
  }
}
