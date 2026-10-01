# Release checklist and operating notes

This repository is a reusable visualizer template, not a deployed Coalition integration. The initial release build needs no secrets. The CI workflow runs the verified build and coverage gate, then installs Chromium and runs production-backed browser tests. PR jobs have read-only repository permissions and do not use `pull_request_target`; failure artifacts expire after seven days. Dependabot opens bounded weekly npm and Actions update PRs.

For release candidates, run `npm ci`, `npm run verify`, `npm run test:coverage`, `npx playwright install chromium firefox webkit`, `npm run test:e2e`, `npm audit --omit=dev`, and `git diff --check`. Review screenshot baselines rather than auto-updating them blindly. Record actual checks in [progress](progress.md). The core coverage gate requires at least 90% statements/functions/lines and 85% branches. A 100-node/200-edge test is a browser smoke, not a latency guarantee.

Recommended GitHub default-branch protection: require the `verify` and `browser` jobs, require reviews, dismiss stale approvals on new commits, block force pushes and deletions, and include administrators after observing a successful CI run. This can be applied through repository settings by the owner; do not require an unobserved status check prematurely.

Before claiming a public demo, deploy a preview from the intended commit and verify `/`, `/studio`, refresh/local-save, example playback and import/export. Record its URL and commit SHA in the release notes. A deployment and LinkedIn post are separate actions and are not implied by publishing this repository. If a release regresses, promote the previous known-good deployment or make a tested revert/fix; never reset shared history.
