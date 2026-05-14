import { createInitialRoom, generateRoomId } from "react-gameroom";
import { ref, set } from "firebase/database";
import { database } from "../firebase";
import type { GameVariants, Player } from "../game/types";

const ROOM_CONFIG = { minPlayers: 4, maxPlayers: 6, requireFull: false };

export async function createRoom(
  variants: GameVariants = { superPowers: false, cop: false },
): Promise<string> {
  const roomId = generateRoomId();
  const initial = { ...createInitialRoom<Player>(ROOM_CONFIG), roomId };
  await set(ref(database, `rooms/${roomId}/state`), initial);
  await set(ref(database, `rooms/${roomId}/lobbyVariants`), variants);
  return roomId;
}
