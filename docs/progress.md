# Implementation progress

The planned slices are described in [implementation.md](implementation.md).

| Slice | Status   | Red evidence                                                                                                                                   | Green/gate evidence                                                                                         | Commit          | Deviations                                                                                                                                                         |
| ----- | -------- | ---------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- | --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 00    | complete | Tooling exception; boundary tests exercised valid and forbidden imports                                                                        | `npm run verify`: format, lint, typecheck, boundaries, 4 tests, production build passed; Chromium installed | See Git history | Production build uses Webpack because this host blocks Turbopack CSS worker ports. Node typings updated for Vitest peers.                                          |
| 01    | complete | Six expected failures against the initial parser stub                                                                                          | `npm run verify` passed: 15 total tests, types, boundaries, lint, format, build                             | See Git history | None                                                                                                                                                               |
| 02    | complete | Four expected failures against registry and validator stubs; isolation test caught mutable defaults                                            | `npm run verify` passed: 30 total tests, types, boundaries, lint, format, build                             | See Git history | None                                                                                                                                                               |
| 03    | complete | Six behavioral failures against the command stub                                                                                               | `npm run verify` passed: 37 total tests, types, boundaries, lint, format, build                             | See Git history | None                                                                                                                                                               |
| 04    | complete | Four expected failures against history/store stubs                                                                                             | `npm run verify` passed: 45 total tests, types, boundaries, lint, format, build                             | See Git history | None                                                                                                                                                               |
| 05    | complete | Three shell tests failed against the route stub; Vite alias error surfaced when the client boundary loaded                                     | `npm run verify` passed: 50 tests, lint, types, boundaries, production build; 390×844 and 1280×720 reviewed | See Git history | New/Open and mode-switching are deferred until their persistence/playback slices. Generated shadcn 4.21.0 added Base UI, icon, animation and utility dependencies. |
| 06    | complete | Browser tests first caught controlled-selection and empty-canvas auto-zoom failures; connection/undo and drag tests caught interaction details | `npm run verify` passed: 52 tests; four Chromium browser cases passed against the production build          | See Git history | Firefox and WebKit projects are configured but not installed or run on this host. Initial empty canvas starts at 100% instead of auto-fit.                         |
| 07    | complete | Three inspector tests failed against the placeholder panel before the form was implemented                                                     | `npm run verify` passed: 57 tests; five Chromium browser cases passed against the production build          | See Git history | Label and configuration now share one atomic graph command; the inspector deliberately uses native form controls.                                                  |
| 08    | complete | Serializer and storage tests failed against explicit stubs; browser import assertion was refined to avoid Next's route announcer               | `npm run verify` passed: 67 tests; nine Chromium browser cases passed against the production build          | See Git history | Local storage is optional; corrupt saved data blocks automatic overwrite until an explicit replacement.                                                            |
| 09    | complete | Three reducer tests failed against the stub for target updates, stable ordering and replay                                                     | `npm run verify` passed: 70 tests, lint, types, boundaries and production build                             | See Git history | Overlay begins with empty maps; idle is the renderer default. Events are sorted by time with authored-order ties.                                                  |
| 10    | complete | Six controller cases failed against an explicit inert stub                                                                                     | `npm run verify` passed: 78 tests, lint, types, boundaries and production build                             | See Git history | Clock is injected; browser clock adapter is isolated in the editor layer.                                                                                          |
| 11–14 | pending  | Not run                                                                                                                                        | Not run                                                                                                     | None            | None                                                                                                                                                               |

Handoff after 00: the local repository is independent and connected to
`https://github.com/vedbhoskar/flow-canvas`. Next execute slice 01: project
schema and test-first validation. The baseline app has `/` and `/studio` routes.

Handoff after 01: the pure core validates version-one project structure,
scenario event types, uniqueness, timing and collection/depth limits. Next
execute slice 02: the module registry and reference validation.

Handoff after 02: eight built-in definitions, an immutable registry and
registry-aware validation cover configs, ports, graph endpoints and scenario
references. Next execute slice 03: pure editing commands.

Handoff after 03: graph commands are pure, validate every changed document,
and use injected IDs for duplication. Node deletion also removes incident
edges and targeted scenario events. Next execute slice 04: bounded history
and an isolated editor store.

Handoff after 04: each editor has its own Zustand store. Document edits use
the validated command API and bounded 50-snapshot history. Selection, viewport
and in-progress node movement do not enter history. Next execute slice 05:
accessible studio shell and taskbar.

Handoff after 05: the studio has a responsive taskbar, searchable module
library, canvas placeholder, inspector and timeline. Rename and undo/redo work;
unfinished canvas/playback actions explain their disabled state. At 390×844 the
side panels start collapsed and open as overlays; at 1280×720 there is no
page-level horizontal overflow. Next execute slice 06: controlled React Flow
canvas and module editing.

Handoff after 06: React Flow is a controlled projection of the validated
document, with selection and drag drafts kept in editor state. Palette click
and drag, compatible port connections, duplicate/delete, undo and zoom/fit are
working. Four production-backed Chromium tests pass, including zoom-correct
drops and a single undoable node drag. Next execute slice 07: module field
configuration in the inspector.

Handoff after 07: all four declared field kinds render through explicit
descriptor switches. Invalid numeric/select input and unknown modules fail
safely. Selection changes discard drafts, non-Edit mode disables the form, and
one browser case verifies save plus undo. Next execute slice 08: validated
project files and recoverable autosave.

Handoff after 08: JSON import/export validates the same document schema as
editing. A 500 ms local autosave hydrates before its first write, preserves
corrupt data for explicit recovery, reports storage failures, and flushes
pending work before project replacement. New/Open require confirmation when
work would be replaced. Next execute slice 09: the pure scenario reducer.

Handoff after 09: a clock-free reducer creates empty overlays and applies
typed status, metric and log events without mutating the baseline. Stable
timestamp ordering makes replay deterministic. Next execute slice 10:
disposable playback controller with an injected clock.

Handoff after 10: one frame is scheduled at a time. The controller handles
timestamp-zero events, pause/resume, grouped stepping, restart, long-frame
catch-up and exact completion, while invalidating stale callbacks on disposal.
Next execute slice 11: connect playback to the editor and timeline.
