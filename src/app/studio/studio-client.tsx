"use client";

import { createRegistry } from "@/core/modules/registry";
import type { VisualizerProject } from "@/core/project/schema";
import { builtInModules } from "@/modules";
import { builtInPresentations } from "@/modules/presentation";
import { Editor } from "@/features/editor/editor";
import { ReactFlowProvider } from "@xyflow/react";
import "@xyflow/react/dist/style.css";

const registry = createRegistry(builtInModules);
const emptyProject: VisualizerProject = {
  schemaVersion: 1,
  id: "untitled",
  name: "Untitled project",
  nodes: [],
  edges: [],
  scenarios: [],
};

export default function StudioClient({
  initialProject = emptyProject,
  requestedProject = false,
}: {
  initialProject?: VisualizerProject;
  requestedProject?: boolean;
}) {
  return (
    <ReactFlowProvider>
      <Editor
        registry={registry}
        initialProject={initialProject}
        presentations={builtInPresentations}
        requestedProject={requestedProject}
      />
    </ReactFlowProvider>
  );
}
