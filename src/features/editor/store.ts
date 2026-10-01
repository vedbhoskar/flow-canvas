import { createStore } from "zustand/vanilla";
import type { ModuleRegistry } from "../../core/modules/registry";
import type { GraphCommand } from "../../core/graph/commands";
import { applyGraphCommand } from "../../core/graph/commands";
import { validateProject } from "../../core/project/validate";
import {
  createPlaybackController,
  type PlaybackClock,
  type PlaybackController,
  type PlaybackSnapshot,
} from "../../core/scenario/controller";
import type { Result, VisualizerProject } from "../../core/project/schema";
import {
  createHistory,
  pushHistory,
  redoHistory,
  undoHistory,
  type History,
} from "../../core/history/history";

export type EditorMode = "edit" | "simulate" | "present";
export type EditorPlayback = {
  scenarioId: string;
  baseline: VisualizerProject;
  snapshot: PlaybackSnapshot;
};
export type EditorState = {
  history: History<VisualizerProject>;
  selectedNodeIds: string[];
  selectedEdgeIds: string[];
  mode: EditorMode;
  playback: EditorPlayback | null;
  viewport: { x: number; y: number; zoom: number };
  movementDraft: { nodeId: string; position: { x: number; y: number } }[];
  apply(command: GraphCommand): Result<VisualizerProject>;
  replaceProject(project: unknown): Result<VisualizerProject>;
  undo(): void;
  redo(): void;
  select(nodeIds: string[], edgeIds: string[]): void;
  setViewport(viewport: { x: number; y: number; zoom: number }): void;
  setMode(mode: EditorMode): void;
  beginPlayback(
    scenarioId: string,
    clock: PlaybackClock,
    mode: "simulate" | "present",
  ): Result<VisualizerProject>;
  exitPlayback(): void;
  play(): void;
  pause(): void;
  step(): void;
  restart(): void;
  draftMove(
    positions: { nodeId: string; position: { x: number; y: number } }[],
  ): void;
  commitMove(): void;
};

export function createEditorStore(
  document: VisualizerProject,
  registry: ModuleRegistry,
) {
  let controller: PlaybackController | null = null;
  let unsubscribePlayback: (() => void) | null = null;
  function disposeRunner() {
    unsubscribePlayback?.();
    unsubscribePlayback = null;
    controller?.dispose();
    controller = null;
  }
  return createStore<EditorState>((set, get) => ({
    history: createHistory(document),
    selectedNodeIds: [],
    selectedEdgeIds: [],
    mode: "edit",
    playback: null,
    viewport: document.viewport ?? { x: 0, y: 0, zoom: 1 },
    movementDraft: [],
    apply: (command) => {
      const current = get();
      if (current.mode !== "edit")
        return {
          ok: false,
          errors: [
            {
              code: "read_only",
              path: "",
              message: "Editing is available in Edit mode",
            },
          ],
        };
      const result = applyGraphCommand(
        current.history.present,
        command,
        registry,
      );
      if (result.ok && result.value !== current.history.present)
        set({ history: pushHistory(current.history, result.value) });
      return result;
    },
    replaceProject: (project) => {
      if (get().mode !== "edit")
        return {
          ok: false,
          errors: [
            {
              code: "read_only",
              path: "",
              message: "Open a project in Edit mode",
            },
          ],
        };
      const parsed = validateProject(project, registry);
      if (!parsed.ok) return parsed;
      disposeRunner();
      set({
        history: createHistory(parsed.value),
        selectedNodeIds: [],
        selectedEdgeIds: [],
        movementDraft: [],
        viewport: parsed.value.viewport ?? { x: 0, y: 0, zoom: 1 },
        playback: null,
      });
      return parsed;
    },
    undo: () => {
      if (get().mode === "edit")
        set((state) => ({ history: undoHistory(state.history) }));
    },
    redo: () => {
      if (get().mode === "edit")
        set((state) => ({ history: redoHistory(state.history) }));
    },
    select: (selectedNodeIds, selectedEdgeIds) =>
      set({ selectedNodeIds, selectedEdgeIds }),
    setViewport: (viewport) => set({ viewport }),
    setMode: (mode) => {
      if (mode === "edit") get().exitPlayback();
      else set({ mode });
    },
    beginPlayback: (scenarioId, clock, mode) => {
      const parsed = validateProject(get().history.present, registry);
      if (!parsed.ok) return parsed;
      const scenario = parsed.value.scenarios.find(
        (item) => item.id === scenarioId,
      );
      if (!scenario)
        return {
          ok: false,
          errors: [
            {
              code: "missing_scenario",
              path: "scenarios",
              message: "Scenario does not exist",
            },
          ],
        };
      disposeRunner();
      const baseline = structuredClone(parsed.value);
      const runner = createPlaybackController(baseline, scenario, clock);
      controller = runner;
      set({
        mode,
        playback: { scenarioId, baseline, snapshot: runner.getSnapshot() },
        selectedNodeIds: [],
        selectedEdgeIds: [],
        movementDraft: [],
      });
      unsubscribePlayback = runner.subscribe(() => {
        if (controller !== runner) return;
        set((state) => ({
          playback: state.playback
            ? { ...state.playback, snapshot: runner.getSnapshot() }
            : null,
        }));
      });
      return parsed;
    },
    exitPlayback: () => {
      disposeRunner();
      set({ mode: "edit", playback: null });
    },
    play: () => controller?.play(),
    pause: () => controller?.pause(),
    step: () => controller?.step(),
    restart: () => controller?.restart(),
    draftMove: (movementDraft) => {
      if (get().mode === "edit") set({ movementDraft });
    },
    commitMove: () => {
      const draft = get().movementDraft;
      if (draft.length && get().mode === "edit")
        get().apply({ type: "nodes.move", positions: draft });
      set({ movementDraft: [] });
    },
  }));
}
