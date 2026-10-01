# Contributing

Thanks for helping make Flow Canvas useful as a reusable visualizer. Please read the [code of conduct](CODE_OF_CONDUCT.md) first.

Use Node.js 22 and npm 10. Fork the repository, create a topic branch, run `npm ci`, and make a focused change. Add or update a failing test for behavior changes, implement the smallest fix, then run `npm run verify` and the relevant production-backed browser tests (`npm run test:e2e -- --project=chromium` after `npm run build`). `npm run test:coverage` enforces core thresholds. PRs should explain the user-facing change, tests, screenshots for UI changes, and any tradeoffs.

Keep the dependency-free core separate from the React Flow and storage adapters. Add new module types through the registry and presentation map rather than introducing switches in the canvas; see [extension guide](docs/extensions.md). Examples must be labeled scripted, validate against the same project schema, and have separately authored expected replay states. Do not commit tokens, `.env` files, generated coverage output or browser test results.

Before filing an issue, search existing issues and include exact reproduction steps, expected/actual behavior, browser/OS, and a redacted project JSON if it is safe to share. Security-sensitive reports should not include exploit details in public issues; contact the maintainer privately through GitHub's security reporting feature where available.
