"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useStore } from "zustand";
import { useReactFlow } from "@xyflow/react";
import {
  IconLayoutSidebarLeftCollapse,
  IconLayoutSidebarRightCollapse,
  IconArrowBackUp,
  IconArrowForwardUp,
  IconZoomIn,
  IconZoomOut,
  IconFocusCentered,
  IconCopy,
  IconTrash,
} from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import type { EditorStore } from "./editor";
import type { ModuleRegistry } from "../../core/modules/registry";
import type { ProjectPersistence } from "./persistence";
import { ProjectFiles } from "./project-files";
import { PlaybackControls } from "./playback-controls";
import type { PlaybackClock } from "../../core/scenario/controller";

export function Taskbar({
  store,
  registry,
  persistence,
  clockFactory,
  showPalette,
  showInspector,
  onTogglePalette,
  onToggleInspector,
}: {
  store: EditorStore;
  registry: ModuleRegistry;
  persistence: ProjectPersistence;
  clockFactory(): PlaybackClock;
  showPalette: boolean;
  showInspector: boolean;
  onTogglePalette(): void;
  onToggleInspector(): void;
}) {
  const name = useStore(store, (state) => state.history.present.name);
  const canUndo = useStore(
    store,
    (state) => state.history.past.length > 0 && state.mode === "edit",
  );
  const canRedo = useStore(
    store,
    (state) => state.history.future.length > 0 && state.mode === "edit",
  );
  const mode = useStore(store, (state) => state.mode);
  const selectedNodeIds = useStore(store, (state) => state.selectedNodeIds);
  const selectedEdgeIds = useStore(store, (state) => state.selectedEdgeIds);
  const flow = useReactFlow();
  const [draft, setDraft] = useState<string | null>(null);
  function submit(event: FormEvent) {
    event.preventDefault();
    const result = store
      .getState()
      .apply({ type: "project.rename", name: (draft ?? name).trim() });
    if (result.ok) setDraft(null);
  }
  return (
    <header className="z-10 flex h-16 shrink-0 items-center gap-3 border-b border-white/10 bg-[#11151d] px-4 shadow-lg shadow-black/10">
      <h1 className="sr-only">Flow Canvas studio</h1>
      <Link
        href="/"
        className="flex shrink-0 items-center gap-2 font-semibold tracking-tight"
      >
        <span className="flex size-8 items-center justify-center rounded-lg bg-violet-500 text-lg">
          ◇
        </span>
        <span className="hidden sm:inline">Flow Canvas</span>
      </Link>
      <div className="mx-2 h-6 w-px bg-white/10" />
      <Button
        variant="ghost"
        size="icon"
        aria-label="Toggle modules"
        aria-expanded={showPalette}
        onClick={onTogglePalette}
      >
        <IconLayoutSidebarLeftCollapse />
      </Button>
      <form onSubmit={submit} className="min-w-0 flex-1 sm:max-w-52">
        <input
          aria-label="Project name"
          className="w-full rounded-md border border-transparent bg-transparent px-2 py-1 text-sm font-medium text-slate-100 outline-none hover:border-white/10 focus:border-violet-400"
          value={draft ?? name}
          onChange={(event) => setDraft(event.target.value)}
          onBlur={() => setDraft(null)}
        />
      </form>
      <ProjectFiles
        store={store}
        registry={registry}
        persistence={persistence}
      />
      <div className="hidden items-center gap-1 rounded-lg border border-white/10 bg-white/[.03] p-1 sm:flex">
        <Button
          variant="ghost"
          size="icon"
          aria-label="Undo"
          disabled={!canUndo}
          onClick={() => store.getState().undo()}
        >
          <IconArrowBackUp />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Redo"
          disabled={!canRedo}
          onClick={() => store.getState().redo()}
        >
          <IconArrowForwardUp />
        </Button>
      </div>
      <div className="hidden items-center gap-1 rounded-lg border border-white/10 bg-white/[.03] p-1 lg:flex">
        <Button
          variant="ghost"
          size="icon"
          aria-label="Zoom out"
          onClick={() => void flow.zoomOut()}
        >
          <IconZoomOut />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Zoom in"
          onClick={() => void flow.zoomIn()}
        >
          <IconZoomIn />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Fit view"
          onClick={() => void flow.fitView({ duration: 300 })}
        >
          <IconFocusCentered />
        </Button>
      </div>
      <div className="hidden items-center gap-1 rounded-lg border border-white/10 bg-white/[.03] p-1 md:flex">
        <Button
          variant="ghost"
          size="icon"
          aria-label="Duplicate selection"
          disabled={mode !== "edit" || selectedNodeIds.length === 0}
          onClick={() => {
            const project = store.getState().history.present;
            const selected = new Set(selectedNodeIds);
            const newNodeIds = Object.fromEntries(
              selectedNodeIds.map((id) => [id, crypto.randomUUID()]),
            );
            const newEdgeIds = Object.fromEntries(
              project.edges
                .filter(
                  (edge) =>
                    selected.has(edge.sourceNodeId) &&
                    selected.has(edge.targetNodeId),
                )
                .map((edge) => [edge.id, crypto.randomUUID()]),
            );
            store.getState().apply({
              type: "selection.duplicate",
              nodeIds: selectedNodeIds,
              newNodeIds,
              newEdgeIds,
            });
          }}
        >
          <IconCopy />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Delete selection"
          disabled={
            mode !== "edit" ||
            (selectedNodeIds.length === 0 && selectedEdgeIds.length === 0)
          }
          onClick={() => {
            store.getState().apply({
              type: "selection.delete",
              nodeIds: selectedNodeIds,
              edgeIds: selectedEdgeIds,
            });
            store.getState().select([], []);
          }}
        >
          <IconTrash />
        </Button>
      </div>
      <PlaybackControls store={store} clockFactory={clockFactory} />
      <span className="rounded-full border border-violet-400/30 bg-violet-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-violet-300">
        {mode}
      </span>
      <Button
        variant="ghost"
        size="icon"
        aria-label="Toggle inspector"
        aria-expanded={showInspector}
        onClick={onToggleInspector}
      >
        <IconLayoutSidebarRightCollapse />
      </Button>
    </header>
  );
}
