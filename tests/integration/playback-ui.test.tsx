// @vitest-environment jsdom
import { describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { StrictMode } from "react";
import { ReactFlowProvider } from "@xyflow/react";
import { createRegistry } from "../../src/core/modules/registry";
import { builtInModules } from "../../src/modules";
import { createEditorStore } from "../../src/features/editor/store";
import { Editor } from "../../src/features/editor/editor";
import type { PlaybackClock } from "../../src/core/scenario/controller";
import type { VisualizerProject } from "../../src/core/project/schema";

const registry = createRegistry(builtInModules);
const project: VisualizerProject = {
  schemaVersion: 1,
  id: "p",
  name: "Playback",
  edges: [],
  nodes: [
    {
      id: "n",
      moduleType: "basic.process",
      label: "Process",
      position: { x: 0, y: 0 },
      config: { description: "" },
    },
  ],
  scenarios: [
    {
      id: "s",
      name: "Three seconds",
      durationMs: 3000,
      events: [
        {
          id: "start",
          atMs: 0,
          type: "node.status",
          nodeId: "n",
          status: "active",
        },
        {
          id: "finish",
          atMs: 3000,
          type: "node.status",
          nodeId: "n",
          status: "success",
        },
      ],
    },
  ],
};
const clock: PlaybackClock = {
  now: () => 0,
  requestFrame: () => 1,
  cancelFrame: () => {},
};

describe("editor playback bridge", () => {
  it("captures a baseline, applies overlay only, and restores Edit mode", () => {
    const store = createEditorStore(project, registry);
    expect(store.getState().beginPlayback("s", clock, "simulate").ok).toBe(
      true,
    );
    expect(store.getState().mode).toBe("simulate");
    expect(
      store.getState().apply({ type: "project.rename", name: "No" }).ok,
    ).toBe(false);
    store.getState().play();
    expect(store.getState().playback?.snapshot.overlay.nodeStatus.n).toBe(
      "active",
    );
    expect(store.getState().history.present).toEqual(project);
    store.getState().exitPlayback();
    expect(store.getState().mode).toBe("edit");
    expect(store.getState().playback).toBeNull();
  });

  it("rejects missing scenarios and replaces an old runner without retaining its overlay", () => {
    const store = createEditorStore(project, registry);
    expect(
      store.getState().beginPlayback("missing", clock, "simulate").ok,
    ).toBe(false);
    store.getState().beginPlayback("s", clock, "simulate");
    store.getState().play();
    expect(store.getState().beginPlayback("s", clock, "present").ok).toBe(true);
    expect(store.getState().mode).toBe("present");
    expect(store.getState().playback?.snapshot.cursor).toBe(0);
    expect(store.getState().playback?.snapshot.overlay.nodeStatus).toEqual({});
  });

  it("connects mode controls, status overlay and timeline without editing the document", async () => {
    localStorage.clear();
    render(
      <ReactFlowProvider>
        <Editor
          registry={registry}
          initialProject={project}
          clockFactory={() => clock}
        />
      </ReactFlowProvider>,
    );
    await userEvent.click(screen.getByRole("button", { name: "Simulate" }));
    expect(screen.getByText("simulate")).toBeInTheDocument();
    expect(
      screen
        .getByRole("complementary", { name: "Modules" })
        .querySelector("button"),
    ).toBeDisabled();
    await userEvent.click(screen.getByRole("button", { name: "Step" }));
    expect(screen.getByText("Node n: active")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Present" }));
    expect(
      screen.queryByRole("complementary", { name: "Inspector" }),
    ).not.toBeInTheDocument();
    await userEvent.click(
      screen.getByRole("button", { name: "Exit playback" }),
    );
    expect(screen.getByText("edit")).toBeInTheDocument();
    expect(screen.queryByText("Node n: active")).not.toBeInTheDocument();
  });

  it("filters the timeline by node", async () => {
    localStorage.clear();
    const filtered: VisualizerProject = {
      ...project,
      nodes: [
        ...project.nodes,
        {
          id: "other",
          moduleType: "basic.process",
          label: "Other",
          position: { x: 200, y: 0 },
          config: { description: "" },
        },
      ],
      scenarios: [
        {
          id: "filtered",
          name: "Filtered",
          durationMs: 1000,
          events: [
            {
              id: "one",
              atMs: 0,
              type: "log.append",
              message: "First log",
              level: "info",
              nodeId: "n",
            },
            {
              id: "two",
              atMs: 0,
              type: "log.append",
              message: "Second log",
              level: "info",
              nodeId: "other",
            },
          ],
        },
      ],
    };
    render(
      <ReactFlowProvider>
        <Editor
          registry={registry}
          initialProject={filtered}
          clockFactory={() => clock}
        />
      </ReactFlowProvider>,
    );
    await userEvent.click(screen.getByRole("button", { name: "Simulate" }));
    await userEvent.click(screen.getByRole("button", { name: "Step" }));
    const list = screen.getByRole("list");
    expect(within(list).getByText("First log")).toBeInTheDocument();
    expect(within(list).getByText("Second log")).toBeInTheDocument();
    await userEvent.selectOptions(
      screen.getByRole("combobox", { name: "Filter timeline by node" }),
      "n",
    );
    expect(within(list).getByText("First log")).toBeInTheDocument();
    expect(within(list).queryByText("Second log")).not.toBeInTheDocument();
  });

  it("does not retain a runner after Strict Mode unmount", async () => {
    localStorage.clear();
    const requestFrame = vi.fn(() => 1);
    const cancelFrame = vi.fn();
    const strictClock: PlaybackClock = {
      now: () => 0,
      requestFrame,
      cancelFrame,
    };
    const view = render(
      <StrictMode>
        <ReactFlowProvider>
          <Editor
            registry={registry}
            initialProject={project}
            clockFactory={() => strictClock}
          />
        </ReactFlowProvider>
      </StrictMode>,
    );
    await userEvent.click(screen.getByRole("button", { name: "Simulate" }));
    await userEvent.click(screen.getByRole("button", { name: /^Play$/ }));
    expect(requestFrame).toHaveBeenCalledTimes(1);
    view.unmount();
    expect(cancelFrame).toHaveBeenCalledTimes(1);
  });
});
