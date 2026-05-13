import type { Game } from "../../game/types";
import type { GameStore } from "../../hooks/gameStore";

// Local, in-memory implementation of GameStore. Used by MockBigScreen so
// the same state-machine effects (timers, resolver, phase writes) can
// run against a scenario without touching Firebase.
//
// Paths are slash-delimited (e.g. "round/phase", "round/commits/p1"),
// matching the Firebase store's semantics so useGameState's call sites
// don't need to special-case the mock path.
export interface LocalGameStore extends GameStore {
  /** Replace the current game (used to load a scenario or reset). The
   *  notification fires synchronously so React picks the new value up. */
  reset(game: Game | null): void;
}

// Deep clone via structured-clone-ish JSON pass — kept simple because the
// game state is plain JSON-shaped data and the mock only runs in dev.
function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

// Walk a slash-delimited path and write `value` at the leaf. Empty path
// means "replace the root", but we leave that to callers (set vs update).
function writePath(root: Record<string, unknown>, path: string, value: unknown): void {
  const parts = path.split("/").filter(Boolean);
  if (parts.length === 0) return;
  let target = root;
  for (let i = 0; i < parts.length - 1; i++) {
    const key = parts[i];
    const next = target[key];
    if (next === undefined || next === null || typeof next !== "object") {
      target[key] = {};
    }
    target = target[key] as Record<string, unknown>;
  }
  target[parts[parts.length - 1]] = value;
}

function deletePath(root: Record<string, unknown>, path: string): void {
  const parts = path.split("/").filter(Boolean);
  if (parts.length === 0) return;
  let target = root;
  for (let i = 0; i < parts.length - 1; i++) {
    const key = parts[i];
    const next = target[key];
    if (next === undefined || next === null || typeof next !== "object") return;
    target = next as Record<string, unknown>;
  }
  delete target[parts[parts.length - 1]];
}

export function createLocalGameStore(initial: Game | null = null): LocalGameStore {
  let game: Game | null = initial;
  const subscribers = new Set<(g: Game | null) => void>();

  function notify(): void {
    for (const cb of subscribers) cb(game);
  }

  return {
    subscribe(cb) {
      subscribers.add(cb);
      // Fire once with the current state so consumers don't sit in a
      // loading limbo waiting for the first write.
      cb(game);
      return () => {
        subscribers.delete(cb);
      };
    },
    async update(path, patch) {
      if (!game) return;
      const next = clone(game) as unknown as Record<string, unknown>;
      // Patch keys may themselves be slash-paths — e.g. update("",
      // { "round/phase": "withdraw" }). Join base + key to get the full path.
      for (const [key, value] of Object.entries(patch)) {
        const full = [path, key].filter(Boolean).join("/");
        writePath(next, full, value);
      }
      game = next as unknown as Game;
      notify();
    },
    async set(nextGame) {
      game = clone(nextGame);
      notify();
    },
    async remove(path) {
      if (!game) return;
      const next = clone(game) as unknown as Record<string, unknown>;
      deletePath(next, path);
      game = next as unknown as Game;
      notify();
    },
    serverTimestamp() {
      // Mirrors what the Firebase store's serverTimestamp eventually
      // resolves to — a number — so phaseStartedAt comparisons work the
      // same against the mock's wall clock.
      return Date.now();
    },
    reset(g) {
      game = g ? clone(g) : null;
      notify();
    },
  };
}
