"use client";

import { useState } from "react";
import { useStore } from "zustand";
import { IconChevronDown, IconClock } from "@tabler/icons-react";
import { orderedEvents } from "../../core/scenario/reducer";
import type { ScenarioEvent } from "../../core/scenario/events";
import type { EditorStore } from "./editor";

function eventText(event: ScenarioEvent): string {
  switch (event.type) {
    case "node.status":
      return `Node ${event.nodeId}: ${event.status}`;
    case "edge.status":
      return `Connection ${event.edgeId}: ${event.status}`;
    case "metric.set":
      return `Metric ${event.nodeId}: ${event.value}`;
    case "log.append":
      return event.message;
  }
}

export function Timeline({ store }: { store: EditorStore }) {
  const [open, setOpen] = useState(true);
  const [filterId, setFilterId] = useState("");
  const project = useStore(store, (state) => state.history.present);
  const playback = useStore(store, (state) => state.playback);
  const scenario = project.scenarios.find(
    (item) => item.id === playback?.scenarioId,
  );
  const snapshot = playback?.snapshot;
  const elapsed = snapshot?.elapsedMs ?? 0;
  const duration = scenario?.durationMs ?? 0;
  const activeFilter = project.nodes.some((node) => node.id === filterId)
    ? filterId
    : "";
  const visible =
    scenario && snapshot
      ? orderedEvents(scenario.events)
          .slice(0, snapshot.cursor)
          .filter(
            (event) =>
              !activeFilter ||
              ("nodeId" in event
                ? !event.nodeId || event.nodeId === activeFilter
                : true),
          )
      : [];
  const latestLog = snapshot?.overlay.log.at(-1)?.message ?? "";
  return (
    <section
      aria-label="Timeline"
      className="shrink-0 border-t border-white/10 bg-[#11151d]"
    >
      <div className="flex h-11 items-center gap-3 border-b border-white/5 px-4">
        <IconClock className="size-4 text-violet-300" />
        <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-400">
          Event timeline
        </h2>
        <span className="rounded-full bg-white/5 px-2 py-0.5 text-[10px] text-slate-500">
          {visible.length} events
        </span>
        {scenario && (
          <span className="ml-auto text-xs tabular-nums text-violet-200">
            {(elapsed / 1000).toFixed(1)}s / {(duration / 1000).toFixed(1)}s ·{" "}
            {snapshot?.status}
          </span>
        )}
        <button
          type="button"
          aria-label={open ? "Collapse timeline" : "Expand timeline"}
          onClick={() => setOpen(!open)}
          className={`${scenario ? "" : "ml-auto"} rounded-md p-1 text-slate-400 hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-violet-400`}
        >
          <IconChevronDown
            className={`size-4 transition-transform ${open ? "" : "rotate-180"}`}
          />
        </button>
      </div>
      {open && (
        <div className="h-32 overflow-auto px-4 py-3 text-xs text-slate-400">
          {!scenario && (
            <p className="pt-9 text-center">
              Choose a scenario and enter Simulate to see events here.
            </p>
          )}
          {scenario && (
            <>
              <div className="mb-2 flex items-center gap-3">
                <progress
                  aria-label="Scenario progress"
                  max={Math.max(1, duration)}
                  value={elapsed}
                  className="h-1.5 flex-1 accent-violet-500"
                />
                <select
                  aria-label="Filter timeline by node"
                  value={activeFilter}
                  onChange={(event) => setFilterId(event.target.value)}
                  className="max-w-32 rounded border border-white/10 bg-[#0c1018] px-2 py-1 text-xs"
                >
                  <option value="">All nodes</option>
                  {project.nodes.map((node) => (
                    <option key={node.id} value={node.id}>
                      {node.label}
                    </option>
                  ))}
                </select>
              </div>
              {visible.length === 0 && (
                <p className="py-5 text-center">No events have fired yet.</p>
              )}
              <ol className="space-y-1">
                {visible.map((event) => (
                  <li
                    key={event.id}
                    className="flex gap-3 rounded-md bg-white/[.03] px-2 py-1.5"
                  >
                    <span className="w-12 shrink-0 tabular-nums text-violet-300">
                      {(event.atMs / 1000).toFixed(1)}s
                    </span>
                    <span>{eventText(event)}</span>
                  </li>
                ))}
              </ol>
            </>
          )}
        </div>
      )}
      <span aria-live="polite" className="sr-only">
        {latestLog}
      </span>
    </section>
  );
}
