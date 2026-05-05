import { renderHook, act } from "@testing-library/react";
import { useStandoffCount } from "./useStandoffCount";

describe("useStandoffCount", () => {
  it("returns null when not active", () => {
    const { result } = renderHook(() =>
      useStandoffCount({ active: false, durationMs: 4000, startedAt: 0 })
    );
    expect(result.current).toBeNull();
  });

  it("counts down from 3 to 0 over the duration when active", () => {
    vi.useFakeTimers();
    const startedAt = Date.now();
    const { result, rerender } = renderHook(() =>
      useStandoffCount({ active: true, durationMs: 3000, startedAt })
    );
    expect(result.current).toBe(3);
    act(() => {
      vi.advanceTimersByTime(1100);
    });
    rerender();
    expect(result.current).toBe(2);
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    rerender();
    expect(result.current).toBe(1);
    act(() => {
      vi.advanceTimersByTime(1100);
    });
    rerender();
    expect(result.current).toBe(0);
    vi.useRealTimers();
  });
});
