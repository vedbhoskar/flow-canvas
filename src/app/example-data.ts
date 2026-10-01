import api from "../examples/api-lifecycle.json";
import research from "../examples/agent-research.json";
import redistribution from "../examples/resource-redistribution.json";
import { createRegistry } from "../core/modules/registry";
import { validateProject } from "../core/project/validate";
import { builtInModules } from "../modules";

const registry = createRegistry(builtInModules);
function verified(input: unknown) {
  const result = validateProject(input, registry);
  if (!result.ok)
    throw new Error(`Bundled example is invalid: ${result.errors[0]?.message}`);
  return result.value;
}

export const examples = [
  {
    slug: "api-lifecycle",
    title: "API lifecycle",
    category: "SYSTEMS",
    description:
      "Follow a request through authentication, service work and the database—with a rejected branch in view.",
    project: verified(api),
    accent: "cyan",
  },
  {
    slug: "agent-research",
    title: "Agent research",
    category: "AGENTS",
    description:
      "Two research agents work in parallel, then hand their findings to a shared review stage.",
    project: verified(research),
    accent: "violet",
  },
  {
    slug: "resource-redistribution",
    title: "Resource redistribution",
    category: "SIMULATION",
    description:
      "One pool, four recipients, a veto, fragmented surplus and a resale to a fifth node.",
    project: verified(redistribution),
    accent: "emerald",
  },
] as const;

export function findExample(slug: string | undefined) {
  return examples.find((example) => example.slug === slug);
}
