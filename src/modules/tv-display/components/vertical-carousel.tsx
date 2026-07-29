"use client";

import type {
  CSSProperties,
  KeyboardEvent,
  ReactNode,
  TouchEvent,
  WheelEvent,
} from "react";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";

type CarouselItem = { id: string };

type VerticalCarouselProps<T extends CarouselItem> = {
  emptyState: ReactNode;
  items: T[];
  label: string;
  onSelect: (item: T) => void;
  renderItem: (
    item: T,
    active: boolean,
    selectItem: () => void,
  ) => ReactNode;
};

const FIVE_SLOT_OFFSETS = [-2, -1, 0, 1, 2] as const;
const THREE_SLOT_OFFSETS = [-1, 0, 1] as const;
const ONE_SLOT_OFFSET = [0] as const;

function modulo(value: number, length: number) {
  if (length <= 0) return 0;
  return ((value % length) + length) % length;
}

function getSlotOffsets(itemCount: number): readonly number[] {
  if (itemCount <= 1) return ONE_SLOT_OFFSET;
  if (itemCount <= 3) return THREE_SLOT_OFFSETS;
  return FIVE_SLOT_OFFSETS;
}

function getItemStyle(distance: number): CSSProperties {
  const absoluteDistance = Math.abs(distance);

  return {
    opacity: Math.max(0, Math.min(1, 1 - absoluteDistance * 0.56)),
    transform: `translateY(calc(-50% + ${distance * 92}%)) scale(${Math.max(0.72, 1 - absoluteDistance * 0.16)})`,
    zIndex: 10 - Math.round(absoluteDistance),
  };
}

export function VerticalCarousel<T extends CarouselItem>({
  emptyState,
  items,
  label,
  onSelect,
  renderItem,
}: VerticalCarouselProps<T>) {
  const [anchorIndex, setAnchorIndex] = useState(0);
  const anchorIndexRef = useRef(0);
  const animationFrameRef = useRef<number | null>(null);
  const positionRef = useRef(0);
  const slotRefs = useRef<Array<HTMLDivElement | null>>([]);
  const touchStartPositionRef = useRef(0);
  const touchStartYRef = useRef<number | null>(null);
  const velocityRef = useRef(0);
  const slotOffsets = getSlotOffsets(items.length);

  const setSlotsWillChange = useCallback((value: string) => {
    slotRefs.current.forEach((slot) => {
      if (slot) slot.style.willChange = value;
    });
  }, []);

  const applySlotStyles = useCallback(
    (position: number, renderedAnchor: number) => {
      slotOffsets.forEach((offset, slotIndex) => {
        const slot = slotRefs.current[slotIndex];
        if (!slot) return;

        const style = getItemStyle(renderedAnchor + offset - position);
        slot.style.opacity = String(style.opacity);
        slot.style.transform = String(style.transform);
        slot.style.zIndex = String(style.zIndex);
      });
    },
    [slotOffsets],
  );

  const stopMomentum = useCallback(() => {
    if (animationFrameRef.current !== null) {
      window.cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    velocityRef.current = 0;
    setSlotsWillChange("");
  }, [setSlotsWillChange]);

  function updatePosition(nextPosition: number) {
    positionRef.current = nextPosition;
    const nextAnchor = Math.round(nextPosition);

    if (nextAnchor !== anchorIndexRef.current) {
      anchorIndexRef.current = nextAnchor;
      setAnchorIndex(nextAnchor);
      return;
    }

    applySlotStyles(nextPosition, anchorIndexRef.current);
  }

  function startMomentum() {
    if (animationFrameRef.current !== null || items.length <= 1) return;
    setSlotsWillChange("transform, opacity");

    function animate() {
      if (Math.abs(velocityRef.current) < 0.0005) {
        velocityRef.current = 0;
        animationFrameRef.current = null;
        setSlotsWillChange("");
        return;
      }

      updatePosition(positionRef.current + velocityRef.current);
      velocityRef.current *= 0.89;
      animationFrameRef.current = window.requestAnimationFrame(animate);
    }

    animationFrameRef.current = window.requestAnimationFrame(animate);
  }

  function addVelocity(impulse: number) {
    if (items.length <= 1) return;

    velocityRef.current = Math.max(
      -0.34,
      Math.min(0.34, velocityRef.current + impulse),
    );
    startMomentum();
  }

  useLayoutEffect(() => {
    applySlotStyles(positionRef.current, anchorIndex);
  }, [anchorIndex, applySlotStyles]);

  useEffect(() => {
    stopMomentum();
    positionRef.current = 0;
    anchorIndexRef.current = 0;
    const resetTimer = window.setTimeout(() => setAnchorIndex(0), 0);

    return () => {
      window.clearTimeout(resetTimer);
      stopMomentum();
    };
  }, [items, stopMomentum]);

  function handleWheel(event: WheelEvent<HTMLDivElement>) {
    if (items.length <= 1 || Math.abs(event.deltaY) < 0.5) return;

    event.preventDefault();
    const pixelDelta =
      event.deltaMode === 1
        ? event.deltaY * 16
        : event.deltaMode === 2
          ? event.deltaY * window.innerHeight
          : event.deltaY;
    addVelocity(Math.max(-0.18, Math.min(0.18, pixelDelta * 0.0012)));
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      addVelocity(0.12);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      addVelocity(-0.12);
    } else if (
      (event.key === "Enter" || event.key === " ") &&
      event.target === event.currentTarget
    ) {
      const item = items[modulo(anchorIndexRef.current, items.length)];
      if (!item) return;
      event.preventDefault();
      onSelect(item);
    }
  }

  function handleTouchStart(event: TouchEvent<HTMLDivElement>) {
    touchStartYRef.current = event.touches[0]?.clientY ?? null;
    touchStartPositionRef.current = positionRef.current;
    stopMomentum();
    setSlotsWillChange("transform, opacity");
  }

  function handleTouchMove(event: TouchEvent<HTMLDivElement>) {
    const startY = touchStartYRef.current;
    const currentY = event.touches[0]?.clientY;
    if (startY === null || currentY === undefined) return;

    event.preventDefault();
    updatePosition(
      touchStartPositionRef.current + (startY - currentY) / 260,
    );
  }

  function handleTouchEnd(event: TouchEvent<HTMLDivElement>) {
    const startY = touchStartYRef.current;
    const endY = event.changedTouches[0]?.clientY;
    touchStartYRef.current = null;
    setSlotsWillChange("");
    if (startY === null || endY === undefined) return;

    const distance = startY - endY;
    if (Math.abs(distance) >= 16) addVelocity(distance * 0.0008);
  }

  if (items.length === 0) return emptyState;

  return (
    <div
      aria-label={label}
      className="relative min-h-0 touch-none overflow-hidden outline-none focus-visible:rounded-2xl focus-visible:shadow-[0_0_0_4px_rgba(237,161,47,0.16)]"
      onKeyDown={handleKeyDown}
      onTouchEnd={handleTouchEnd}
      onTouchMove={handleTouchMove}
      onTouchStart={handleTouchStart}
      onWheel={handleWheel}
      role="region"
      tabIndex={0}
    >
      {slotOffsets.map((offset, slotIndex) => {
        const item = items[modulo(anchorIndex + offset, items.length)];
        const active = offset === 0;
        if (!item) return null;

        return (
          <div
            aria-hidden={!active}
            className={
              active
                ? "pointer-events-auto absolute inset-x-0 top-1/2"
                : "pointer-events-none absolute inset-x-0 top-1/2"
            }
            key={offset}
            ref={(element) => {
              slotRefs.current[slotIndex] = element;
            }}
            style={getItemStyle(offset)}
          >
            {renderItem(item, active, () => onSelect(item))}
          </div>
        );
      })}
    </div>
  );
}
