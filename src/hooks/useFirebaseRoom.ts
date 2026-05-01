import { useEffect, useState, useCallback } from "react";
import { ref, onValue, set, get } from "firebase/database";
import { deserializeRoom } from "react-gameroom";
import type { RoomState } from "react-gameroom";
import { database } from "../firebase";
import type { Player } from "../game/types";

export function useFirebaseRoom(roomId: string | undefined) {
  const [roomState, setRoomState] = useState<RoomState<Player> | null>(null);
  const [error, setError] = useState<string | null>(null);
  // Tracks which roomId the latest received snapshot belongs to, so a stale
  // snapshot from a previous subscription doesn't make us look "loaded".
  const [loadedFor, setLoadedFor] = useState<string | null>(null);

  useEffect(() => {
    if (!roomId) return;
    const stateRef = ref(database, `rooms/${roomId}/state`);
    const unsubscribe = onValue(
      stateRef,
      (snapshot) => {
        const data = snapshot.val();
        if (data) {
          setRoomState(deserializeRoom<Player>(data));
          setError(null);
        } else {
          setRoomState(null);
          setError("Room not found");
        }
        setLoadedFor(roomId);
      },
      (err) => {
        setError(err.message);
        setLoadedFor(roomId);
      },
    );
    return unsubscribe;
  }, [roomId]);

  const loading = roomId !== undefined && loadedFor !== roomId;

  const updateRoom = useCallback(
    async (newState: RoomState<Player>) => {
      if (!roomId) return;
      await set(ref(database, `rooms/${roomId}/state`), newState);
    },
    [roomId],
  );

  return { roomState, loading, error, updateRoom };
}

export async function roomExists(roomId: string): Promise<boolean> {
  const snapshot = await get(ref(database, `rooms/${roomId}/state/roomId`));
  return snapshot.exists();
}
