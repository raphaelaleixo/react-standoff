import { describe, expect, test, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useDevPanelToggle } from "./useDevPanelToggle";

const fireKey = (key: string) => {
  window.dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true }));
};

afterEach(() => {
  document.body.innerHTML = "";
});

describe("useDevPanelToggle", () => {
  test("starts open when initialOpen=true", () => {
    const { result } = renderHook(() => useDevPanelToggle(true));
    expect(result.current.open).toBe(true);
  });

  test("starts closed when initialOpen=false", () => {
    const { result } = renderHook(() => useDevPanelToggle(false));
    expect(result.current.open).toBe(false);
  });

  test("backtick toggles open/closed", () => {
    const { result } = renderHook(() => useDevPanelToggle(false));
    expect(result.current.open).toBe(false);

    act(() => fireKey("`"));
    expect(result.current.open).toBe(true);

    act(() => fireKey("`"));
    expect(result.current.open).toBe(false);
  });

  test("Escape closes when open and is a no-op when closed", () => {
    const { result } = renderHook(() => useDevPanelToggle(true));
    expect(result.current.open).toBe(true);

    act(() => fireKey("Escape"));
    expect(result.current.open).toBe(false);

    act(() => fireKey("Escape"));
    expect(result.current.open).toBe(false);
  });

  test("ignores backtick and Escape when an <input> is focused", () => {
    const input = document.createElement("input");
    document.body.appendChild(input);
    input.focus();
    expect(document.activeElement).toBe(input);

    const { result } = renderHook(() => useDevPanelToggle(true));

    act(() => fireKey("`"));
    expect(result.current.open).toBe(true); // unchanged

    act(() => fireKey("Escape"));
    expect(result.current.open).toBe(true); // unchanged
  });

  test("ignores backtick and Escape when a <textarea> is focused", () => {
    const textarea = document.createElement("textarea");
    document.body.appendChild(textarea);
    textarea.focus();
    expect(document.activeElement).toBe(textarea);

    const { result } = renderHook(() => useDevPanelToggle(true));

    act(() => fireKey("`"));
    expect(result.current.open).toBe(true); // unchanged

    act(() => fireKey("Escape"));
    expect(result.current.open).toBe(true); // unchanged
  });

  test("ignores backtick when a contenteditable element is focused", () => {
    const div = document.createElement("div");
    div.setAttribute("contenteditable", "true");
    div.tabIndex = 0;
    document.body.appendChild(div);
    div.focus();

    const { result } = renderHook(() => useDevPanelToggle(false));
    act(() => fireKey("`"));
    expect(result.current.open).toBe(false);
  });

  test("setOpen and toggle work programmatically", () => {
    const { result } = renderHook(() => useDevPanelToggle(false));

    act(() => result.current.setOpen(true));
    expect(result.current.open).toBe(true);

    act(() => result.current.toggle());
    expect(result.current.open).toBe(false);
  });
});
