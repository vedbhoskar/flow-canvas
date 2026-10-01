"use client";

import { useState } from "react";
import { IconChevronDown, IconClock } from "@tabler/icons-react";

export function Timeline() {
  const [open, setOpen] = useState(true);
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
          0 events
        </span>
        <button
          type="button"
          aria-label={open ? "Collapse timeline" : "Expand timeline"}
          onClick={() => setOpen(!open)}
          className="ml-auto rounded-md p-1 text-slate-400 hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-violet-400"
        >
          <IconChevronDown
            className={`size-4 transition-transform ${open ? "" : "rotate-180"}`}
          />
        </button>
      </div>
      {open && (
        <div className="flex h-28 items-center justify-center text-xs text-slate-500">
          Run a scenario to see events here.
        </div>
      )}
    </section>
  );
}
