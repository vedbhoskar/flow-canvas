"use client";

import { useState } from "react";
import { useStore } from "zustand";
import {
  IconPlayerPlay,
  IconPlayerPause,
  IconPlayerTrackNext,
  IconPlayerSkipBack,
  IconPresentation,
  IconPlayerStop,
  IconActivity,
} from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import type { PlaybackClock } from "../../core/scenario/controller";
import type { EditorStore } from "./editor";

export function PlaybackControls({
  store,
  clockFactory,
}: {
  store: EditorStore;
  clockFactory(): PlaybackClock;
}) {
  const scenarios = useStore(store, (state) => state.history.present.scenarios);
  const mode = useStore(store, (state) => state.mode);
  const playback = useStore(store, (state) => state.playback);
  const [selected, setSelected] = useState("");
  const [error, setError] = useState("");
  const scenarioId = scenarios.some((scenario) => scenario.id === selected)
    ? selected
    : (scenarios[0]?.id ?? "");
  const status = playback?.snapshot.status;

  function enter(targetMode: "simulate" | "present", id = scenarioId) {
    if (!id) return;
    if (playback?.scenarioId === id && mode !== "edit") {
      store.getState().setMode(targetMode);
      return;
    }
    const result = store
      .getState()
      .beginPlayback(id, clockFactory(), targetMode);
    setError(
      result.ok
        ? ""
        : (result.errors[0]?.message ?? "Could not start simulation."),
    );
  }

  return (
    <div className="flex shrink-0 items-center gap-1">
      <select
        aria-label="Scenario"
        value={scenarioId}
        onChange={(event) => {
          setSelected(event.target.value);
          if (mode !== "edit") enter(mode, event.target.value);
        }}
        disabled={!scenarios.length}
        className="hidden max-w-36 rounded-lg border border-white/10 bg-[#0c1018] px-2 py-1.5 text-xs text-slate-200 lg:block"
      >
        {scenarios.length === 0 && <option value="">No scenarios</option>}
        {scenarios.map((scenario) => (
          <option key={scenario.id} value={scenario.id}>
            {scenario.name}
          </option>
        ))}
      </select>
      <Button
        variant="ghost"
        size="icon"
        aria-label="Simulate"
        title={
          scenarios.length
            ? "Enter simulation"
            : "Add a scenario to enable simulation"
        }
        disabled={!scenarios.length || mode === "simulate"}
        onClick={() => enter("simulate")}
      >
        <IconActivity />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        aria-label="Present"
        title={
          scenarios.length
            ? "Presentation mode"
            : "Add a scenario to enable presentation"
        }
        disabled={!scenarios.length || mode === "present"}
        onClick={() => enter("present")}
        className="hidden sm:inline-flex"
      >
        <IconPresentation />
      </Button>
      <span className="mx-1 hidden h-6 w-px bg-white/10 sm:block" />
      <Button
        variant="ghost"
        size="icon"
        aria-label="Play"
        title={
          playback ? "Play scenario" : "Enter Simulate mode to enable playback"
        }
        disabled={!playback || status === "playing" || status === "completed"}
        onClick={() => store.getState().play()}
      >
        <IconPlayerPlay />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        aria-label="Pause"
        disabled={status !== "playing"}
        onClick={() => store.getState().pause()}
        className="hidden sm:inline-flex"
      >
        <IconPlayerPause />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        aria-label="Step"
        disabled={!playback || status === "completed"}
        onClick={() => store.getState().step()}
        className="hidden md:inline-flex"
      >
        <IconPlayerTrackNext />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        aria-label="Restart"
        disabled={!playback || status === "ready"}
        onClick={() => store.getState().restart()}
        className="hidden md:inline-flex"
      >
        <IconPlayerSkipBack />
      </Button>
      {mode !== "edit" && (
        <Button
          variant="ghost"
          size="icon"
          aria-label="Exit playback"
          onClick={() => store.getState().exitPlayback()}
        >
          <IconPlayerStop />
        </Button>
      )}
      {error && (
        <p
          role="alert"
          className="absolute right-16 top-14 z-30 rounded-lg bg-rose-950 p-2 text-xs text-rose-200"
        >
          {error}
        </p>
      )}
    </div>
  );
}
