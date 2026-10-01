"use client";

import { useState } from "react";
import { createRegistry } from "@/core/modules/registry";
import type { VisualizerProject } from "@/core/project/schema";
import { builtInModules } from "@/modules";
import { Editor } from "@/features/editor/editor";

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
  return <Editor registry={registry} initialProject={store} />;
}
