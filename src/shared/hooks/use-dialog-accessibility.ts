"use client";

import { useEffect, useRef } from "react";

const focusableSelector = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled]):not([type='hidden'])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "[tabindex]:not([tabindex='-1'])",
].join(",");

function getFocusableElements(container: HTMLElement) {
  return Array.from(
    container.querySelectorAll<HTMLElement>(focusableSelector),
  ).filter(
    (element) =>
      element.getAttribute("aria-hidden") !== "true" &&
      (element.offsetWidth > 0 ||
        element.offsetHeight > 0 ||
        element.getClientRects().length > 0),
  );
}

type DialogAccessibilityOptions = {
  active?: boolean;
  closeOnEscape?: boolean;
};

export function useDialogAccessibility<T extends HTMLElement>(
  onClose: () => void,
  { active = true, closeOnEscape = true }: DialogAccessibilityOptions = {},
) {
  const dialogRef = useRef<T | null>(null);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!active) return;

    const dialog = dialogRef.current;
    const previouslyFocused =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;

    if (!dialog) return;

    const previousBodyOverflow = document.body.style.overflow;
    const previousBodyOverscrollBehavior =
      document.body.style.overscrollBehavior;

    document.body.style.overflow = "hidden";
    document.body.style.overscrollBehavior = "none";

    const focusFrame = window.requestAnimationFrame(() => {
      const [firstFocusable] = getFocusableElements(dialog);
      (firstFocusable ?? dialog).focus();
    });

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && closeOnEscape) {
        event.preventDefault();
        onCloseRef.current();
        return;
      }

      if (event.key !== "Tab" || !dialog) return;

      const focusableElements = getFocusableElements(dialog);
      const firstFocusable = focusableElements[0];
      const lastFocusable = focusableElements.at(-1);

      if (!firstFocusable || !lastFocusable) {
        event.preventDefault();
        dialog.focus();
        return;
      }

      const activeElement = document.activeElement;
      const focusWouldLeaveAtStart =
        event.shiftKey &&
        (activeElement === firstFocusable || !dialog.contains(activeElement));
      const focusWouldLeaveAtEnd =
        !event.shiftKey &&
        (activeElement === lastFocusable || !dialog.contains(activeElement));

      if (focusWouldLeaveAtStart) {
        event.preventDefault();
        lastFocusable.focus();
      } else if (focusWouldLeaveAtEnd) {
        event.preventDefault();
        firstFocusable.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      window.cancelAnimationFrame(focusFrame);
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousBodyOverflow;
      document.body.style.overscrollBehavior = previousBodyOverscrollBehavior;

      if (previouslyFocused?.isConnected) {
        previouslyFocused.focus();
      }
    };
  }, [active, closeOnEscape]);

  return dialogRef;
}
