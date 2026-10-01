"use client";

import { useRef, useState, useSyncExternalStore } from "react";
import { useReactFlow } from "@xyflow/react";
import type { ModuleRegistry } from "../../core/modules/registry";
import type { VisualizerProject } from "../../core/project/schema";
import { createEditorStore } from "./store";
import { Taskbar } from "./taskbar";
import { Palette } from "./palette";
import { Inspector } from "./inspector";
import { Timeline } from "./timeline";
import { Canvas } from "./canvas";

export type EditorStore = ReturnType<typeof createEditorStore>;

function subscribeToDesktop(onChange: () => void) {
  if (typeof window.matchMedia !== "function") return () => {};
  const query = window.matchMedia("(min-width: 768px)");
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

function isDesktop() {
  return (
    typeof window.matchMedia !== "function" ||
    window.matchMedia("(min-width: 768px)").matches
  );
}

export function Editor({
  registry,
  initialProject,
}: {
  registry: ModuleRegistry;
  initialProject: VisualizerProject;
}) {
  const [store] = useState(() => createEditorStore(initialProject, registry));
  const canvasRef = useRef<HTMLElement>(null);
  const flow = useReactFlow();
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
        showPalette={showPalette}
        showInspector={showInspector}
        onTogglePalette={() => setPalettePreference(!showPalette)}
        onToggleInspector={() => setInspectorPreference(!showInspector)}
      />
      <div className="relative flex min-h-0 flex-1">
        {showPalette && <Palette registry={registry} onAdd={addModule} />}
        <div className="flex min-w-0 flex-1 flex-col">
          <Canvas store={store} registry={registry} canvasRef={canvasRef} />
          <Timeline />
        </div>
        {showInspector && <Inspector />}
      </div>
    </div>
  );
}
