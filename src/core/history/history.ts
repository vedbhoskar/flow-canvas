export type History<T> = {
  past: readonly T[];
  present: T;
  future: readonly T[];
};

export function createHistory<T>(present: T): History<T> {
  return { past: [], present, future: [] };
}

export function pushHistory<T>(
  history: History<T>,
  next: T,
  limit = 50,
): History<T> {
  if (Object.is(history.present, next)) return history;
  return {
    past: [...history.past, history.present].slice(-limit),
    present: next,
    future: [],
  };
}

export function undoHistory<T>(history: History<T>): History<T> {
  const previous = history.past.at(-1);
  if (previous === undefined) return history;
  return {
    past: history.past.slice(0, -1),
    present: previous,
    future: [history.present, ...history.future],
  };
}

export function redoHistory<T>(history: History<T>): History<T> {
  const next = history.future[0];
  if (next === undefined) return history;
  return {
    past: [...history.past, history.present],
    present: next,
    future: history.future.slice(1),
  };
}
