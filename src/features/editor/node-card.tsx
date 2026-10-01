import { Handle, Position, type NodeProps } from "@xyflow/react";
import type { ModuleFlowNode } from "../../adapters/react-flow/project";
import {
  fallbackIcon,
  type ModulePresentationMap,
} from "../../modules/presentation";

const statusColor = {
  idle: "border-white/15",
  active: "border-cyan-400 shadow-cyan-500/20",
  success: "border-emerald-400 shadow-emerald-500/20",
  warning: "border-amber-400 shadow-amber-500/20",
  error: "border-rose-400 shadow-rose-500/20",
};

export function NodeCard({
  data,
  selected,
  presentations,
}: NodeProps<ModuleFlowNode> & { presentations: ModulePresentationMap }) {
  const Icon = presentations[data.moduleType]?.icon ?? fallbackIcon;
  return (
    <div
      className={`min-w-48 rounded-xl border bg-[#171d29] px-4 py-3 text-slate-100 shadow-lg shadow-black/25 ${statusColor[data.status]} ${selected ? "ring-2 ring-violet-400" : ""}`}
      aria-label={`${data.label}, ${data.title}, ${data.status}`}
    >
      <p className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-widest text-violet-300">
        <Icon size={15} />
        {data.category}
      </p>
      <p className="mt-1 text-sm font-semibold">{data.label}</p>
      <p className="mt-1 text-xs text-slate-400">{data.title}</p>
      {data.metricValue !== undefined && (
        <p className="mt-3 text-2xl font-semibold tabular-nums text-violet-200">
          {data.metricValue}
          <span className="ml-1 text-xs font-normal text-slate-400">
            {data.metricUnit}
          </span>
        </p>
      )}
      {data.ports.map((port, index) => (
        <Handle
          key={port.id}
          id={port.id}
          type={port.direction === "input" ? "target" : "source"}
          position={port.direction === "input" ? Position.Left : Position.Right}
          style={{ top: `${((index + 1) / (data.ports.length + 1)) * 100}%` }}
          className="!size-2.5 !border-2 !border-[#171d29] !bg-violet-400"
          title={`${port.direction} ${port.id}`}
        />
      ))}
      <span className="sr-only">Status: {data.status}</span>
    </div>
  );
}
