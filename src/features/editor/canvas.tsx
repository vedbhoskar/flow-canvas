"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type DragEvent,
  type RefObject,
} from "react";
import { useStore } from "zustand";
import {
  ReactFlow,
  Background,
  BackgroundVariant,
  ConnectionMode,
  type Connection,
  type EdgeChange,
  type NodeChange,
  type NodeProps,
  useReactFlow,
} from "@xyflow/react";
import type { ModuleRegistry } from "../../core/modules/registry";
import {
  projectToFlow,
  type ModuleFlowNode,
  type ModuleFlowEdge,
} from "../../adapters/react-flow/project";
import type { EditorStore } from "./editor";
import { NodeCard } from "./node-card";
import type { ModulePresentationMap } from "../../modules/presentation";

export function Canvas({
  store,
  registry,
  canvasRef,
  presentations,
}: {
  store: EditorStore;
  registry: ModuleRegistry;
  canvasRef: RefObject<HTMLElement | null>;
  presentations: ModulePresentationMap;
}) {
  const nodeTypes = useMemo(
    () => ({
      module: (props: NodeProps<ModuleFlowNode>) => (
        <NodeCard {...props} presentations={presentations} />
      ),
    }),
    [presentations],
  );
  const project = useStore(store, (state) => state.history.present);
  const fitInitialProject = useRef(project.nodes.length > 0);
  const initialFitTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (initialFitTimer.current) clearTimeout(initialFitTimer.current);
    },
    [],
  );
  const selectedNodeIds = useStore(store, (state) => state.selectedNodeIds);
  const selectedEdgeIds = useStore(store, (state) => state.selectedEdgeIds);
  const movementDraft = useStore(store, (state) => state.movementDraft);
  const mode = useStore(store, (state) => state.mode);
  const overlay = useStore(store, (state) => state.playback?.snapshot.overlay);
  const flow = useReactFlow<ModuleFlowNode>();
  useEffect(() => {
    if (mode !== "present" || project.nodes.length === 0) return;
    const timer = setTimeout(() => {
      void flow.fitView({ padding: 0.17, maxZoom: 1.1, duration: 0 });
    }, 120);
    return () => clearTimeout(timer);
  }, [flow, mode, project.id, project.nodes.length]);
  const [error, setError] = useState("");
  const projected = useMemo(
    () =>
      projectToFlow(
        project,
        registry,
        selectedNodeIds,
        selectedEdgeIds,
        movementDraft,
        overlay,
      ),
    [
      project,
      registry,
      selectedNodeIds,
      selectedEdgeIds,
      movementDraft,
      overlay,
    ],
  );
  const editable = mode === "edit";

  const onNodesChange = useCallback(
    (changes: NodeChange<ModuleFlowNode>[]) => {
      const positions = changes.flatMap((change) =>
        change.type === "position" && change.position
          ? [{ nodeId: change.id, position: change.position }]
          : [],
      );
      if (positions.length) store.getState().draftMove(positions);
      const selection = changes.filter((change) => change.type === "select");
      if (selection.length) {
        const state = store.getState();
        const selected = new Set(state.selectedNodeIds);
        for (const change of selection) {
          if (change.selected) selected.add(change.id);
          else selected.delete(change.id);
        }
        state.select([...selected], state.selectedEdgeIds);
      }
    },
    [store],
  );

  const onEdgesChange = useCallback(
    (changes: EdgeChange<ModuleFlowEdge>[]) => {
      const selection = changes.filter((change) => change.type === "select");
      if (!selection.length) return;
      const state = store.getState();
      const selected = new Set(state.selectedEdgeIds);
      for (const change of selection) {
        if (change.selected) selected.add(change.id);
        else selected.delete(change.id);
      }
      state.select(state.selectedNodeIds, [...selected]);
    },
    [store],
  );

  const canConnect = useCallback(
    (connection: Connection | ModuleFlowEdge) => {
      const source = project.nodes.find(
        (node) => node.id === connection.source,
      );
      const target = project.nodes.find(
        (node) => node.id === connection.target,
      );
      const sourcePort =
        source &&
        registry
          .get(source.moduleType)
          ?.ports.find((port) => port.id === connection.sourceHandle);
      const targetPort =
        target &&
        registry
          .get(target.moduleType)
          ?.ports.find((port) => port.id === connection.targetHandle);
      return !!(
        editable &&
        source &&
        target &&
        source.id !== target.id &&
        sourcePort &&
        targetPort &&
        sourcePort.direction === "output" &&
        targetPort.direction === "input" &&
        (sourcePort.dataType === "any" ||
          targetPort.dataType === "any" ||
          sourcePort.dataType === targetPort.dataType)
      );
    },
    [project, registry, editable],
  );

  const connect = useCallback(
    (connection: Connection) => {
      if (
        !canConnect(connection) ||
        !connection.sourceHandle ||
        !connection.targetHandle
      ) {
        setError("These ports cannot be connected.");
        return;
      }
      const result = store.getState().apply({
        type: "edge.connect",
        edge: {
          id: crypto.randomUUID(),
          sourceNodeId: connection.source,
          sourcePortId: connection.sourceHandle,
          targetNodeId: connection.target,
          targetPortId: connection.targetHandle,
        },
      });
      setError(
        result.ok ? "" : (result.errors[0]?.message ?? "Connection failed."),
      );
    },
    [canConnect, store],
  );

  const drop = useCallback(
    (event: DragEvent<HTMLElement>) => {
      event.preventDefault();
      if (!editable) return;
      const moduleType = event.dataTransfer.getData(
        "application/flow-canvas-module",
      );
      const definition = registry.get(moduleType);
      if (!definition) return;
      const position = flow.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });
      const result = store.getState().apply({
        type: "node.add",
        node: {
          id: crypto.randomUUID(),
          moduleType,
          label: definition.title,
          position,
          config: registry.createConfig(moduleType),
        },
      });
      setError(
        result.ok ? "" : (result.errors[0]?.message ?? "Could not add module."),
      );
    },
    [editable, flow, registry, store],
  );

  return (
    <main
      ref={canvasRef}
      aria-label="Canvas"
      className="relative min-h-0 flex-1 bg-[#0c1018]"
      onDragOver={(event) => event.preventDefault()}
      onDrop={drop}
    >
      <ReactFlow
        onInit={(instance) => {
          if (!fitInitialProject.current) return;
          if (initialFitTimer.current) clearTimeout(initialFitTimer.current);
          initialFitTimer.current = setTimeout(() => {
            void instance.fitView({ padding: 0.16, maxZoom: 0.9, duration: 0 });
          }, 120);
        }}
        nodes={projected.nodes}
        edges={projected.edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeDragStop={() => store.getState().commitMove()}
        onConnect={connect}
        isValidConnection={canConnect}
        onMoveEnd={(_, viewport) => store.getState().setViewport(viewport)}
        nodesDraggable={editable}
        nodesConnectable={editable}
        elementsSelectable
        multiSelectionKeyCode="Shift"
        connectionMode={ConnectionMode.Strict}
        deleteKeyCode={null}
        defaultViewport={project.viewport ?? { x: 0, y: 0, zoom: 1 }}
        proOptions={{ hideAttribution: false }}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={22}
          size={1}
          color="#26303f"
        />
      </ReactFlow>
      {project.nodes.length === 0 && (
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
          <span className="mb-5 rounded-2xl border border-violet-400/25 bg-violet-500/10 p-4 text-3xl text-violet-300">
            ◇
          </span>
          <h2 className="text-2xl font-semibold tracking-tight">
            Your canvas is ready
          </h2>
          <p className="mt-2 max-w-sm text-sm leading-6 text-slate-400">
            Choose a module from the library to start mapping a system.
          </p>
        </div>
      )}
      {error && (
        <p
          role="alert"
          className="absolute bottom-4 left-4 rounded-lg border border-rose-400/30 bg-[#25151d] px-3 py-2 text-sm text-rose-200"
        >
          {error}
        </p>
      )}
    </main>
  );
}
