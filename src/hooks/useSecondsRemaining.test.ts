import { renderHook, act } from "@testing-library/react";
import { useSecondsRemaining } from "./useSecondsRemaining";

describe("useSecondsRemaining", () => {
  it("returns null when not active", () => {
    const { result } = renderHook(() =>
      useSecondsRemaining({ active: false, durationMs: 10000, startedAt: 0 }),
    );
    expect(result.current).toBeNull();
  });

  it("counts whole seconds down from durationMs/1000 to 0 when active", () => {
    vi.useFakeTimers();
    const startedAt = Date.now();
    const { result, rerender } = renderHook(() =>
      useSecondsRemaining({ active: true, durationMs: 10000, startedAt }),
    );
    expect(result.current).toBe(10);
    act(() => {
      vi.advanceTimersByTime(1100);
    });
    rerender();
    expect(result.current).toBe(9);
    act(() => {
      vi.advanceTimersByTime(8000);
    });
    rerender();
    expect(result.current).toBe(1);
    act(() => {
      vi.advanceTimersByTime(2000);
    });
    rerender();
    expect(result.current).toBe(0);
    vi.useRealTimers();
  });
});
