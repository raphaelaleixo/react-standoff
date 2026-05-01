import { describe, expect, test } from "vitest";
import { asArray, asRecord } from "./rtdbCoerce";

describe("asArray", () => {
  test("undefined / null become []", () => {
    expect(asArray(undefined)).toEqual([]);
    expect(asArray(null)).toEqual([]);
  });

  test("real arrays pass through, dropping nullish entries (RTDB sparse-array case)", () => {
    expect(asArray([1, 2, 3])).toEqual([1, 2, 3]);
    expect(asArray([undefined, "a", null, "b"])).toEqual(["a", "b"]);
  });

  test("string-keyed objects (RTDB record-as-object) collapse to value arrays", () => {
    expect(asArray({ a: 1, b: 2 })).toEqual([1, 2]);
  });
});

describe("asRecord", () => {
  test("undefined / null become {}", () => {
    expect(asRecord(undefined)).toEqual({});
    expect(asRecord(null)).toEqual({});
  });

  test("plain objects pass through", () => {
    expect(asRecord({ "1": "a", "2": "b" })).toEqual({ "1": "a", "2": "b" });
  });

  test("sparse arrays (RTDB numeric-key coercion) become string-keyed records, gaps dropped", () => {
    // Simulates RTDB returning { "1": "a", "3": "c" } as [undefined, "a", undefined, "c"]
    const sparse = [undefined, "a", undefined, "c"];
    expect(asRecord(sparse)).toEqual({ "1": "a", "3": "c" });
  });
});
