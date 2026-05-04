import { useCallback, useEffect, useState } from "react";

export interface UseDevPanelToggleResult {
  open: boolean;
  setOpen(next: boolean): void;
  toggle(): void;
}

const isEditableTarget = (el: Element | null): boolean => {
  if (!el) return false;
  if (el instanceof HTMLInputElement) return true;
  if (el instanceof HTMLTextAreaElement) return true;
  if (
    el instanceof HTMLElement &&
    (el.isContentEditable ||
      el.getAttribute("contenteditable") === "true" ||
      el.getAttribute("contenteditable") === "")
  )
    return true;
  return false;
};

export function useDevPanelToggle(initialOpen = true): UseDevPanelToggleResult {
  const [open, setOpen] = useState<boolean>(initialOpen);

  const toggle = useCallback(() => setOpen(o => !o), []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (isEditableTarget(document.activeElement)) return;
      if (event.code === "Backquote") {
        event.preventDefault();
        setOpen(o => !o);
      } else if (event.key === "Escape") {
        setOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return { open, setOpen, toggle };
}
