// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { createRegistry } from "../../src/core/modules/registry";
import { builtInModules } from "../../src/modules";
import {
  createLocalProjectStorage,
  PROJECT_STORAGE_KEY,
} from "../../src/adapters/storage/local-project";
import type { VisualizerProject } from "../../src/core/project/schema";
import { createEditorStore } from "../../src/features/editor/store";
import { ProjectPersistence } from "../../src/features/editor/persistence";

const registry = createRegistry(builtInModules);
const project: VisualizerProject = {
  schemaVersion: 1,
  id: "p",
  name: "Saved",
  nodes: [],
  edges: [],
  scenarios: [],
};
afterEach(() => vi.useRealTimers());

describe("local project storage", () => {
  it("stores validated JSON under a namespaced key and loads it", () => {
    const values = new Map<string, string>();
    const storage = {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => {
        values.set(key, value);
      },
    };
    const adapter = createLocalProjectStorage(storage, registry);
    expect(adapter.load()).toEqual({ state: "empty" });
    expect(adapter.save(project, { x: 10, y: 20, zoom: 2 })).toEqual({
      ok: true,
    });
    expect(values.has(PROJECT_STORAGE_KEY)).toBe(true);
    expect(adapter.load()).toEqual({
      state: "valid",
      project: { ...project, viewport: { x: 10, y: 20, zoom: 2 } },
    });
  });

  it("distinguishes corrupt data from missing storage without overwriting it", () => {
    let writes = 0;
    const storage = {
      getItem: () => "{broken",
      setItem: () => {
        writes += 1;
      },
    };
    expect(createLocalProjectStorage(storage, registry).load().state).toBe(
      "corrupt",
    );
    expect(writes).toBe(0);
    expect(createLocalProjectStorage(null, registry).load().state).toBe(
      "unavailable",
    );
  });

  it("reports quota and browser storage errors", () => {
    const storage = {
      getItem: () => {
        throw new Error("blocked");
      },
      setItem: () => {
        throw new Error("quota");
      },
    };
    const adapter = createLocalProjectStorage(storage, registry);
    expect(adapter.load().state).toBe("unavailable");
    expect(adapter.save(project).ok).toBe(false);
  });

  it("hydrates before autosaving and debounces a changed document", () => {
    vi.useFakeTimers();
    const values = new Map([[PROJECT_STORAGE_KEY, JSON.stringify(project)]]);
    let writes = 0;
    const storage = {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => {
        writes += 1;
        values.set(key, value);
      },
    };
    const store = createEditorStore({ ...project, name: "Blank" }, registry);
    const persistence = new ProjectPersistence(store, registry, () => storage);
    persistence.start();
    expect(store.getState().history.present.name).toBe("Saved");
    expect(writes).toBe(0);
    store.getState().apply({ type: "project.rename", name: "Updated" });
    vi.advanceTimersByTime(499);
    expect(writes).toBe(0);
    vi.advanceTimersByTime(1);
    expect(writes).toBe(1);
    expect(persistence.getSnapshot().kind).toBe("saved");
    persistence.dispose();
  });

  it("protects corrupt saved data until explicit recovery and cancels pending work on dispose", () => {
    vi.useFakeTimers();
    let writes = 0;
    const storage = {
      getItem: () => "broken",
      setItem: () => {
        writes += 1;
      },
    };
    const store = createEditorStore(project, registry);
    const persistence = new ProjectPersistence(store, registry, () => storage);
    persistence.start();
    expect(persistence.getSnapshot().kind).toBe("recovery_required");
    store.getState().apply({ type: "project.rename", name: "Changed" });
    vi.advanceTimersByTime(1000);
    expect(writes).toBe(0);
    persistence.afterExplicitReplacement();
    persistence.dispose();
    vi.advanceTimersByTime(1000);
    expect(writes).toBe(0);
  });

  it("flushes the pending old project before a switch and reports a failed save", () => {
    vi.useFakeTimers();
    const saved: string[] = [];
    const storage = {
      getItem: () => null,
      setItem: (_key: string, value: string) => {
        saved.push(value);
      },
    };
    const store = createEditorStore(project, registry);
    const persistence = new ProjectPersistence(store, registry, () => storage);
    persistence.start();
    store.getState().apply({ type: "project.rename", name: "Before switch" });
    persistence.flush();
    expect(JSON.parse(saved[0]!).name).toBe("Before switch");
    store.getState().replaceProject({ ...project, id: "next", name: "Next" });
    persistence.afterExplicitReplacement();
    vi.advanceTimersByTime(500);
    expect(JSON.parse(saved.at(-1)!).name).toBe("Next");
    persistence.dispose();

    const failing = new ProjectPersistence(
      createEditorStore(project, registry),
      registry,
      () => ({
        getItem: () => null,
        setItem: () => {
          throw new Error("quota");
        },
      }),
    );
    failing.start();
    failing.flush();
    expect(failing.getSnapshot().kind).toBe("unsaved");
    failing.dispose();
  });

  it("does not rehydrate stale storage during Strict Mode effect replay", () => {
    vi.useFakeTimers();
    const values = new Map([[PROJECT_STORAGE_KEY, JSON.stringify(project)]]);
    const storage = {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => {
        values.set(key, value);
      },
    };
    const store = createEditorStore({ ...project, name: "Example" }, registry);
    const persistence = new ProjectPersistence(store, registry, () => storage);
    persistence.start();
    expect(store.getState().history.present.name).toBe("Saved");
    store.getState().replaceProject({ ...project, name: "Example" });
    persistence.afterExplicitReplacement();
    persistence.dispose();
    persistence.start();
    expect(store.getState().history.present.name).toBe("Example");
    vi.advanceTimersByTime(500);
    expect(JSON.parse(values.get(PROJECT_STORAGE_KEY)!).name).toBe("Example");
    persistence.dispose();
  });
});
