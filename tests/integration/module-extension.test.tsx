// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { IconAntenna } from "@tabler/icons-react";
import { z } from "zod";
import { defineModule } from "../../src/core/modules/contracts";
import { createRegistry } from "../../src/core/modules/registry";
import { validateProject } from "../../src/core/project/validate";
import { createEditorStore } from "../../src/features/editor/store";
import { Palette } from "../../src/features/editor/palette";
import { Inspector } from "../../src/features/editor/inspector";
import { projectToFlow } from "../../src/adapters/react-flow/project";
import { builtInModules } from "../../src/modules";
import type { ModulePresentationMap } from "../../src/modules/presentation";
import type { VisualizerProject } from "../../src/core/project/schema";

const antenna = defineModule({
  type: "example.antenna",
  title: "Antenna",
  category: "Extensions",
  configSchema: z.strictObject({ frequency: z.number().min(1) }),
  defaultConfig: { frequency: 42 },
  fields: [{ kind: "number", key: "frequency", label: "Frequency", min: 1 }],
  ports: [{ id: "out", direction: "output", dataType: "signal" }],
});
const registry = createRegistry([...builtInModules, antenna]);
const presentations: ModulePresentationMap = {
  "example.antenna": { icon: IconAntenna },
};
const project: VisualizerProject = {
  schemaVersion: 1,
  id: "extension-test",
  name: "Extension test",
  nodes: [
    {
      id: "antenna-1",
      moduleType: "example.antenna",
      label: "Signal source",
      position: { x: 10, y: 10 },
      config: { frequency: 42 },
    },
  ],
  edges: [],
  scenarios: [],
};

describe("module extension contract", () => {
  it("renders a custom icon in the palette, validates its project, and edits its inspector field", async () => {
    const onAdd = vi.fn();
    const { unmount } = render(
      <Palette
        registry={registry}
        presentations={presentations}
        onAdd={onAdd}
      />,
    );
    const button = screen.getByRole("button", { name: /AntennaExtensions/ });
    expect(button.querySelector("svg")).toBeTruthy();
    await userEvent.click(button);
    expect(onAdd).toHaveBeenCalledWith("example.antenna");
    expect(validateProject(project, registry).ok).toBe(true);
    expect(projectToFlow(project, registry).nodes[0]?.data.ports[0]?.id).toBe(
      "out",
    );
    unmount();

    const store = createEditorStore(project, registry);
    store.getState().select(["antenna-1"], []);
    render(<Inspector store={store} registry={registry} />);
    const field = screen.getByRole("spinbutton", { name: "Frequency" });
    await userEvent.clear(field);
    await userEvent.type(field, "55");
    await userEvent.click(
      screen.getByRole("button", { name: "Save properties" }),
    );
    expect(store.getState().history.present.nodes[0]?.config).toEqual({
      frequency: 55,
    });
  });
});
