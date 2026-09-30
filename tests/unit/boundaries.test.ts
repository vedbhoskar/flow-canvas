import { describe, expect, it } from "vitest";
import { analyzeImports } from "../../scripts/check-boundaries.mjs";

describe("architecture boundaries", () => {
  const coreFile = `${process.cwd()}/src/core/example.ts`;

  it("allows Zod and sibling core imports", () => {
    expect(
      analyzeImports('import { z } from "zod"; import "./schema";', coreFile),
    ).toEqual([]);
  });

  it("rejects renderer dependencies in core, including type imports", () => {
    expect(
      analyzeImports('import type { Node } from "@xyflow/react";', coreFile),
    ).toHaveLength(1);
    expect(
      analyzeImports(
        'type Store = import("@/features/editor/store").Store;',
        coreFile,
      ),
    ).toHaveLength(1);
  });

  it("rejects nonliteral dynamic imports", () => {
    expect(
      analyzeImports("const module = import(name);", coreFile),
    ).toHaveLength(1);
  });
});
