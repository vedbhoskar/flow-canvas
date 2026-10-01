import {
  IconBox,
  IconArrowsSplit,
  IconServer,
  IconDatabase,
  IconRobot,
  IconDroplet,
  IconChartBar,
  IconNote,
  type TablerIcon,
} from "@tabler/icons-react";

export type ModulePresentation = { icon: TablerIcon };
export type ModulePresentationMap = Readonly<
  Record<string, ModulePresentation>
>;
export const fallbackIcon = IconBox;

export const builtInPresentations: ModulePresentationMap = {
  "basic.process": { icon: IconBox },
  "basic.decision": { icon: IconArrowsSplit },
  "system.service": { icon: IconServer },
  "system.database": { icon: IconDatabase },
  "agent.worker": { icon: IconRobot },
  "simulation.pool": { icon: IconDroplet },
  "utility.metric": { icon: IconChartBar },
  "utility.note": { icon: IconNote },
};
