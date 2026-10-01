import type { ModuleRegistry } from "../../core/modules/registry";
import type { VisualizerProject } from "../../core/project/schema";
import {
  parseProjectJson,
  serializeProject,
  type SavedViewport,
} from "../../core/project/serialize";

export const PROJECT_STORAGE_KEY = "flow-canvas:project:v1";
export type StorageLike = Pick<Storage, "getItem" | "setItem">;
export type LoadResult =
  | { state: "empty" | "unavailable" }
  | { state: "valid"; project: VisualizerProject }
  | { state: "corrupt"; message: string };
export type SaveResult = { ok: true } | { ok: false; message: string };

export function createLocalProjectStorage(
  storage: StorageLike | null,
  registry: ModuleRegistry,
): {
  load(): LoadResult;
  save(project: VisualizerProject, viewport?: SavedViewport): SaveResult;
} {
  return {
    load: () => {
      if (!storage) return { state: "unavailable" };
      try {
        const text = storage.getItem(PROJECT_STORAGE_KEY);
        if (text === null) return { state: "empty" };
        const parsed = parseProjectJson(text, registry);
        return parsed.ok
          ? { state: "valid", project: parsed.value }
          : {
              state: "corrupt",
              message: parsed.errors[0]?.message ?? "Saved project is invalid",
            };
      } catch {
        return { state: "unavailable" };
      }
    },
    save: (project, viewport) => {
      if (!storage)
        return { ok: false, message: "Local storage is unavailable" };
      const text = serializeProject(project, viewport);
      const parsed = parseProjectJson(text, registry);
      if (!parsed.ok)
        return {
          ok: false,
          message: parsed.errors[0]?.message ?? "Project is invalid",
        };
      try {
        storage.setItem(PROJECT_STORAGE_KEY, text);
        return { ok: true };
      } catch {
        return {
          ok: false,
          message: "Local storage could not save the project",
        };
      }
    },
  };
}
