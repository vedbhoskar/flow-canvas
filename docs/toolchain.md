# Toolchain

Validated development runtime: Node.js 22.19.0 and npm 10.9.3.

Run `npm ci` after cloning. Use `npm run verify` to run formatting, linting,
type checks, architecture checks, tests, and a production build.

`package-lock.json` is the dependency source of truth. Update dependencies in
reviewable commits and do not bypass peer dependency conflicts.

Production builds use Next.js's Webpack option because the local execution
environment blocks Turbopack's CSS worker port. The app still runs with the
ordinary `next dev` command during development.
