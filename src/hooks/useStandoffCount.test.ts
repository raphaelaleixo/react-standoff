import { renderHook, act } from "@testing-library/react";
import { useStandoffCount } from "./useStandoffCount";

describe("useStandoffCount", () => {
  it("returns null when not active", () => {
    const { result } = renderHook(() =>
      useStandoffCount({ active: false, durationMs: 4000, startedAt: 0 })
    );
    expect(result.current).toBeNull();
  });

  it("counts down from 3 toward 1 over the duration when active", () => {
    vi.useFakeTimers();
    const startedAt = Date.now();
    const { result, rerender } = renderHook(() =>
      useStandoffCount({ active: true, durationMs: 4000, startedAt })
    );
    expect(result.current).toBe(3);
    act(() => {
      vi.advanceTimersByTime(1400);
    });
    rerender();
    expect(result.current).toBe(2);
    act(() => {
      vi.advanceTimersByTime(1400);
    });
    rerender();
    expect(result.current).toBe(1);
    vi.useRealTimers();
  });
});
