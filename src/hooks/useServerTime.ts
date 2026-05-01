import { useCallback, useEffect, useState } from "react";
import { onValue, ref } from "firebase/database";
import { database } from "../firebase";

// Subscribes to RTDB's `.info/serverTimeOffset` and exposes a `serverNow()`
// that returns server-aligned epoch ms. Use this anywhere the local clock
// would otherwise be compared against a server-written timestamp — without it,
// a phone with skewed system time will fire timed transitions early/late.
export function useServerTime() {
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    const r = ref(database, ".info/serverTimeOffset");
    return onValue(r, snap => setOffset((snap.val() as number) ?? 0));
  }, []);

  const serverNow = useCallback(() => Date.now() + offset, [offset]);
  return { offset, serverNow };
}
