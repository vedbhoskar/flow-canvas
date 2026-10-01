"use client";

import { useState, useSyncExternalStore } from "react";
import type { ModuleRegistry } from "../../core/modules/registry";
import type { VisualizerProject } from "../../core/project/schema";
import { createEditorStore } from "./store";
import { Taskbar } from "./taskbar";
import { Palette } from "./palette";
import { Inspector } from "./inspector";
import { Timeline } from "./timeline";

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
        {showPalette && <Palette registry={registry} />}
        <div className="flex min-w-0 flex-1 flex-col">
          <main
            aria-label="Canvas"
            className="relative min-h-0 flex-1 overflow-hidden bg-[#0c1018]"
            style={{
              backgroundImage: "radial-gradient(#26303f 1px, transparent 1px)",
              backgroundSize: "22px 22px",
            }}
          >
            <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
              <span className="mb-5 rounded-2xl border border-violet-400/25 bg-violet-500/10 p-4 text-3xl text-violet-300">
                ◇
              </span>
              <h2 className="text-2xl font-semibold tracking-tight">
                Your canvas is ready
              </h2>
              <p className="mt-2 max-w-sm text-sm leading-6 text-slate-400">
                Choose a module from the library to start mapping a system.
                Canvas editing is the next implementation slice.
              </p>
            </div>
            <div className="absolute bottom-4 left-4 rounded-lg border border-white/10 bg-[#151b27]/90 px-3 py-2 text-xs text-slate-400">
              100% · Fit to view
            </div>
          </main>
          <Timeline />
        </div>
        {showInspector && <Inspector />}
      </div>
    </div>
  );
}
