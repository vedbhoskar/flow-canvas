import type { ModuleDefinition } from "../core/modules/contracts";
import {
  agentModule,
  databaseModule,
  decisionModule,
  metricModule,
  noteModule,
  poolModule,
  processModule,
  serviceModule,
} from "./definitions/built-ins";

export const builtInModules: readonly ModuleDefinition[] = [
  processModule,
  decisionModule,
  serviceModule,
  databaseModule,
  agentModule,
  poolModule,
  metricModule,
  noteModule,
];
