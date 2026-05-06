"use client";

import type { MouseEvent, PointerEvent } from "react";
import { useCallback, useRef } from "react";

type SwipeCarouselOptions = {
  itemCount: number;
  onNext: () => void;
  onPrevious: () => void;
  threshold?: number;
};

export function useSwipeCarousel({
  itemCount,
  onNext,
  onPrevious,
  threshold = 54,
}: SwipeCarouselOptions) {
  const activePointerId = useRef<number | null>(null);
  const startX = useRef(0);
  const startY = useRef(0);
  const shouldBlockClick = useRef(false);

  const resetSwipe = useCallback(() => {
    activePointerId.current = null;
    startX.current = 0;
    startY.current = 0;
  }, []);

  const onPointerDown = useCallback(
    (event: PointerEvent<HTMLElement>) => {
      if (itemCount < 2 || (event.pointerType === "mouse" && event.button !== 0)) {
        return;
      }

      activePointerId.current = event.pointerId;
      startX.current = event.clientX;
      startY.current = event.clientY;
      shouldBlockClick.current = false;
      event.currentTarget.setPointerCapture?.(event.pointerId);
    },
    [itemCount],
  );

  const onPointerMove = useCallback((event: PointerEvent<HTMLElement>) => {
    if (activePointerId.current !== event.pointerId) {
      return;
    }

    const deltaX = event.clientX - startX.current;
    const deltaY = event.clientY - startY.current;

    if (Math.abs(deltaX) > 12 && Math.abs(deltaX) > Math.abs(deltaY)) {
      shouldBlockClick.current = true;
    }
  }, []);

  const finishSwipe = useCallback(
    (event: PointerEvent<HTMLElement>) => {
      if (activePointerId.current !== event.pointerId) {
        return;
      }

      const deltaX = event.clientX - startX.current;
      const deltaY = event.clientY - startY.current;

      if (Math.abs(deltaX) >= threshold && Math.abs(deltaX) > Math.abs(deltaY) * 1.2) {
        shouldBlockClick.current = true;
        if (deltaX < 0) {
          onNext();
        } else {
          onPrevious();
        }
      }

      event.currentTarget.releasePointerCapture?.(event.pointerId);
      resetSwipe();
    },
    [onNext, onPrevious, resetSwipe, threshold],
  );

  const onClickCapture = useCallback((event: MouseEvent<HTMLElement>) => {
    if (!shouldBlockClick.current) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    shouldBlockClick.current = false;
  }, []);

  return {
    onClickCapture,
    onLostPointerCapture: resetSwipe,
    onPointerCancel: resetSwipe,
    onPointerDown,
    onPointerMove,
    onPointerUp: finishSwipe,
  };
}
