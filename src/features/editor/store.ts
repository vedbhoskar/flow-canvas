import { createStore } from "zustand/vanilla";
import type { ModuleRegistry } from "../../core/modules/registry";
import type { GraphCommand } from "../../core/graph/commands";
import { applyGraphCommand } from "../../core/graph/commands";
import type { Result, VisualizerProject } from "../../core/project/schema";
import {
  createHistory,
  pushHistory,
  redoHistory,
  undoHistory,
  type History,
} from "../../core/history/history";

export type EditorMode = "edit" | "simulate" | "present";
export type EditorState = {
  history: History<VisualizerProject>;
  selectedNodeIds: string[];
  selectedEdgeIds: string[];
  mode: EditorMode;
  viewport: { x: number; y: number; zoom: number };
  movementDraft: { nodeId: string; position: { x: number; y: number } }[];
  apply(command: GraphCommand): Result<VisualizerProject>;
  undo(): void;
  redo(): void;
  select(nodeIds: string[], edgeIds: string[]): void;
  setViewport(viewport: { x: number; y: number; zoom: number }): void;
  setMode(mode: EditorMode): void;
  draftMove(
    positions: { nodeId: string; position: { x: number; y: number } }[],
  ): void;
  commitMove(): void;
};

export function createEditorStore(
  document: VisualizerProject,
  registry: ModuleRegistry,
) {
  return createStore<EditorState>((set, get) => ({
    history: createHistory(document),
    selectedNodeIds: [],
    selectedEdgeIds: [],
    mode: "edit",
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
    setMode: (mode) => set({ mode }),
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
