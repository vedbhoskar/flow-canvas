"use client";

import { useState } from "react";
import { createRegistry } from "@/core/modules/registry";
import type { VisualizerProject } from "@/core/project/schema";
import { builtInModules } from "@/modules";
import { Editor } from "@/features/editor/editor";
import { ReactFlowProvider } from "@xyflow/react";
import "@xyflow/react/dist/style.css";

const registry = createRegistry(builtInModules);
const initialProject: VisualizerProject = {
  schemaVersion: 1,
  id: "untitled",
  name: "Untitled project",
  nodes: [],
  edges: [],
  scenarios: [],
};

export default function StudioClient() {
  const [store] = useState(() => initialProject);
  return (
    <ReactFlowProvider>
      <Editor registry={registry} initialProject={store} />
    </ReactFlowProvider>
  );
}
