import {
  onValue,
  ref,
  remove as fbRemove,
  serverTimestamp as fbServerTimestamp,
  set as fbSet,
  update as fbUpdate,
} from "firebase/database";
import { database } from "../firebase";
import { normalizeGame } from "../game/deserialize";
import type { Game } from "../game/types";

// Storage abstraction used by useGameState. The Firebase implementation
// is what production runs; the in-memory implementation in
// `components/dev/localGameStore` is what the mock big-screen uses so
// the same state-machine effects can play scenarios out locally without
// touching Firebase.
//
// Paths are slash-delimited just like RTDB (e.g. "round/phase",
// "round/commits/p1"). The empty path means "the whole game".
export interface GameStore {
  subscribe(cb: (game: Game | null) => void): () => void;
  /** Atomic merge of `patch` into the node at `path`. Patch keys MAY be
   *  slash-paths themselves (e.g. `{ "round/phase": "withdraw" }`),
   *  mirroring Firebase's multi-path update semantics. */
  update(path: string, patch: Record<string, unknown>): Promise<void>;
  /** Replace the whole game state with `next`. */
  set(next: Game): Promise<void>;
  /** Clear a single key at `path`. */
  remove(path: string): Promise<void>;
  /** Sentinel for "server time at write". Firebase replaces it on write;
   *  local stores can return Date.now() directly. */
  serverTimestamp(): unknown;
}

// Firebase-backed store rooted at rooms/{roomId}/game. The base path is
// captured at construction so consumers don't have to thread the roomId
// through every write.
export function createFirebaseGameStore(roomId: string): GameStore {
  const base = `rooms/${roomId}/game`;
  const refAt = (path: string) =>
    ref(database, path ? `${base}/${path}` : base);
  return {
    subscribe(cb) {
      return onValue(refAt(""), snap => cb(normalizeGame(snap.val())));
    },
    update(path, patch) {
      return fbUpdate(refAt(path), patch);
    },
    set(next) {
      return fbSet(refAt(""), next);
    },
    remove(path) {
      return fbRemove(refAt(path));
    },
    serverTimestamp() {
      return fbServerTimestamp();
    },
  };
}
