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
    coverage: { provider: "v8", include: ["src/core/**/*.{ts,tsx}"] },
  },
});
