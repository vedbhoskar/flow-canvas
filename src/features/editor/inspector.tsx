"use client";

import { useState, type FormEvent } from "react";
import { useStore } from "zustand";
import { IconAdjustmentsHorizontal } from "@tabler/icons-react";
import type { ModuleRegistry } from "../../core/modules/registry";
import type { ModuleDefinition } from "../../core/modules/contracts";
import type { VisualizerNode } from "../../core/project/schema";
import type { EditorStore } from "./editor";

const inputClass =
  "mt-1 w-full rounded-lg border border-white/10 bg-[#0c1018] px-3 py-2 text-sm text-slate-100 outline-none focus:border-violet-400";

function NodeForm({
  node,
  definition,
  store,
  readOnly,
}: {
  node: VisualizerNode;
  definition: ModuleDefinition;
  store: EditorStore;
  readOnly: boolean;
}) {
  const initial =
    typeof node.config === "object" &&
    node.config !== null &&
    !Array.isArray(node.config)
      ? node.config
      : {};
  const [label, setLabel] = useState(node.label);
  const [values, setValues] = useState<Record<string, string | boolean>>(() =>
    Object.fromEntries(
      definition.fields.map((field) => {
        const value = initial[field.key];
        return [
          field.key,
          field.kind === "boolean" ? value === true : String(value ?? ""),
        ];
      }),
    ),
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState("");
  const change = (key: string, value: string | boolean) =>
    setValues((current) => ({ ...current, [key]: value }));

  function submit(event: FormEvent) {
    event.preventDefault();
    if (readOnly) return;
    const nextErrors: Record<string, string> = {};
    const candidate: Record<string, string | number | boolean> = {};
    if (!label.trim() || label.trim().length > 120)
      nextErrors.label = "Node label must be 1–120 characters.";
    for (const field of definition.fields) {
      const value = values[field.key];
      switch (field.kind) {
        case "text":
          candidate[field.key] = typeof value === "string" ? value : "";
          break;
        case "number": {
          const text = typeof value === "string" ? value.trim() : "";
          const number = Number(text);
          if (
            !text ||
            !Number.isFinite(number) ||
            (field.min !== undefined && number < field.min) ||
            (field.max !== undefined && number > field.max)
          )
            nextErrors[field.key] =
              `${field.label} must be a valid number${field.min !== undefined ? ` of at least ${field.min}` : ""}.`;
          else candidate[field.key] = number;
          break;
        }
        case "boolean":
          candidate[field.key] = value === true;
          break;
        case "select":
          if (typeof value !== "string" || !field.options.includes(value))
            nextErrors[field.key] =
              `${field.label} must be one of the available options.`;
          else candidate[field.key] = value;
          break;
      }
    }
    const parsed = definition.configSchema.safeParse(candidate);
    if (!parsed.success)
      for (const issue of parsed.error.issues) {
        const key = String(issue.path[0] ?? "config");
        nextErrors[key] ??= issue.message;
      }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;
    const result = store.getState().apply({
      type: "node.update",
      nodeId: node.id,
      label: label.trim(),
      config: candidate,
    });
    setFormError(
      result.ok
        ? ""
        : (result.errors[0]?.message ?? "Could not save properties."),
    );
  }

  return (
    <form
      onSubmit={submit}
      className="min-h-0 flex-1 overflow-y-auto px-4 py-5"
    >
      <p className="mb-5 rounded-lg border border-violet-400/20 bg-violet-500/10 px-3 py-2 text-xs font-medium text-violet-200">
        {definition.title} · {node.id.slice(0, 8)}
      </p>
      <div className="mb-4">
        <label
          htmlFor="inspector-label"
          className="text-xs font-medium text-slate-300"
        >
          Node label
        </label>
        <input
          id="inspector-label"
          className={inputClass}
          value={label}
          onChange={(event) => setLabel(event.target.value)}
          disabled={readOnly}
        />
        {errors.label && (
          <p role="alert" className="mt-1 text-xs text-rose-300">
            {errors.label}
          </p>
        )}
      </div>
      {definition.fields.map((field) => {
        const id = `inspector-${node.id}-${field.key}`;
        const value = values[field.key];
        return (
          <div key={field.key} className="mb-4">
            <label htmlFor={id} className="text-xs font-medium text-slate-300">
              {field.label}
            </label>
            {field.kind === "text" &&
              (field.multiline ? (
                <textarea
                  id={id}
                  className={`${inputClass} min-h-20 resize-y`}
                  value={typeof value === "string" ? value : ""}
                  onChange={(event) => change(field.key, event.target.value)}
                  disabled={readOnly}
                />
              ) : (
                <input
                  id={id}
                  type="text"
                  className={inputClass}
                  value={typeof value === "string" ? value : ""}
                  onChange={(event) => change(field.key, event.target.value)}
                  disabled={readOnly}
                />
              ))}
            {field.kind === "number" && (
              <input
                id={id}
                type="number"
                min={field.min}
                max={field.max}
                className={inputClass}
                value={typeof value === "string" ? value : ""}
                onChange={(event) => change(field.key, event.target.value)}
                disabled={readOnly}
              />
            )}
            {field.kind === "boolean" && (
              <input
                id={id}
                type="checkbox"
                className="mt-2 block size-4 accent-violet-500"
                checked={value === true}
                onChange={(event) => change(field.key, event.target.checked)}
                disabled={readOnly}
              />
            )}
            {field.kind === "select" && (
              <select
                id={id}
                className={inputClass}
                value={typeof value === "string" ? value : ""}
                onChange={(event) => change(field.key, event.target.value)}
                disabled={readOnly}
              >
                {field.options.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            )}
            {errors[field.key] && (
              <p role="alert" className="mt-1 text-xs text-rose-300">
                {errors[field.key]}
              </p>
            )}
          </div>
        );
      })}
      {formError && (
        <p role="alert" className="mb-3 text-xs text-rose-300">
          {formError}
        </p>
      )}
      <button
        type="submit"
        disabled={readOnly}
        className="w-full rounded-lg bg-violet-600 px-3 py-2 text-sm font-semibold text-white hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-50"
      >
        Save properties
      </button>
      {readOnly && (
        <p className="mt-2 text-xs text-slate-500">
          Switch to Edit mode to change properties.
        </p>
      )}
    </form>
  );
}

export function Inspector({
  store,
  registry,
}: {
  store: EditorStore;
  registry: ModuleRegistry;
}) {
  const project = useStore(store, (state) => state.history.present);
  const selectedNodeId = useStore(store, (state) => state.selectedNodeIds[0]);
  const selectedEdgeId = useStore(store, (state) => state.selectedEdgeIds[0]);
  const mode = useStore(store, (state) => state.mode);
  const node = project.nodes.find((item) => item.id === selectedNodeId);
  const edge = project.edges.find((item) => item.id === selectedEdgeId);
  const definition = node && registry.get(node.moduleType);
  return (
    <aside
      aria-label="Inspector"
      className="absolute inset-y-0 right-0 z-20 flex w-72 shrink-0 flex-col border-l border-white/10 bg-[#11151d] shadow-xl shadow-black/30 xl:relative xl:w-80 xl:shadow-none"
    >
      <div className="border-b border-white/10 px-4 py-4">
        <h2 className="text-sm font-semibold">Inspector</h2>
        <p className="mt-1 text-xs text-slate-500">Properties and live data</p>
      </div>
      {node && definition && (
        <NodeForm
          key={`${node.id}:${node.label}:${JSON.stringify(node.config)}`}
          node={node}
          definition={definition}
          store={store}
          readOnly={mode !== "edit"}
        />
      )}
      {node && !definition && (
        <p role="alert" className="p-4 text-sm text-rose-300">
          Unknown module type: {node.moduleType}
        </p>
      )}
      {!node && edge && (
        <div className="p-4 text-sm">
          <p className="font-semibold">Connection</p>
          <p className="mt-2 break-all text-slate-400">
            {edge.sourceNodeId} → {edge.targetNodeId}
          </p>
        </div>
      )}
      {!node && !edge && (
        <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
          <IconAdjustmentsHorizontal className="mb-4 size-9 text-slate-600" />
          <h3 className="text-sm font-medium">Nothing selected</h3>
          <p className="mt-2 text-xs leading-5 text-slate-500">
            Select a module or connection to inspect its settings and activity.
          </p>
        </div>
      )}
    </aside>
  );
}
