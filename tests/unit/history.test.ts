import { describe, expect, it } from "vitest";
import {
  createHistory,
  pushHistory,
  redoHistory,
  undoHistory,
} from "../../src/core/history/history";

describe("bounded document history", () => {
  it("undoes and redoes committed values", () => {
    const first = pushHistory(createHistory("a"), "b");
    expect(undoHistory(first).present).toBe("a");
    expect(redoHistory(undoHistory(first)).present).toBe("b");
  });

  it("does not push identical values and clears redo on a new edit", () => {
    const first = pushHistory(createHistory("a"), "b");
    expect(pushHistory(first, "b")).toBe(first);
    const changed = pushHistory(undoHistory(first), "c");
    expect(changed.future).toHaveLength(0);
    expect(redoHistory(changed)).toBe(changed);
  });

  it("retains at most fifty previous snapshots", () => {
    let history = createHistory(0);
    for (let index = 1; index <= 60; index++)
      history = pushHistory(history, index);
    expect(history.past).toHaveLength(50);
    expect(history.past[0]).toBe(10);
    expect(history.present).toBe(60);
  });
});
