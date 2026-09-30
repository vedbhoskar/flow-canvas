# Flow Canvas — Implementation Runbook

Status: ready to execute; no application code, package installation or commits have been performed by creating this document.

Read `ideation.md` first. This runbook builds the generic Flow Canvas template. `plan.md` is reserved for the later Coalition application. Execute steps in numerical order. Do not implement deferred features while a required slice is incomplete.

## 1. Instructions for the Implementing Agent

1. Read applicable `AGENTS.md`, these specifications and the current progress ledger.
2. Inspect Git status and preserve existing user changes.
3. Work on one numbered commit-sized slice at a time.
4. Read that slice's inputs and dependencies before editing.
5. Write its behavioral tests, run them and confirm they fail for the intended missing behavior.
6. Implement the smallest complete behavior. Do not mock the function under test.
7. Run the targeted tests; refactor only with passing tests.
8. Run the slice gate, inspect the diff and update the progress ledger.
9. Commit the slice with the supplied message when executing this plan. Never include failing tests in the final commit; the red/green cycle is recorded locally in the ledger.
10. Continue to the next slice. Report concrete blockers, not routine implementation choices.

TDD exceptions: project generation, tooling configuration, styling-only changes and prose use inspection/build/browser verification instead of contrived red tests. A test failing from a missing dependency, invalid configuration or syntax error does not prove the target behavior is covered. Add minimal public stubs first if needed to obtain a meaningful behavioral failure.

Do not add `any`, broad type assertions, ignored errors or lint suppressions just to pass checks. Unknown imported data must be parsed. Never remove a failing test or weaken a validation rule without reconciling the specification and recording why.

## 2. Workspace and Git Strategy

The current planning workspace is `/Users/ved/Documents/ChatGPT/colation`. It already contains a parent `.git` and `Coalition/`. The new application must be a standalone repository at `flow-canvas/`, suitable for publication on its own.

Preflight from the planning workspace:

```bash
pwd
git status --short
ls -ld flow-canvas
node --version
npm --version
```

It is expected that `ls` reports no application directory on the first run. If the directory exists, inspect its files and Git root and resume; never overwrite it or rerun the generator over it. Read any applicable `AGENTS.md` before acting. Do not modify or initialize Git inside `Coalition/`.

Use Node 22 with a patch version satisfying installed tooling. Record the exact validated Node and npm versions in `.nvmrc`, `package.json`'s `packageManager`, and `docs/toolchain.md`. `engines.node` should be `>=22 <23`. CI reads `.nvmrc`. If a dependency cannot support this runtime, select a compatible stable version and document the reason; do not use `--force` or `--legacy-peer-deps`.

When the standalone repository is initialized in step 00, verify its root is the application directory before every commit. Keep `flow-canvas/` out of parent commits; add a local parent `.git/info/exclude` entry if needed. Do not use the parent repository to stage the nested application. The user has authorized creating a GitHub repository and pushing the completed commits. Deployment and social posting remain later actions.

## 3. Architecture Contract

```text
src/app → features/editor → adapters → core
       ↘ modules ──────────────────→ core
       ↘ examples (JSON documents)
```

The arrows express allowed imports, not runtime data flow. `features/editor` may also import core and module contract types, but built-in module assembly is injected by the app composition root.

### Files and ownership

```text
src/
  app/page.tsx                       # entry/gallery
  app/studio/page.tsx                # route composition
  app/studio/studio-client.tsx       # client assembly of registry/store/renderers
  app/layout.tsx                     # server layout and metadata
  core/project/schema.ts            # persisted document schemas
  core/project/validate.ts          # structural + registry + reference validation
  core/project/serialize.ts         # canonical JSON import/export
  core/modules/contracts.ts         # definition and field descriptor types
  core/modules/registry.ts          # immutable registry factory
  core/graph/commands.ts            # pure graph commands
  core/history/history.ts           # bounded past/present/future
  core/scenario/events.ts           # closed event schemas
  core/scenario/reducer.ts          # pure overlay reduction
  core/scenario/controller.ts       # injected-clock playback controller
  modules/definitions/*.ts          # eight built-in definitions
  modules/index.ts                  # explicit built-in definition list
  modules/presentation.tsx          # icons and optional renderers
  adapters/react-flow/project.ts    # domain → renderer projection
  adapters/storage/local-project.ts # browser storage behind interface
  features/editor/store.ts          # per-instance store factory
  features/editor/editor.tsx        # client composition/provider
  features/editor/taskbar.tsx
  features/editor/palette.tsx
  features/editor/canvas.tsx
  features/editor/inspector.tsx
  features/editor/timeline.tsx
  features/editor/node-card.tsx
  features/editor/edge.tsx
  components/ui/                    # minimal shadcn primitives
  examples/api-lifecycle.json
  examples/agent-research.json
  examples/resource-redistribution.json
tests/
  fixtures/                         # minimal valid and invalid documents
  unit/                             # node environment; core tests
  integration/                      # store and jsdom interaction tests
  setup-dom.ts                      # jest-dom + documented DOM shims
e2e/                                # real-browser acceptance tests
docs/
  decisions/                        # short architecture decision records
  progress.md                       # execution evidence per slice
  architecture.md
  modules.md
  scenarios.md
  toolchain.md
scripts/check-boundaries.mjs
```

Tests mirror the owning feature, not each trivial implementation function. Extract a helper when it has a clear responsibility or is reused; avoid generic service containers, abstract base classes and premature packages.

### Automated dependency rules

Implement `check-boundaries.mjs` using the TypeScript compiler API to inspect static imports, exports, import types and literal dynamic imports. Resolve relative paths and `@/` aliases. Reject non-literal dynamic imports in `src/` for version one. Exit nonzero with file and forbidden target on violations.

- Core can import other core files and Zod only.
- Modules can import core and other module files; presentation files may import React and Tabler icons. No module may import editor, adapters, app or examples.
- Adapters can import core and their declared external library; no editor or app imports.
- Editor can import core, adapters, shared UI and module contracts/presentation; no `modules/index` or examples imports.
- Examples are JSON only. The app injects their parsed values and the registry.
- Shared UI does not import domain, editor, app, adapters or modules.
- Type-only imports follow the same boundary rules.

Test the checker against valid relative/alias imports and forbidden import fixtures. Do not apply application boundary checks to generated `.next`, dependencies or test fixtures themselves.

## 4. Exact Data and Behavior Contracts

### Saved project

Use a strict Zod schema with `schemaVersion: 1`, nonempty `id` and `name`, optional `description`, `nodes`, `edges`, `scenarios`, and optional `viewport: { x, y, zoom }`. All coordinates are finite numbers; zoom is positive. IDs are unique in each collection. All strings and collections have explicit bounds.

A node has `id`, `moduleType`, `label`, `position: { x, y }`, and `config` containing only JSON data. No runtime status, React Flow selection or measured dimensions are saved. A node's module configuration is validated again by its registered module schema.

An edge has `id`, `sourceNodeId`, `sourcePortId`, `targetNodeId`, `targetPortId`, and optional `label`. Renderer types and CSS classes are derived, not persisted.

A scenario has `id`, `name`, `durationMs` and `events`. Event timestamps are nonnegative integer milliseconds and must not exceed duration. IDs are unique per scenario. Sort by timestamp stably without mutating the input, preserving array order for ties. Empty graphs and empty scenarios are valid.

Initial import bounds: 2 MiB file, 200 nodes, 500 edges, 10 scenarios, 5,000 events per scenario, JSON nesting depth 20. IDs max 100 characters, labels/names max 120, descriptions max 2,000, log messages max 1,000. Configuration text fields default to max 2,000 unless their module specifies a smaller limit. Validate size before parsing and depth before recursive schema traversal. Reject unsupported versions; no migration engine is needed until a second version exists.

Validation returns `Result<T> = { ok: true; value: T } | { ok: false; errors: ValidationIssue[] }`. Issues have `code`, `path` and a user-readable `message`. Invalid input never partially changes the active document.

### Registry and fields

`createRegistry(definitions)` returns read-only lookup/list operations. Definition types are stable names such as `basic.process` and `system.database`. Reject duplicate types, duplicate port IDs, invalid defaults and fields referencing nonexistent configuration keys.

`defineModule<TConfig>()` binds a `z.ZodType<TConfig>`, typed defaults and a readonly field descriptor list. Field descriptors are discriminated by `kind`: text, number, boolean or select; include `key`, `label`, and the appropriate constraints/options. Validate descriptor/default consistency at registry creation. Do not expose schema internals to UI code. Runtime lookup returns a validated JSON config, never unchecked generic casts.

Ports have `id`, `direction: input | output` and `dataType`. V1 data types are `any`, `signal` and `data`. A connection is valid when output points to input and types match or either is `any`. Reject self-links, missing nodes/ports and identical endpoint tuples. Allow cycles and multiple connections per port. Note and Metric modules have no ports.

Implement these exact built-ins first. `in` means an input port and other listed ports are outputs; all are type `any` except Decision's `yes`/`no` outputs, which are `signal`.

| Type              | Default JSON config                             | Ports       | Inspector fields                                          |
| ----------------- | ----------------------------------------------- | ----------- | --------------------------------------------------------- |
| `basic.process`   | `{ "description": "" }`                         | in, out     | description: text                                         |
| `basic.decision`  | `{ "condition": "Condition met?" }`             | in, yes, no | condition: text                                           |
| `system.service`  | `{ "protocol": "HTTP", "latencyMs": 100 }`      | in, out     | protocol: select HTTP/RPC/Event; latencyMs: number ≥ 0    |
| `system.database` | `{ "engine": "PostgreSQL", "readOnly": false }` | in, out     | engine: select PostgreSQL/SQLite/Other; readOnly: boolean |
| `agent.worker`    | `{ "role": "Researcher", "task": "" }`          | in, out     | role/task: text                                           |
| `simulation.pool` | `{ "capacity": 100, "unit": "units" }`          | in, out     | capacity: number ≥ 0; unit: text                          |
| `utility.metric`  | `{ "initialValue": 0, "unit": "units" }`        | none        | initialValue: finite number; unit: text                   |
| `utility.note`    | `{ "text": "Add a note" }`                      | none        | text: multiline text                                      |

All configs reject extra keys. Schema validation must agree with inspector limits. Runtime metrics initially display `initialValue` when there is no overlay value; `metric.set` changes only the overlay. Module metadata includes `supportsMetric: true` for Metric, so event validation supports future metric modules without a hard-coded module-name check. Other modules default to false.

### Graph commands and history

Use a discriminated command union: add node, update label/config, move nodes, connect, delete selection and duplicate selection. Pure commands return a new validated document or errors and never mutate inputs. Inject IDs at the command boundary; reducers must not call random generators.

Add a separate `renameProject` document command for the taskbar title; it follows the same validation/history rules.

Deleting nodes also removes incident edges and scenario events targeting removed nodes/edges. Keep untargeted log entries. Duplication copies selected nodes and edges whose two endpoints were selected, offsets positions by 32 pixels and creates fresh IDs; it does not copy scenario events.

History stores at most 50 document snapshots. A drag gesture, multi-delete or validated inspector submit is one undo transaction. Intermediate dragging and text drafts live in editor state; commit on drag end or explicit form submit. Reject/no-op commands do not enter history. New edits clear redo. Selection, viewport movement and playback never enter history. Viewport may persist separately in the document envelope on export/autosave without creating an undo entry.

### Runtime and playback

Use three separate state sections: document/history, editor UI (selection, drafts, viewport, mode) and playback (scenario, baseline, overlay, elapsed time, cursor, status).

Overlay contains `nodeStatus`, `edgeStatus`, `metrics` and ordered visible log entries. Default visual status is idle. Supported statuses: idle, active, success, warning, error. Metric values are finite numbers. Define four discriminated events with their own required fields:

- `node.status`: `nodeId`, `status`.
- `edge.status`: `edgeId`, `status`.
- `metric.set`: `nodeId` identifying a Metric module, `value`.
- `log.append`: `message`, `level: info | warning | error`, optional `nodeId`.

Every event also has `id` and `atMs`. References must exist; unsupported event types reject the scenario. Tied events apply in document order. Status persists until replaced; there is no implicit timeout. The project baseline is unchanged by every event.

Controller API: `play`, `pause`, `step`, `restart`, `dispose`, `getSnapshot`, `subscribe`. Inject a clock with `now()`, `requestFrame(callback)`, `cancelFrame(id)`. Pure controller code never calls browser globals. The UI supplies a performance-clock adapter.

- Initial/restarted state: ready, time zero, cursor zero, idle overlay; events at zero have not fired.
- Play processes due events, including timestamp zero, then schedules frames; repeated play is idempotent.
- Pause freezes elapsed scenario time and cancels pending frames. Resume excludes paused wall time.
- Step pauses first and applies the entire next timestamp group. No remaining groups moves to duration and completed.
- Playback completes at duration, applying every due event exactly once. A zero-duration scenario completes on play. Play on completed is a no-op; Restart begins a new run.
- Restart cancels pending work, clears overlay and log, restores the baseline and returns ready. Starting another scenario or changing projects disposes the previous controller.
- Returning to Edit disposes playback and drops the overlay. Simulate and Present disable all document mutations, including import/new/undo. Leaving Edit validates the document; errors keep it in Edit.
- Background-tab delays process all due events on the next frame, without duplicate emission. The engine's event order is independent of animation frame rate.

## 5. Tooling, Scripts and Standard Gates

Record resolved package versions in the lockfile; do not copy arbitrary version numbers from this plan. Install runtime dependencies only when the owning slice needs them. `npm ci` is the repeatable install after bootstrap; `@latest` is limited to initial scaffolding. Verify peer compatibility instead of bypassing it.

Create these scripts in step 00:

| Script           | Command                                                                                                              |
| ---------------- | -------------------------------------------------------------------------------------------------------------------- |
| dev              | `next dev`                                                                                                           |
| build            | `next build`                                                                                                         |
| start            | `next start`                                                                                                         |
| lint             | `eslint . --max-warnings=0`                                                                                          |
| typecheck        | `tsc --noEmit`                                                                                                       |
| format           | `prettier --write .`                                                                                                 |
| format:check     | `prettier --check .`                                                                                                 |
| check:boundaries | `node scripts/check-boundaries.mjs`                                                                                  |
| test             | `vitest run`                                                                                                         |
| test:watch       | `vitest`                                                                                                             |
| test:coverage    | `vitest run --coverage`                                                                                              |
| test:e2e         | `playwright test`                                                                                                    |
| verify           | `npm run format:check && npm run lint && npm run typecheck && npm run check:boundaries && npm test && npm run build` |

At bootstrap, add the boundary checker with its valid/invalid fixtures so `verify` is meaningful immediately. Do not configure `passWithNoTests`. Configure separate Vitest file globs for node unit tests and jsdom integration tests. Keep Playwright `e2e/` excluded from Vitest. Use Testing Library cleanup and restore fake timers after each test. Match the installed Vitest and coverage-provider versions.

Enable TypeScript `strict`, `noUncheckedIndexedAccess` and `exactOptionalPropertyTypes`. Keep Next-generated settings. Configure ESLint for unused imports/variables and explicit-any errors. Exclude build output, coverage and reports from ESLint/Prettier and Git. Use stable accessible selectors in browser tests, with test IDs reserved for canvas elements that lack semantic roles.

### Per-slice commit protocol

Run targeted tests as specified by the slice, then:

```bash
npm run verify
git diff --check
git status --short
git diff
```

Update `docs/progress.md` with slice ID, red test and observed failure, green command/results, deviations and remaining work. Stage only files belonging to the slice using explicit paths. Review with `git diff --cached --stat` and `git diff --cached`; commit using the message below. Store the resulting hash in the next ledger update or final handoff, avoiding a self-referential commit hash. No push is needed for local development.

## 6. Ordered Implementation and Commit Sequence

### 00 — Bootstrap and enforce architecture

Inputs: sections 1–5. Working directory: planning workspace, then the new application.

```bash
npx create-next-app@latest flow-canvas --ts --tailwind --eslint --app --src-dir --use-npm --import-alias '@/*' --disable-git --yes
cd flow-canvas
git init -b main
git switch -c codex/visualizer-v1
npm install --save-exact zod
npm install -D --save-exact vitest @vitest/coverage-v8 jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event @playwright/test prettier
npx playwright install chromium
```

Read generated `AGENTS.md` and installed Next documentation before editing application files. Configure scripts, tests, strictness, boundary rules, ignore files and an MIT license. Copy the approved ideation and runbook into `docs/` using normal file operations; future edits keep those app copies authoritative during execution. Create `AGENTS.md` project guidance preserving useful generated instructions. It should point to the runbook, list boundary rules and require the per-slice gate.

Create `.github/workflows/ci.yml` immediately: checkout, Node from `.nvmrc`, npm cache, `npm ci`, `npm run verify`. Use `pull_request` and pushes to `main`; read-only contents permission; concurrency cancellation per branch. Select supported action releases from official repositories at execution time and pin full commit SHAs with release comments. Add a minimal route smoke test and boundary-checker tests; CI must not report an empty suite as success.

Gate: `npm run verify`; record exact tool versions and clean repository root.

Commit: `chore: scaffold studio with strict tooling and CI`.

### 01 — Project format and validation foundations

Files: `core/project/schema.ts`, `core/scenario/events.ts`, fixture builders, `tests/unit/project-schema.test.ts`.

Red cases: valid minimal document parses; empty document works; NaN/Infinity, invalid version, duplicate IDs, negative/noninteger times, unknown fields, event after duration and excessive bounds fail with paths. Verify frozen fixtures are not mutated.

Implement structural schemas and shared Result/ValidationIssue/JSON types. Registry-aware validation follows in 02. Explicitly distinguish shape validation from full load validation so partially validated values cannot reach the store.

```bash
npm test -- tests/unit/project-schema.test.ts
```

Gate: schema cases plus standard per-slice gate.

Commit: `feat: define versioned project and event schemas`.

### 02 — Module registry and full graph validation

Files: core module contracts/registry, project validator, eight module definitions and their tests.

Red cases: duplicate types/port IDs fail; invalid defaults fail; descriptor key mismatch fails; lookup unknown type reports error; module defaults are cloned per node; invalid config fails; valid/invalid port types; missing node/port; self-edge; duplicate edge endpoints; allowed graph cycle; invalid event target; metric event against non-Metric node rejected.

Implement `defineModule`, explicit descriptor types and `createRegistry`. Start with Process, then add Decision, Service, Database, Agent, Resource Pool, Metric and Note using the same contract. Add a conformance test that runs over every definition.

```bash
npm test -- tests/unit/registry.test.ts tests/unit/project-validation.test.ts
```

Gate: full validation is the only path for loading a document. Add `docs/decisions/001-domain-and-registry.md` explaining the boundaries.

Commit: `feat: add typed module registry and graph validation`.

### 03 — Pure editing commands

Files: graph commands and `tests/unit/graph-commands.test.ts`.

Red cases: add valid node; reject invalid config; connect valid ports; reject invalid connection; move multiple nodes; rename/config update; deletion cascades to edges and targeted events; duplicate selection remaps only internal edges; injected IDs remain unique; rejected edits preserve original document; all commands preserve frozen inputs.

Use shared validation rules instead of duplicating them in commands. Return structured errors. Empty selection is a no-op. Deleting scenario targets must be explicitly covered by tests.

```bash
npm test -- tests/unit/graph-commands.test.ts
```

Gate: command outputs pass full validation.

Commit: `feat: implement immutable graph editing commands`.

### 04 — History and editor store

```bash
npm install --save-exact zustand
```

Files: history core, editor store factory, unit history and integration store tests.

Red cases: undo/redo restores document; new edit clears redo; rejected/no-op edit does not push history; 51 commits retain 50 past entries; drag transaction makes one entry; selection/viewport do not create entries; two store instances are independent; edit-mode guard rejects mutations in Simulate/Present.

Build a vanilla store factory with injected registry and ID provider. React consumers select narrow fields. No module-level mutable singleton. Add draft movement lifecycle and inspector-submit transaction methods.

```bash
npm test -- tests/unit/history.test.ts tests/integration/editor-store.test.ts
```

Commit: `feat: add transactional history and isolated editor store`.

### 05 — Accessible shell and taskbar

```bash
npm install --save-exact @tabler/icons-react
npm install -D --save-exact shadcn
npx shadcn init
npx shadcn add button input label select tooltip dialog tabs separator
```

Use Tailwind-compatible defaults, CSS variables and the `@/components/ui` path. Record the resolved CLI version and generated dependency changes. Keep the generated UI limited to used components.

Files: editor entry/provider, taskbar, sidebar/inspector/timeline frames, globals and routes.

Red integration cases: taskbar dispatches undo/redo; disabled actions follow store state; project title submits one edit; module search filters entries; collapsible panels restore focus; mode changes expose correct controls. Add New/Open confirmation when replacing a nonempty project.

Build one client editor boundary with server routes composing it. `app/studio/studio-client.tsx` assembles the registry, renderer mapping and store; do not pass Zod schemas, callbacks or a store from Server Components to Client Components. Server routes pass only serializable input. Use semantic regions, labeled icon buttons and responsive grid layout. Controls whose features are unfinished must be disabled with an explanation, not silently do nothing.

```bash
npm test -- tests/integration/editor-shell.test.tsx
npm run dev
```

Gate: inspect at both target viewports and keyboard-tab through controls. Save observations in progress ledger; no broad pixel snapshots yet.

Commit: `feat: build studio shell and accessible taskbar`.

### 06 — Canvas and editable modules

```bash
npm install --save-exact @xyflow/react
```

Files: React Flow adapter, canvas, palette, shared card/edge, presentation map.

Red unit cases: projection preserves IDs/ports/positions; runtime overlay affects rendered status but never document; projection does not insert React Flow fields into exports.

Red browser cases: click-to-add; drag-to-add at correct viewport coordinates after zoom; select/move; connect compatible handles; reject incompatible handles; duplicate; multi-delete; undo restores connected subgraph; fit-view works.

Implement controlled nodes/edges using the store. Treat in-progress React Flow changes as drafts where needed; on drag stop issue a single move command. Define `nodeTypes`/`edgeTypes` outside render or memoize them. Include React Flow styles and explicit canvas height. Do not independently store another authoritative nodes array.

Configure Playwright with projects named `chromium`, `firefox` and `webkit`, and a production `webServer`: command `npm run start -- --hostname 127.0.0.1 --port 3100`, URL `http://127.0.0.1:3100`, `reuseExistingServer: false`. Build explicitly before browser tests. Use traces on first retry, screenshots on failure, zero local retries and at most one CI retry. Unexpected flakes must be investigated rather than concealed by increasing retries.

```bash
npm test -- tests/unit/react-flow-projection.test.ts
npm run build
npm run test:e2e -- e2e/editor.spec.ts --project=chromium
```

Commit: `feat: connect module palette and graph canvas`.

### 07 — Inspector configuration

Files: descriptor-driven inspector, form drafts and field tests.

Red cases: each descriptor kind renders labeled input; numeric text is parsed intentionally; empty/invalid number reports error; select rejects unsupported value; validation errors do not mutate document; submit creates one undo entry; changing selection discards unsaved draft; readonly modes reject submission; unknown module cannot reach renderer.

Implement explicit switches over the four descriptor kinds. Validation runs on submit and errors appear next to fields. Do not reconstruct forms by introspecting Zod schemas. Show runtime JSON/status read-only as text, never HTML.

```bash
npm test -- tests/integration/inspector.test.tsx
```

Gate: add an example module definition in a test fixture and render its inspector without editing inspector implementation.

Commit: `feat: add validated module property inspector`.

### 08 — JSON round-trip and safe local persistence

Files: serializer, storage adapter, hydration/autosave hook, import/export controls.

Red cases: export/import semantic equality including viewport; no selection/history/overlay leakage; invalid JSON, oversize, deep nesting, future version and unknown modules preserve current project; missing storage works; corrupt saved value is not auto-overwritten; quota error shows unsaved state; hydration finishes before first save; debounce cancellation on unmount; flush pending valid save before project switch.

Use a storage interface with injectable `getItem`/`setItem` and one namespaced key `flow-canvas:project:v1`. Autosave document changes after 500 ms idle. Track save status. Handle user-requested reset/recovery explicitly. Import through the same validator as local load. Confirm project replacement, clear history/selection and dispose any playback only after successful validation. Revoke object URLs after download.

```bash
npm test -- tests/unit/serialization.test.ts tests/integration/persistence.test.ts
npm run build
npm run test:e2e -- e2e/documents.spec.ts --project=chromium
```

Commit: `feat: add validated project files and recoverable autosave`.

### 09 — Pure scenario reducer

Files: scenario reducer and event tests.

Red cases: each event changes only its target overlay field; tied timestamps preserve input order; baseline and input events are immutable; metrics replace instead of accumulate; logs retain order; invalid targets are rejected during full load; replay produces identical final overlay; empty scenario yields empty overlay.

Implement `createOverlay(document)` and `applyEvent(overlay, event)` plus a pure helper to reduce a prefix. No timers, UUIDs, network calls or React hooks in this slice.

```bash
npm test -- tests/unit/scenario-reducer.test.ts
```

Commit: `feat: implement deterministic visual event reduction`.

### 10 — Disposable playback controller

Files: controller, browser clock adapter, fake clock tests.

Red cases: timestamp-zero events; play idempotence; pause/resume ignores paused duration; step applies one timestamp group; restart clears overlay/cursor/log; completed play no-op; zero-duration run; multiple events due after long frame; cancel/dispose prevents updates; replacing scenario cancels old run; clock listeners unsubscribe; final timestamp processed exactly once.

Use an injected manual clock in unit tests and test snapshots by advancing exact milliseconds. Schedule one frame at a time. Add a generation/disposal guard so an already queued old callback cannot update a replacement run. The reducer remains clock-free.

```bash
npm test -- tests/unit/playback-controller.test.ts
```

Commit: `feat: add deterministic playback clock and lifecycle`.

### 11 — Playback UI, timeline and modes

Files: controller/store bridge, timeline, mode and presentation controls.

Red cases: play/pause/step/restart update toolbar and canvas; Edit is required for mutations; entering simulation captures a baseline; exiting restores edit view; project switch leaves no old controller; timeline node filter works; mounting/unmounting twice under Strict Mode creates no duplicate runner; logs announced politely without flooding screen readers.

Show elapsed time and simulated label. Do not add scrubber or speed controls yet. Present mode hides editing panels and keeps Exit plus playback controls. Fullscreen errors should leave an ordinary functional presentation view.

```bash
npm test -- tests/integration/playback-ui.test.tsx
npm run build
npm run test:e2e -- e2e/playback.spec.ts --project=chromium
```

Commit: `feat: integrate playback timeline and presentation mode`.

### 12 — Three examples and extension proof

Files: bundled JSON examples, gallery, expected final overlay fixtures, module/scenario guides.

Red cases: all examples pass full validation; every example replays to separately authored expected results; every target exists; selecting an example replaces document only after confirmation; fresh launch opens the API example only when no saved project exists.

Use actual registered modules for all diagrams. Agent research shows parallel timestamps. Resource redistribution has a metric change and a visible secondary edge. Label all three as scripted. Add a temporary test-only custom module through public registry and presentation contracts, proving no core/editor edits are needed to extend it.

```bash
npm test -- tests/unit/examples.test.ts tests/integration/module-extension.test.tsx
```

Commit: `feat: ship three runnable visualizer examples`.

### 13 — Accessibility and usability completion

```bash
npm install -D --save-exact @axe-core/playwright
```

Red browser cases: add via keyboard; property edit/submit; undo shortcuts ignore typing in inputs/textareas/contenteditable; Delete does not delete graph while typing; Escape exits Present; keyboard selection remains discoverable; reduced-motion removes looping edge motion while keeping status text; 1280×720 has no page-level overflow; empty project and no-search-results messages are useful.

Run axe checks in editor and presentation modes. Keep high-frequency canvas announcements out of live regions. Use deterministic screenshot states for shell/example/paused/present; review images before committing baselines. Do not auto-update screenshots to conceal regressions. Use real browser tests for layout/geometry rather than large jsdom mocks of React Flow.

```bash
npm run build
npm run test:e2e -- e2e/accessibility.spec.ts e2e/visual.spec.ts --project=chromium
```

Gate: manual keyboard and readability review at both target viewports. Record a 100-node/200-edge smoke run and check for runaway re-renders or accumulating listeners; do not claim a universal performance guarantee.

Commit: `fix: complete keyboard access and presentation usability`.

### 14 — CI completion and release documentation

Extend CI with dependent browser job: `npm ci`, `npx playwright install --with-deps chromium`, production build and E2E. Upload Playwright traces/screenshots/reports on failure with short retention. Run Chromium on each PR; run Firefox/WebKit in a release check after installing those browsers. Pin actions, read-only token permissions, no production secrets in PR jobs and no `pull_request_target` executing untrusted code.

Add Dependabot updates for npm and GitHub Actions. Review vulnerability reports using `npm audit --omit=dev`; investigate reachable risks and record a rationale or fix. Never run automatic forced upgrades. CI and dependency reports complement code review; they do not replace it.

Add README, LICENSE notices, CONTRIBUTING, code of conduct, issue/PR templates, architecture and extension docs, changelog, screenshots and metadata. Confirm notice requirements from installed versions. Record CI branch-protection recommendations; actual GitHub settings require a remote and appropriate access.

```bash
npm ci
npm run verify
npm run test:coverage
npx playwright install chromium firefox webkit
npm run test:e2e
npm audit --omit=dev
git diff --check
```

Configure core coverage minimums at 90% statements/functions/lines and 85% branches, including unimported `src/core/**/*.ts` via coverage include. Exclude declaration-only types explicitly. Keep meaningful behavior coverage as the primary requirement; do not write assertion-free tests to hit a percentage. Earlier slices run targeted tests; this release gate runs the full suite once.

Gate: verify README setup in a fresh temporary checkout using `npm ci`, build and tests. All checks above are recorded with actual outcomes. Coverage, screenshots and browser reports are evidence, not invented success claims.

Commit: `docs: prepare visualizer template for public release`.

## 7. CI, Deployment and Operational Practices

- Develop with short feature branches and small reviewable commits. No database, Docker or Kubernetes setup is necessary for this application.
- Install from lockfile in CI. Cache npm downloads, not node_modules. Review lockfile changes with dependency updates.
- Required checks: format/lint/types, boundaries, unit/integration tests, production build and Chromium E2E. Configure main-branch protection when a remote is created.
- Test changed behavior locally before full gates. Do not repeatedly rebuild unchanged code without a reason.
- UI error boundary offers a recovery/export route where possible. Storage and validation errors stay local and actionable; do not log entire imported documents.
- Version one makes no external API requests and requires no application secrets. Never commit `.env` or access tokens.
- Public publication is a separate release action: create/attach the intended repository, push reviewed commits, enable template status and CI settings, then deploy a preview. Verify `/` and `/studio`, refresh behavior, example playback and import/export on the preview before promoting production.
- Record the deployment's commit SHA and URL. Roll back by promoting the previous known-good deployment. For a code regression, add a tested fix or targeted revert; do not reset shared history.
- Draft the LinkedIn post using actual screenshots and a working demo link after release. Posting is a separate user-directed action.

## 8. Acceptance Matrix

| Area          | Essential failure or regression case                             | Evidence                     |
| ------------- | ---------------------------------------------------------------- | ---------------------------- |
| Format        | Future version and malformed config rejected without replacement | schema/import tests          |
| Registry      | Adding a type needs no canvas switch                             | extension fixture test       |
| Graph         | Delete removes dangling edges and events; cycles allowed         | graph command tests          |
| History       | One drag → one undo; redo invalidates on edit                    | history/store + E2E          |
| Canvas        | Zoomed drop lands correctly; invalid connection rejected         | real-browser editor tests    |
| Inspector     | Invalid numeric draft cannot mutate config                       | interaction tests            |
| Storage       | Hydration cannot overwrite saved work; quota error visible       | adapter/integration tests    |
| Playback      | Pause time excluded; tied events stable; old callbacks disposed  | manual-clock unit tests      |
| Modes         | Playback never changes export or history                         | integration + E2E            |
| Examples      | All three have known, verified final overlays                    | parameterized example tests  |
| Accessibility | Keyboard editing, input shortcut isolation and reduced motion    | axe + manual + E2E           |
| Distribution  | Fresh install builds; docs add a module successfully             | fresh-checkout release check |

## 9. Progress Ledger Template

Create `docs/progress.md` with one row per slice 00–14:

| Slice | Status  | Red evidence      | Green/gate evidence | Commit | Deviations |
| ----- | ------- | ----------------- | ------------------- | ------ | ---------- |
| 00    | pending | tooling exception | not run             | none   | none       |

Allowed states: pending, in progress, blocked, complete. Mark complete only when code and tests exist, the gate ran successfully, and the diff was reviewed. If a tool is unavailable, record exactly which verification is missing; do not label it passed.

For each slice, add a short handoff note naming the files changed, next slice and any unresolved failure. This lets another coding model resume without reconstructing the entire conversation.

## 10. Primary Tool References

Confirm installed-version APIs when executing, especially generated Next instructions and test runner configuration.

- [Next.js create-next-app CLI](https://nextjs.org/docs/app/api-reference/cli/create-next-app)
- [Vitest getting started](https://vitest.dev/guide/)
- [Playwright CI setup](https://playwright.dev/docs/ci-intro)
- [React Flow documentation](https://reactflow.dev/)

Completion means all required slices are implemented and verified. Optional version-1.1 features and Coalition work remain separate subsequent projects; do not expand scope to finish this release.
