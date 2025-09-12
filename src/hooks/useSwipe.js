import { useEffect, useRef } from "react";

/**
 * useSwipe
 * - 터치(또는 지원 시 PointerEvent)로 좌/우/상/하 스와이프 방향을 콜백으로 전달합니다.
 * - threshold: 스와이프 인식 최소 이동 픽셀
 * - preventScroll: 엘리먼트에 touch-action: none을 적용해 스크롤 제스처 방지
 * - capture: 캡처 단계에서 리스닝할지 여부
 *
 * 반환값: ref (스와이프를 감지할 DOM 요소에 연결)
 */
export default function useSwipe({
  onSwipe,
  threshold = 24,
  preventScroll = true,
  capture = false,
} = {}) {
  const ref = useRef(null);
  const startX = useRef(0);
  const startY = useRef(0);
  const activeRef = useRef(false);
  const pointerIdRef = useRef(null);

  const getDir = (dx, dy) => {
    const ax = Math.abs(dx);
    const ay = Math.abs(dy);
    if (Math.max(ax, ay) < threshold) return null;
    return ax > ay ? (dx < 0 ? "left" : "right") : dy < 0 ? "up" : "down";
  };

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof onSwipe !== "function") return;

    const usePointer = "PointerEvent" in window;

    const onPointerDown = (e) => {
      // 터치만 인식 (마우스/펜 제외)
      if (e.pointerType && e.pointerType !== "touch") return;
      activeRef.current = true;
      pointerIdRef.current = e.pointerId;
      startX.current = e.clientX;
      startY.current = e.clientY;
    };

    const onPointerUp = (e) => {
      if (!activeRef.current) return;
      if (pointerIdRef.current != null && e.pointerId !== pointerIdRef.current)
        return;
      activeRef.current = false;
      const dx = e.clientX - startX.current;
      const dy = e.clientY - startY.current;
      const dir = getDir(dx, dy);
      if (dir) onSwipe(dir);
      pointerIdRef.current = null;
    };

    const onPointerCancel = () => {
      activeRef.current = false;
      pointerIdRef.current = null;
    };

    const onTouchStart = (e) => {
      if (!e.touches || e.touches.length !== 1) return;
      activeRef.current = true;
      const t = e.touches[0];
      startX.current = t.clientX;
      startY.current = t.clientY;
    };

    const onTouchEnd = (e) => {
      if (!activeRef.current) return;
      activeRef.current = false;
      const t = e.changedTouches && e.changedTouches[0];
      if (!t) return;
      const dx = t.clientX - startX.current;
      const dy = t.clientY - startY.current;
      const dir = getDir(dx, dy);
      if (dir) onSwipe(dir);
    };

    const onTouchCancel = () => {
      activeRef.current = false;
    };

    if (preventScroll) {
      // 스크롤 제스처가 스와이프 인식을 방해하지 않도록
      el.style.touchAction = "none";
      el.style.webkitTapHighlightColor = "transparent";
    }

    if (usePointer) {
      el.addEventListener("pointerdown", onPointerDown, {
        passive: true,
        capture,
      });
      el.addEventListener("pointerup", onPointerUp, { passive: true, capture });
      el.addEventListener("pointercancel", onPointerCancel, {
        passive: true,
        capture,
      });
    } else {
      el.addEventListener("touchstart", onTouchStart, {
        passive: true,
        capture,
      });
      el.addEventListener("touchend", onTouchEnd, { passive: true, capture });
      el.addEventListener("touchcancel", onTouchCancel, {
        passive: true,
        capture,
      });
    }

    return () => {
      if (usePointer) {
        el.removeEventListener("pointerdown", onPointerDown, { capture });
        el.removeEventListener("pointerup", onPointerUp, { capture });
        el.removeEventListener("pointercancel", onPointerCancel, { capture });
      } else {
        el.removeEventListener("touchstart", onTouchStart, { capture });
        el.removeEventListener("touchend", onTouchEnd, { capture });
        el.removeEventListener("touchcancel", onTouchCancel, { capture });
      }
    };
  }, [onSwipe, threshold, preventScroll, capture]);

  return ref;
}
