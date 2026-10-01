# Architecture

The editor is a local-first client in a Next.js app. It makes no blockchain or other production API calls. `src/core` contains pure project validation, module definitions/contracts, graph commands, history and scenario playback. `src/adapters` contains React Flow projection and local storage. `src/features/editor` composes the store, canvas, palette, inspector, persistence, timeline and controls. `src/modules` registers built-in module definitions and icon presentations. `src/examples` contains validated scripted project JSON; `src/app/example-data.ts` maps those to gallery metadata.

The document is authoritative. Editing commands produce a new validated document and bounded undo history. React Flow receives a projection of that document plus transient selection, movement and playback overlay; it never owns the document. A scenario reducer applies ordered timestamped events to an overlay without mutating the baseline. A disposable controller owns its clock and cancels stale callbacks on restart, replacement or unmount. Storage hydrates before autosave and does not overwrite corrupt data without explicit recovery. Import uses the same validator as editing.

The principal boundaries are enforced by `npm run check:boundaries`. Core never imports browser, React, Next or adapter modules. Browser tests exercise the production build because geometry and pointer behavior cannot be established by jsdom alone. The examples demonstrate UI simulation only; a future Coalition/Arch integration needs a separately validated data adapter and explicit on-chain transaction handling.

For a new module, use the [extension guide](extensions.md). For the ordered build record, use [implementation progress](progress.md).
