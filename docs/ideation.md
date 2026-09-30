# Flow Canvas — Product Ideation

Status: planning specification; application implementation has not started.

Build order: implement this generic template first using `implementation.md`. The earlier `plan.md` describes the later Coalition application and does not govern the generic template.

## Product

Flow Canvas is a Next.js template for creating interactive diagrams and scripted demonstrations. A developer can clone it, open an example, add modules, connect them, configure their properties and play a sequence of state changes.

The first public deliverable is a GitHub template application with an MIT license. An npm library, hosted collaboration and Coalition integration can follow once the application establishes useful extension contracts. The product name is **Flow Canvas**; the repository and package directory use `flow-canvas`.

## Critique of the Original Ideation and Applied Changes

| Original issue                                                   | Why it matters                                                          | Revised decision                                                   |
| ---------------------------------------------------------------- | ----------------------------------------------------------------------- | ------------------------------------------------------------------ |
| Dozens of initial modules                                        | Too much superficial functionality before one complete experience works | Eight initial module types sharing a small renderer set            |
| Scrubbing and PNG export described as both required and optional | An implementer cannot tell when version one is complete                 | Both move to version 1.1                                           |
| Registry built after editor                                      | Encourages hard-coded module switches and duplicated inspectors         | Define contracts and registry before canvas integration            |
| `unknown` schemas and arbitrary string events                    | Leaves validation and behavior to implementation guesswork              | Zod schemas, explicit field descriptors and a closed event union   |
| Persisted and runtime status mixed together                      | Playback can corrupt saved designs and undo history                     | Separate document, editor selection and playback overlay           |
| Purely category-based folders                                    | Features spread across unrelated files                                  | Small core, adapters, modules and editor feature boundaries        |
| Testing postponed to final milestone                             | Core assumptions become expensive to change                             | Test-first vertical slices from schemas onward; CI from bootstrap  |
| No graph or clock semantics                                      | Cycles, equal-time events, pause and restart behave inconsistently      | Define exact contracts in `implementation.md`                      |
| Generic live integrations in initial scope                       | Introduces server infrastructure before a useful local demo             | Local playback first; future adapters documented only              |
| “One-command setup” and public release promises                  | Installation, launch and publishing are different operations            | Document install and run separately; launch is a release milestone |

## Audience and Promise

Serve developers, hackathon teams and educators who need to explain technical systems. The first version should demonstrate an API request, a multi-agent research process and generic resource redistribution.

The promise is a reusable visualization shell with editable diagrams and deterministic playback. Connecting arrows does not execute APIs, agents or user code. Scenario authors supply explicit visual events. Show “Simulated” during playback and describe all included examples as scripted demonstrations.

## Version-One Scope

### Required

- Taskbar with project name, new/open example, undo/redo, zoom, fit-view, playback controls and mode selector.
- Searchable module sidebar with drag-to-add and accessible click-to-add.
- React Flow canvas with grid, selection, multi-selection, dragging, connection, deletion and duplication.
- Inspector for labels and explicit module configuration fields; read-only JSON and current status.
- Collapsible event timeline with current time, playback state and selected-node event filtering.
- Edit, Simulate and Present modes.
- Eight modules: Process, Decision, Service, Database, Agent, Resource Pool, Metric and Note.
- Shared directional edge renderer with label and idle/active/success/warning/error styles.
- Three bundled projects with complete, deterministic event sequences.
- Versioned JSON import/export and one autosaved local project.
- Strict validation, undo/redo, failure recovery, tests, CI and extension documentation.
- Dark theme, visible keyboard focus, status text and reduced-motion support.

### Version 1.1

- Timeline seeking/scrubbing, seeded scenario generators and playback speed selection.
- Automatic layout, PNG export, light theme and project theme overrides.
- Groups, nested nodes, alignment guides and richer context menus.
- Command palette and custom inspector renderers.

### Later

- External event adapters, an installable package and embed mode.
- Coalition modules and its protocol adapter.
- User accounts, public share links, collaborative editing and remote storage.
- Remote plugin discovery or execution is outside the current roadmap.

## Screen Layout

```text
┌────────────────────────────────────────────────────────────────┐
│ Project   New Example   Undo Redo   Zoom Fit   Play Pause Step │
├─────────────┬───────────────────────────────────┬──────────────┤
│ Modules     │                                   │ Inspector    │
│ Search      │         Node-and-edge canvas      │ Properties   │
│ Categories  │                                   │ Data/status  │
├─────────────┴───────────────────────────────────┴──────────────┤
│ Simulated · Paused · 1.2s        Collapsible event timeline    │
└────────────────────────────────────────────────────────────────┘
```

Target editor viewports: 1440×900 and 1280×720. Smaller screens use collapsible panels and an explicit desktop-editing hint; mobile editing is deferred. Present mode hides the palette and inspector and keeps accessible playback controls and an Exit button. Fullscreen is optional and must tolerate browser rejection.

Dark graphite surfaces, a restrained grid and purple accent establish the default style. Blue signals active work, green success, amber warning and red error. Labels and icons accompany color. Use system fonts initially to avoid network-dependent rendering. UI details should be readable on a presentation laptop.

## Architecture Decisions

Use one application and one npm lockfile. Keep module boundaries inside `src/`; do not create a monorepo or publish packages in version one.

```text
src/
├── app/                 # Next routes and composition root
├── core/                # JSON schemas, graph commands, history, replay
├── modules/             # Definitions, registry assembly, presentation mappings
├── adapters/            # React Flow projection and local storage
├── features/editor/     # Store, taskbar, palette, canvas, inspector, timeline
├── components/ui/       # Shared UI primitives
└── examples/            # Three project documents; no application imports
```

- `core/` is framework-independent TypeScript plus Zod. No React, Zustand, Next, browser APIs, module instances or React Flow imports.
- Modules depend on core contracts. The generic registry validates definitions; the composition root explicitly supplies built-in modules.
- Adapters translate between the domain and external tools. React Flow types do not become the saved format.
- Editor components invoke commands through a store created per mounted editor. They do not modify project arrays directly.
- Maintain one authoritative project document. Runtime visual states and selected IDs are separate state, never persisted as document fields.
- The root layout stays a Server Component; the editor entry is a Client Component. Initialize browser storage after mounting.

## Module Contract

A module consists of a definition, tests and optional presentation mapping. Use an explicit immutable registry assembled from an array, with duplicate-type rejection. Avoid registration through global side effects.

Each definition has a stable namespaced type, title, category, Zod configuration schema, validated defaults, static ports and explicit inspector field descriptors. Initial field kinds are text, number, boolean and select. Zod validates data; do not inspect undocumented Zod internals to generate forms.

Persist only JSON configuration. Schemas, React components, callbacks and icon components live in code. A typed `defineModule` helper preserves configuration inference; heterogeneous registry lookup validates unknown input before use. The implementation guide supplies exact contracts and test obligations.

A developer should add a module by creating its definition and tests and adding one entry to the composition registry. Basic modules use the shared card and inspector without editing canvas code. Specialized visualizations use a separate renderer map keyed by module type.

## Playback Contract

Playback consumes an authored event list and computes a visual overlay on a frozen document baseline. It does not traverse the graph as an execution engine. Cycles are therefore permitted in diagrams.

Use a closed event vocabulary: node status, edge status, metric set and log entry. Events carry integer millisecond offsets and stable IDs. Equal-time events follow their order in the document. Exact validation and clock behavior are in `implementation.md`.

Play, pause, step and restart must be deterministic. Structural edits are allowed only in Edit mode. Returning to Edit cancels playback and restores the unchanged baseline. A single injected clock drives playback, and unmounting disposes it. Recorded events and domain state must be testable without a browser.

## Persistence and Import

Version one saves one local project and exports the same canonical versioned JSON document. Playback overlays, history and selection do not appear in exports. Imported files are validated completely before replacing the current document. Unknown modules, invalid port references and unsupported schema versions produce actionable errors.

Provide errors for unavailable storage, quota failures and corrupt saved data without crashing the editor. Hydration must finish before autosaving so initial empty state never overwrites saved work. Local persistence is a convenience, not a backup; retain JSON export as a visible action.

## Included Examples

1. **API lifecycle:** service and database cards, an authentication decision and success/failure state changes.
2. **Agent research:** agent cards on parallel branches, progress metrics and a final review stage. Labels describe simulated roles.
3. **Resource redistribution:** a pool, process participants, an unused-capacity metric and a transfer to another participant. No blockchain dependencies.

Each example includes a short explanation, initial document, scenario and explicit expected final overlay. A reusable test validates every example against the registry and replays it to that expected result.

## Engineering and Public Release

Use Next.js, TypeScript, Tailwind, React Flow, Zustand, Zod and Tabler icons. Add shadcn primitives when the shell needs them. CSS handles basic transitions. Defer Motion, Dagre and theme packages until their features are scheduled.

Use Vitest for core and store tests, Testing Library for interactive components and Playwright for browser flows. Pure core rules get test-first implementation. Bootstrap, generated components and documentation need appropriate verification rather than artificial failing tests.

Use strict TypeScript, formatting, dependency-boundary checks, reproducible `npm ci`, lockfile review and GitHub Actions from the first implementation commit. Test behavior and invariants, not screenshots of every internal state or arbitrary line counts.

The public repository needs an MIT license, third-party notices, README, screenshots, setup commands, architecture guide, module tutorial, contribution guide and CI status. Playwright and some transitive dependencies have other permissive licenses; do not claim every dependency is MIT. Confirm dependency notices before release.

## Milestones and Acceptance

1. **Foundation:** tooling, test harness, CI and documented architecture rules.
2. **Domain:** validated project format, immutable registry, graph commands and bounded history.
3. **Editable studio:** shell, palette, canvas and inspector work together.
4. **Reliable documents:** import/export, hydration and autosave pass recovery tests.
5. **Playback:** pure reducer, disposable clock controller and integrated modes.
6. **Examples and polish:** all three examples, presentation mode, keyboard access and reduced motion.
7. **Release preparation:** clean installation verification, screenshots and public documentation.
8. **Coalition extension later:** adopt the module contract and add a separate integration.

Version one is complete when a developer can install and run it, open an example, add and configure a module, connect it, undo an edit, round-trip the file, play/pause/step/restart a scenario and present it at both target viewports. A new module must be addable using the documented recipe without modifying the editor core.

## Relationship to Implementation Guide

`implementation.md` is the ordered execution contract. It defines filenames, commands, commit messages, tests and gates. If a task reveals a contradictory requirement, update both documents before implementing that behavior. The current request produces these specifications; commits and application builds described there are future execution steps.
