"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useStore } from "zustand";
import {
  IconLayoutSidebarLeftCollapse,
  IconLayoutSidebarRightCollapse,
  IconArrowBackUp,
  IconArrowForwardUp,
  IconPlayerPlay,
  IconPlayerPause,
  IconPlayerTrackNext,
  IconZoomIn,
  IconZoomOut,
  IconFocusCentered,
} from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import type { EditorStore } from "./editor";

export function Taskbar({
  store,
  showPalette,
  showInspector,
  onTogglePalette,
  onToggleInspector,
}: {
  store: EditorStore;
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
          disabled
          title="Canvas controls arrive with the editor"
        >
          <IconZoomOut />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Zoom in"
          disabled
          title="Canvas controls arrive with the editor"
        >
          <IconZoomIn />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Fit view"
          disabled
          title="Canvas controls arrive with the editor"
        >
          <IconFocusCentered />
        </Button>
      </div>
      <div className="hidden items-center gap-1 rounded-lg border border-white/10 bg-white/[.03] p-1 md:flex">
        <Button
          variant="ghost"
          size="icon"
          aria-label="Play"
          disabled
          title="Playback is under construction"
        >
          <IconPlayerPlay />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Pause"
          disabled
          title="Playback is under construction"
        >
          <IconPlayerPause />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Step"
          disabled
          title="Playback is under construction"
        >
          <IconPlayerTrackNext />
        </Button>
      </div>
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
