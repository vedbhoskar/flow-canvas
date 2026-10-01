"use client";

import { useMemo, useState } from "react";
import { IconSearch } from "@tabler/icons-react";
import type { ModuleRegistry } from "../../core/modules/registry";
import {
  fallbackIcon,
  type ModulePresentationMap,
} from "../../modules/presentation";

export function Palette({
  registry,
  onAdd,
  editable = true,
  presentations = {},
}: {
  registry: ModuleRegistry;
  onAdd(type: string): void;
  editable?: boolean;
  presentations?: ModulePresentationMap;
}) {
  const [query, setQuery] = useState("");
  const modules = useMemo(
    () =>
      registry
        .list()
        .filter((module) =>
          `${module.title} ${module.category}`
            .toLowerCase()
            .includes(query.toLowerCase()),
        ),
    [query, registry],
  );
  return (
    <aside
      aria-label="Modules"
      className="absolute inset-y-0 left-0 z-20 flex w-60 shrink-0 flex-col border-r border-white/10 bg-[#11151d] shadow-xl shadow-black/30 xl:relative xl:w-64 xl:shadow-none"
    >
      <div className="border-b border-white/10 px-4 py-4">
        <h2 className="text-sm font-semibold">Module library</h2>
        <p className="mt-1 text-xs text-slate-500">
          Building blocks for your story
        </p>
      </div>
      <div className="relative mx-3 my-3">
        <IconSearch className="absolute left-3 top-2.5 size-4 text-slate-500" />
        <input
          type="search"
          aria-label="Search modules"
          placeholder="Search modules..."
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          className="h-9 w-full rounded-lg border border-white/10 bg-[#0c1018] pl-9 pr-3 text-sm outline-none placeholder:text-slate-600 focus:border-violet-400"
        />
      </div>
      <div className="min-h-0 overflow-auto px-3 pb-4">
        {modules.length === 0 && (
          <p className="px-2 py-6 text-sm text-slate-500">
            No modules match your search.
          </p>
        )}
        {modules.map((module) => {
          const Icon = presentations[module.type]?.icon ?? fallbackIcon;
          return (
            <button
              key={module.type}
              type="button"
              draggable={editable}
              disabled={!editable}
              title={
                editable
                  ? "Click or drag onto the canvas"
                  : "Editing is available in Edit mode"
              }
              onDragStart={(event) =>
                event.dataTransfer.setData(
                  "application/flow-canvas-module",
                  module.type,
                )
              }
              onClick={() => onAdd(module.type)}
              className="mb-1 flex w-full items-center gap-3 rounded-lg border border-transparent px-2 py-2 text-left text-sm text-slate-300 hover:border-white/10 hover:bg-white/5 focus-visible:outline-2 focus-visible:outline-violet-400"
            >
              <span className="rounded-md border border-white/10 bg-white/5 p-1.5 text-violet-300">
                <Icon size={17} />
              </span>
              <span className="flex-1">
                <span className="block font-medium">{module.title}</span>
                <span className="block text-xs text-slate-500">
                  {module.category}
                </span>
              </span>
              <span className="text-slate-600">+</span>
            </button>
          );
        })}
      </div>
    </aside>
  );
}
