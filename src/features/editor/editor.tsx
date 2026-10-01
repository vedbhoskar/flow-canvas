"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useReactFlow } from "@xyflow/react";
import { useStore } from "zustand";
import type { ModuleRegistry } from "../../core/modules/registry";
import type { VisualizerProject } from "../../core/project/schema";
import type { PlaybackClock } from "../../core/scenario/controller";
import type { ModulePresentationMap } from "../../modules/presentation";
import { createEditorStore } from "./store";
import { Taskbar } from "./taskbar";
import { Palette } from "./palette";
import { Inspector } from "./inspector";
import { Timeline } from "./timeline";
import { Canvas } from "./canvas";
import { ProjectPersistence } from "./persistence";
import { createBrowserClock } from "./browser-clock";

export type EditorStore = ReturnType<typeof createEditorStore>;
const emptyPresentations: ModulePresentationMap = {};

function subscribeToDesktop(onChange: () => void) {
  if (typeof window.matchMedia !== "function") return () => {};
  const query = window.matchMedia("(min-width: 1280px)");
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

function isDesktop() {
  return (
    typeof window.matchMedia !== "function" ||
    window.matchMedia("(min-width: 1280px)").matches
  );
}

export function Editor({
  registry,
  initialProject,
  clockFactory = createBrowserClock,
  presentations = emptyPresentations,
  requestedProject = false,
}: {
  registry: ModuleRegistry;
  initialProject: VisualizerProject;
  clockFactory?: () => PlaybackClock;
  presentations?: ModulePresentationMap;
  requestedProject?: boolean;
}) {
  const [store] = useState(() => createEditorStore(initialProject, registry));
  const [persistence] = useState(() => new ProjectPersistence(store, registry));
  const handledRequest = useRef(false);
  useEffect(() => {
    persistence.start();
    if (requestedProject && !handledRequest.current) {
      handledRequest.current = true;
      const current = store.getState().history.present;
      const differs =
        JSON.stringify(current) !== JSON.stringify(initialProject);
      if (
        (differs || persistence.getSnapshot().kind === "recovery_required") &&
        window.confirm(
          "Replace your current project with this example? Unsaved changes will be lost.",
        )
      ) {
        persistence.flush();
        store.getState().replaceProject(initialProject);
        persistence.afterExplicitReplacement();
      }
    }
    return () => {
      persistence.dispose();
      store.getState().exitPlayback();
    };
  }, [initialProject, persistence, requestedProject, store]);
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      const state = store.getState();
      if (event.key === "Escape" && state.mode === "present") {
        event.preventDefault();
        state.exitPlayback();
        return;
      }
      const target = event.target;
      if (
        target instanceof HTMLElement &&
        (target.closest("input, textarea, select, [contenteditable='true']") ||
          target.isContentEditable)
      )
        return;
      if (state.mode !== "edit") return;
      const command = event.metaKey || event.ctrlKey;
      if (command && !event.altKey && event.key.toLowerCase() === "z") {
        event.preventDefault();
        if (event.shiftKey) state.redo();
        else state.undo();
      } else if (command && !event.altKey && event.key.toLowerCase() === "y") {
        event.preventDefault();
        state.redo();
      } else if (
        !command &&
        !event.altKey &&
        (event.key === "Delete" || event.key === "Backspace")
      ) {
        if (!state.selectedNodeIds.length && !state.selectedEdgeIds.length)
          return;
        event.preventDefault();
        state.apply({
          type: "selection.delete",
          nodeIds: state.selectedNodeIds,
          edgeIds: state.selectedEdgeIds,
        });
        store.getState().select([], []);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [store]);
  const canvasRef = useRef<HTMLElement>(null);
  const flow = useReactFlow();
  const mode = useStore(store, (state) => state.mode);
  const desktop = useSyncExternalStore(
    subscribeToDesktop,
    isDesktop,
    () => true,
  );
  const [palettePreference, setPalettePreference] = useState<boolean | null>(
    null,
  );
  const [inspectorPreference, setInspectorPreference] = useState<
    boolean | null
  >(null);
  const showPalette = palettePreference ?? desktop;
  const showInspector = inspectorPreference ?? desktop;
  function addModule(type: string) {
    const definition = registry.get(type);
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!definition || !rect) return;
    const position = flow.screenToFlowPosition({
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
    });
    store.getState().apply({
      type: "node.add",
      node: {
        id: crypto.randomUUID(),
        moduleType: type,
        label: definition.title,
        position,
        config: registry.createConfig(type),
      },
    });
  }
  return (
    <div className="flex h-screen min-h-[600px] flex-col overflow-hidden bg-[#090b10] text-slate-100">
      <Taskbar
        store={store}
        registry={registry}
        persistence={persistence}
        clockFactory={clockFactory}
        showPalette={showPalette}
        showInspector={showInspector}
        onTogglePalette={() => setPalettePreference(!showPalette)}
        onToggleInspector={() => setInspectorPreference(!showInspector)}
      />
      <div className="relative flex min-h-0 flex-1">
        {showPalette && mode !== "present" && (
          <Palette
            registry={registry}
            onAdd={addModule}
            editable={mode === "edit"}
            presentations={presentations}
          />
        )}
        <div className="flex min-w-0 flex-1 flex-col">
          <Canvas
            store={store}
            registry={registry}
            canvasRef={canvasRef}
            presentations={presentations}
          />
          <Timeline store={store} />
        </div>
        {showInspector && mode !== "present" && (
          <Inspector store={store} registry={registry} />
        )}
      </div>
    </div>
  );
}
