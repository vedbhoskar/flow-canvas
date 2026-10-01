import { IconAdjustmentsHorizontal } from "@tabler/icons-react";

export function Inspector() {
  return (
    <aside
      aria-label="Inspector"
      className="absolute inset-y-0 right-0 z-20 flex w-72 shrink-0 flex-col border-l border-white/10 bg-[#11151d] shadow-xl shadow-black/30 lg:relative lg:shadow-none xl:w-80"
    >
      <div className="border-b border-white/10 px-4 py-4">
        <h2 className="text-sm font-semibold">Inspector</h2>
        <p className="mt-1 text-xs text-slate-500">Properties and live data</p>
      </div>
      <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
        <IconAdjustmentsHorizontal className="mb-4 size-9 text-slate-600" />
        <h3 className="text-sm font-medium">Nothing selected</h3>
        <p className="mt-2 text-xs leading-5 text-slate-500">
          Select a module or connection to inspect its settings and activity.
        </p>
      </div>
    </aside>
  );
}
