"use client";

import {
  useRef,
  useState,
  useSyncExternalStore,
  type ChangeEvent,
} from "react";
import { useStore } from "zustand";
import { useReactFlow } from "@xyflow/react";
import {
  IconFile,
  IconFilePlus,
  IconFolderOpen,
  IconDownload,
} from "@tabler/icons-react";
import {
  parseProjectJson,
  serializeProject,
} from "../../core/project/serialize";
import type { ModuleRegistry } from "../../core/modules/registry";
import type { EditorStore } from "./editor";
import type { ProjectPersistence, SaveStatus } from "./persistence";

const loading: SaveStatus = { kind: "loading" };

export function ProjectFiles({
  store,
  registry,
  persistence,
}: {
  store: EditorStore;
  registry: ModuleRegistry;
  persistence: ProjectPersistence;
}) {
  const mode = useStore(store, (state) => state.mode);
  const status = useSyncExternalStore(
    persistence.subscribe,
    persistence.getSnapshot,
    () => loading,
  );
  const details = useRef<HTMLDetailsElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const flow = useReactFlow();
  const [error, setError] = useState("");
  const close = () => details.current?.removeAttribute("open");
  const confirmReplacement = () => {
    const state = store.getState();
    const project = state.history.present;
    return (
      !(
        project.nodes.length ||
        project.edges.length ||
        state.history.past.length ||
        status.kind === "recovery_required"
      ) ||
      window.confirm(
        "Replace the current project? The existing canvas and unsaved changes will be removed.",
      )
    );
  };

  function replace(project: unknown) {
    if (!confirmReplacement()) return;
    persistence.flush();
    const result = store.getState().replaceProject(project);
    if (!result.ok) {
      setError(result.errors[0]?.message ?? "Could not open project.");
      return;
    }
    persistence.afterExplicitReplacement();
    void flow.setViewport(result.value.viewport ?? { x: 0, y: 0, zoom: 1 });
    setError("");
    close();
  }

  function createNew() {
    replace({
      schemaVersion: 1,
      id: crypto.randomUUID(),
      name: "Untitled project",
      nodes: [],
      edges: [],
      scenarios: [],
    });
  }

  async function importFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (file.size > 2_000_000) {
      setError("Project file exceeds 2 MB.");
      return;
    }
    let text: string;
    try {
      text = await file.text();
    } catch {
      setError("Could not read the selected file.");
      return;
    }
    const parsed = parseProjectJson(text, registry);
    if (!parsed.ok) {
      setError(parsed.errors[0]?.message ?? "Invalid project file.");
      return;
    }
    replace(parsed.value);
  }

  function exportFile() {
    const { history, viewport } = store.getState();
    const blob = new Blob([serializeProject(history.present, viewport)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${
      history.present.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "") || "flow-canvas"
    }.json`;
    anchor.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
    close();
  }

  return (
    <div className="relative shrink-0">
      <details ref={details} className="group">
        <summary
          aria-label="Project files"
          className="flex size-8 cursor-pointer list-none items-center justify-center rounded-lg text-slate-300 hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-violet-400 [&::-webkit-details-marker]:hidden"
        >
          <IconFile size={18} />
        </summary>
        <div className="absolute left-0 top-11 z-30 w-60 rounded-xl border border-white/10 bg-[#171d29] p-2 shadow-2xl shadow-black/50">
          <p className="px-2 py-2 text-xs text-slate-400">
            Local save: {status.kind.replaceAll("_", " ")}
          </p>
          {status.message && (
            <p className="px-2 pb-2 text-xs text-amber-300">{status.message}</p>
          )}
          <button
            type="button"
            disabled={mode !== "edit"}
            onClick={createNew}
            className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm hover:bg-white/10 disabled:opacity-50"
          >
            <IconFilePlus size={17} />
            New project
          </button>
          <button
            type="button"
            disabled={mode !== "edit"}
            onClick={() => fileInput.current?.click()}
            className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm hover:bg-white/10 disabled:opacity-50"
          >
            <IconFolderOpen size={17} />
            Open project
          </button>
          <button
            type="button"
            onClick={exportFile}
            className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm hover:bg-white/10"
          >
            <IconDownload size={17} />
            Export JSON
          </button>
        </div>
      </details>
      <input
        ref={fileInput}
        type="file"
        accept=".json,application/json"
        aria-label="Choose project JSON"
        className="sr-only"
        onChange={(event) => void importFile(event)}
      />
      {error && (
        <p
          role="alert"
          className="absolute left-0 top-10 z-40 w-64 rounded-lg border border-rose-400/30 bg-[#25151d] p-3 text-xs text-rose-200"
        >
          {error}
        </p>
      )}
    </div>
  );
}
