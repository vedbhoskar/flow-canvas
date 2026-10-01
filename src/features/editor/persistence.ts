import type { ModuleRegistry } from "../../core/modules/registry";
import {
  createLocalProjectStorage,
  type StorageLike,
} from "../../adapters/storage/local-project";
import type { EditorStore } from "./editor";

export type SaveStatus = {
  kind: "loading" | "saved" | "unsaved" | "unavailable" | "recovery_required";
  message?: string;
};

export class ProjectPersistence {
  private status: SaveStatus = { kind: "loading" };
  private listeners = new Set<() => void>();
  private timer: ReturnType<typeof setTimeout> | null = null;
  private unsubscribeStore: (() => void) | null = null;
  private adapter: ReturnType<typeof createLocalProjectStorage> | null = null;
  private blocked = false;
  private hydrated = false;
  private pending = false;

  constructor(
    private store: EditorStore,
    private registry: ModuleRegistry,
    private getStorage: () => StorageLike | null = () => {
      try {
        return typeof window === "undefined" ? null : window.localStorage;
      } catch {
        return null;
      }
    },
  ) {}

  getSnapshot = () => this.status;
  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };
  private setStatus(status: SaveStatus) {
    this.status = status;
    for (const listener of this.listeners) listener();
  }

  start() {
    if (this.unsubscribeStore) return;
    if (!this.hydrated) {
      this.adapter = createLocalProjectStorage(
        this.getStorage(),
        this.registry,
      );
      const loaded = this.adapter.load();
      if (loaded.state === "valid") {
        const result = this.store.getState().replaceProject(loaded.project);
        this.setStatus(
          result.ok
            ? { kind: "saved" }
            : {
                kind: "recovery_required",
                message: "Saved project failed validation",
              },
        );
        this.blocked = !result.ok;
      } else if (loaded.state === "corrupt") {
        this.blocked = true;
        this.setStatus({ kind: "recovery_required", message: loaded.message });
      } else
        this.setStatus({
          kind: loaded.state === "empty" ? "saved" : "unavailable",
        });
      this.hydrated = true;
    }
    this.unsubscribeStore = this.store.subscribe((next, previous) => {
      if (
        next.history.present !== previous.history.present ||
        next.viewport !== previous.viewport
      )
        this.schedule();
    });
    if (this.pending) this.schedule();
  }

  private schedule() {
    if (this.blocked) return;
    if (this.timer) clearTimeout(this.timer);
    this.pending = true;
    this.setStatus({ kind: "unsaved" });
    this.timer = setTimeout(() => this.flush(), 500);
  }

  flush() {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    if (this.blocked || !this.adapter) return;
    const { history, viewport } = this.store.getState();
    const result = this.adapter.save(history.present, viewport);
    this.pending = !result.ok;
    this.setStatus(
      result.ok
        ? { kind: "saved" }
        : { kind: "unsaved", message: result.message },
    );
  }

  afterExplicitReplacement() {
    this.blocked = false;
    this.schedule();
  }

  dispose() {
    if (this.timer) clearTimeout(this.timer);
    this.timer = null;
    this.unsubscribeStore?.();
    this.unsubscribeStore = null;
  }
}
