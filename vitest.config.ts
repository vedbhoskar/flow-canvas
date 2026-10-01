import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: { "@": new URL("./src", import.meta.url).pathname },
  },
  test: {
    include: [
      "tests/unit/**/*.test.{ts,tsx}",
      "tests/integration/**/*.test.tsx",
    ],
    exclude: ["e2e/**", "node_modules/**"],
    environment: "node",
    setupFiles: ["./tests/setup-dom.ts"],
    coverage: {
      provider: "v8",
      include: ["src/core/**/*.ts"],
      exclude: ["src/core/**/*.d.ts"],
      thresholds: { statements: 90, functions: 90, lines: 90, branches: 85 },
    },
  },
});
