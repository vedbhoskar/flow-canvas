// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { z } from "zod";
import { createRegistry } from "../../src/core/modules/registry";
import { defineModule } from "../../src/core/modules/contracts";
import { createEditorStore } from "../../src/features/editor/store";
import { Inspector } from "../../src/features/editor/inspector";
import type { VisualizerProject } from "../../src/core/project/schema";

const sample = defineModule({
  type: "test.sample",
  title: "Sample",
  category: "Tests",
  configSchema: z.strictObject({
    note: z.string(),
    count: z.number().min(0),
    enabled: z.boolean(),
    color: z.enum(["red", "blue"]),
  }),
  defaultConfig: {
    note: "start",
    count: 2,
    enabled: false,
    color: "red" as const,
  },
  fields: [
    { kind: "text", key: "note", label: "Note" },
    { kind: "number", key: "count", label: "Count", min: 0 },
    { kind: "boolean", key: "enabled", label: "Enabled" },
    { kind: "select", key: "color", label: "Color", options: ["red", "blue"] },
  ] as const,
  ports: [],
});
const registry = createRegistry([sample]);
const project = (): VisualizerProject => ({
  schemaVersion: 1,
  id: "p",
  name: "Example",
  edges: [],
  scenarios: [],
  nodes: [
    {
      id: "n1",
      moduleType: "test.sample",
      label: "First",
      position: { x: 0, y: 0 },
      config: { note: "start", count: 2, enabled: false, color: "red" },
    },
    {
      id: "n2",
      moduleType: "test.sample",
      label: "Second",
      position: { x: 200, y: 0 },
      config: { note: "other", count: 3, enabled: true, color: "blue" },
    },
  ],
});
function setup() {
  const store = createEditorStore(project(), registry);
  store.getState().select(["n1"], []);
  render(<Inspector store={store} registry={registry} />);
  return store;
}

describe("descriptor-driven inspector", () => {
  it("renders all field kinds and saves them as one undoable edit", async () => {
    const store = setup();
    expect(screen.getByRole("textbox", { name: "Note" })).toHaveValue("start");
    expect(screen.getByRole("spinbutton", { name: "Count" })).toHaveValue(2);
    expect(screen.getByRole("checkbox", { name: "Enabled" })).not.toBeChecked();
    expect(screen.getByRole("combobox", { name: "Color" })).toHaveValue("red");
    await userEvent.clear(screen.getByRole("textbox", { name: "Node label" }));
    await userEvent.type(
      screen.getByRole("textbox", { name: "Node label" }),
      "Updated",
    );
    await userEvent.clear(screen.getByRole("spinbutton", { name: "Count" }));
    await userEvent.type(
      screen.getByRole("spinbutton", { name: "Count" }),
      "12",
    );
    await userEvent.click(screen.getByRole("checkbox", { name: "Enabled" }));
    await userEvent.selectOptions(
      screen.getByRole("combobox", { name: "Color" }),
      "blue",
    );
    await userEvent.click(
      screen.getByRole("button", { name: "Save properties" }),
    );
    expect(store.getState().history.present.nodes[0]).toMatchObject({
      label: "Updated",
      config: { count: 12, enabled: true, color: "blue" },
    });
    expect(store.getState().history.past).toHaveLength(1);
    store.getState().undo();
    expect(store.getState().history.present.nodes[0]?.label).toBe("First");
  });

  it("reports invalid numeric text without changing the document", async () => {
    const store = setup();
    await userEvent.clear(screen.getByRole("spinbutton", { name: "Count" }));
    await userEvent.click(
      screen.getByRole("button", { name: "Save properties" }),
    );
    expect(screen.getByRole("alert")).toHaveTextContent(/count.*number/i);
    expect(store.getState().history.past).toHaveLength(0);
    expect(store.getState().history.present.nodes[0]?.config).toMatchObject({
      count: 2,
    });
  });

  it("discards a draft when selection changes and refuses saves outside Edit mode", async () => {
    const store = setup();
    await userEvent.clear(screen.getByRole("textbox", { name: "Note" }));
    await userEvent.type(
      screen.getByRole("textbox", { name: "Note" }),
      "unsaved",
    );
    act(() => store.getState().select(["n2"], []));
    expect(screen.getByRole("textbox", { name: "Note" })).toHaveValue("other");
    act(() => store.getState().setMode("simulate"));
    expect(
      screen.getByRole("button", { name: "Save properties" }),
    ).toBeDisabled();
    expect(store.getState().history.past).toHaveLength(0);
  });

  it("does not accept a select value outside the descriptor options", async () => {
    const store = setup();
    fireEvent.change(screen.getByRole("combobox", { name: "Color" }), {
      target: { value: "green" },
    });
    await userEvent.click(
      screen.getByRole("button", { name: "Save properties" }),
    );
    expect(screen.getByRole("alert")).toHaveTextContent(
      /color.*available options/i,
    );
    expect(store.getState().history.past).toHaveLength(0);
  });

  it("shows an unknown module warning instead of rendering a form", () => {
    const invalid = project();
    invalid.nodes[0]!.moduleType = "missing.example";
    const store = createEditorStore(invalid, registry);
    store.getState().select(["n1"], []);
    render(<Inspector store={store} registry={registry} />);
    expect(screen.getByRole("alert")).toHaveTextContent("Unknown module type");
    expect(
      screen.queryByRole("button", { name: "Save properties" }),
    ).not.toBeInTheDocument();
  });
});
