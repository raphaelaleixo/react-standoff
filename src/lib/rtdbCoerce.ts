// Reverse two Firebase RTDB serialization quirks at the deserialization
// boundary, so consumer code can rely on its declared types:
//
//   1. Empty objects/arrays are stripped on write (read back as undefined).
//   2. Objects keyed by consecutive non-negative integer strings are returned
//      as (potentially sparse) arrays, with gaps filled by `undefined`.
//
// These helpers are generic primitives — when react-gameroom adds equivalents,
// this module can be deleted and imports retargeted.

export function asArray<T>(raw: unknown): T[] {
  if (raw == null) return [];
  if (Array.isArray(raw)) return raw.filter(x => x != null) as T[];
  if (typeof raw === "object") {
    return Object.values(raw as Record<string, T>).filter(x => x != null) as T[];
  }
  return [];
}

export function asRecord<V>(raw: unknown): Record<string, V> {
  if (raw == null) return {};
  if (Array.isArray(raw)) {
    const out: Record<string, V> = {};
    raw.forEach((entry, i) => {
      if (entry != null) out[String(i)] = entry as V;
    });
    return out;
  }
  if (typeof raw === "object") return raw as Record<string, V>;
  return {};
}
