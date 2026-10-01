# Extending Flow Canvas

Flow Canvas separates a validated document from how a module looks and how a scripted scenario changes it. The three bundled JSON examples in `src/examples/` are good starting points; they are scripted demos, not live external integrations.

## Add a module

1. Define a module with `defineModule` from `src/core/modules/contracts.ts`. Give it a namespaced type (`company.thing`), a strict Zod configuration schema, matching default configuration, field descriptors and typed ports.
2. Include the definition in the array passed to `createRegistry` in `src/core/modules/registry.ts`. `src/modules/index.ts` is the built-in composition point, not a required core edit.
3. Optionally provide an icon through `ModulePresentationMap` from `src/modules/presentation.tsx`, passed to `Editor`. Unmapped types use the box icon.
4. Validate a test project with `validateProject`, then render its palette item and inspector fields. `tests/integration/module-extension.test.tsx` is a complete test-only example; it changes no core or editor code.

## Add a scripted scenario

A project JSON has version, ID, name, nodes, edges and scenarios. Each scenario has a duration in milliseconds and timestamped events. Events target existing node or edge IDs. Node and edge status events set `active`, `success`, `warning`, or `error`; metric events target modules that support metrics; log events add a timeline message. Events at equal timestamps run in authored order. The project validator rejects unknown targets, invalid module configs and out-of-range timestamps.

To add a gallery example, create JSON under `src/examples/`, add its metadata in `src/app/example-data.ts`, and add a separately authored final overlay expectation to `tests/unit/examples.test.ts`. Keep simulation scripts honest: a log can describe a veto or resale, but it does not execute a blockchain transaction. A real data source should arrive as a separate adapter with explicit validation, time mapping and failure states.
