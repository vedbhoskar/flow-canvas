// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { createEditorStore } from "../../src/features/editor/store";
import { createRegistry } from "../../src/core/modules/registry";
import { builtInModules } from "../../src/modules";
import type { VisualizerProject } from "../../src/core/project/schema";

const registry = createRegistry(builtInModules);
const initial = (): VisualizerProject => ({
  schemaVersion: 1,
  id: "p",
  name: "First",
  nodes: [
    {
      id: "n",
      moduleType: "basic.process",
      label: "N",
      position: { x: 0, y: 0 },
      config: { description: "" },
    },
  ],
  edges: [],
  scenarios: [],
});

describe("editor store", () => {
  it("commits edits, undo and redo; rejects changes in read-only modes", () => {
    const store = createEditorStore(initial(), registry);
    expect(
      store.getState().apply({ type: "project.rename", name: "Second" }).ok,
    ).toBe(true);
    expect(store.getState().history.present.name).toBe("Second");
    store.getState().undo();
    expect(store.getState().history.present.name).toBe("First");
    store.getState().redo();
    expect(store.getState().history.present.name).toBe("Second");
    store.getState().setMode("simulate");
    expect(
      store.getState().apply({ type: "project.rename", name: "Forbidden" }).ok,
    ).toBe(false);
    expect(store.getState().history.present.name).toBe("Second");
  });

  it("keeps selection and viewport outside document history", () => {
    const store = createEditorStore(initial(), registry);
    store.getState().select(["n"], []);
    store.getState().setViewport({ x: 20, y: 30, zoom: 2 });
    expect(store.getState().history.past).toHaveLength(0);
    expect(store.getState().viewport.zoom).toBe(2);
  });

  it("commits an entire drag as one undoable transaction", () => {
    const store = createEditorStore(initial(), registry);
    store.getState().draftMove([{ nodeId: "n", position: { x: 10, y: 20 } }]);
    store.getState().draftMove([{ nodeId: "n", position: { x: 40, y: 50 } }]);
    store.getState().commitMove();
    expect(store.getState().history.past).toHaveLength(1);
    expect(store.getState().history.present.nodes[0]?.position).toEqual({
      x: 40,
      y: 50,
    });
  });

  it("creates independent stores", () => {
    const first = createEditorStore(initial(), registry);
    const second = createEditorStore(initial(), registry);
    first.getState().apply({ type: "project.rename", name: "Changed" });
    expect(second.getState().history.present.name).toBe("First");
  });

  it("does not record failed or repeated edits and clears redo after a new edit", () => {
    const store = createEditorStore(initial(), registry);
    store.getState().apply({ type: "project.rename", name: "First" });
    store
      .getState()
      .apply({ type: "node.config", nodeId: "n", config: { description: 42 } });
    expect(store.getState().history.past).toHaveLength(0);
    store.getState().apply({ type: "project.rename", name: "Second" });
    store.getState().undo();
    store.getState().apply({ type: "project.rename", name: "Third" });
    expect(store.getState().history.future).toHaveLength(0);
    expect(store.getState().history.present.name).toBe("Third");
  });
});
