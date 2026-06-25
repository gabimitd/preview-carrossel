import type { Store } from "./state";
import type { AppState } from "./types";
import "./ig-frame.css";
import { renderMobileFrame } from "./ig-frame-mobile";
import { renderDesktopFrame } from "./ig-frame-desktop";

const SWIPE_DISTANCE_THRESHOLD_PERCENT = 18; // % of track width
const SWIPE_DISTANCE_THRESHOLD_PX = 60;       // absolute fallback
const EDGE_RESISTANCE = 0.4;
const TRANSITION = "transform 0.35s cubic-bezier(0.25, 1, 0.5, 1)";

export function mountIGFrame(
  container: HTMLElement,
  store: Store<AppState>,
): () => void {
  // Track state preserved across renders to enable smooth animations
  let prevTransform: string | null = null;
  let isDragging = false;
  let dragStartX = 0;
  let dragStartY = 0;
  let dragBaseSlide = 0;
  let trackWidthCache = 0;

  function targetTransform(activeSlide: number): string {
    return `translateX(-${activeSlide * 100}%)`;
  }

  function setActive(next: number) {
    const s = store.getState();
    const total = s.carousel.slides.length;
    if (total <= 1) return;
    const clamped = Math.max(0, Math.min(total - 1, next));
    if (clamped === s.carousel.activeSlide) return;
    store.update((st) => ({
      ...st,
      carousel: { ...st.carousel, activeSlide: clamped },
    }));
  }

  function render() {
    const s = store.getState();
    const profile =
      s.profiles.find((p) => p.id === s.activeProfileId) ?? null;
    const fn =
      s.theme.device === "desktop" ? renderDesktopFrame : renderMobileFrame;
    container.innerHTML = fn({
      profile,
      slides: s.carousel.slides,
      activeSlide: s.carousel.activeSlide,
      post: s.post,
      theme: s.theme,
    });

    const track = container.querySelector(".track") as HTMLElement | null;
    const target = targetTransform(s.carousel.activeSlide);

    if (track) {
      // FLIP: if we have a prevTransform that differs from target, animate from prev to target
      if (prevTransform !== null && prevTransform !== target && !isDragging) {
        track.style.transition = "none";
        track.style.transform = prevTransform;
        // Force layout, then transition to target
        void track.offsetHeight;
        requestAnimationFrame(() => {
          if (!track.isConnected) return;
          track.style.transition = TRANSITION;
          track.style.transform = target;
        });
      } else {
        track.style.transition = TRANSITION;
        track.style.transform = target;
      }
      prevTransform = target;
    }

    attachInteractions();
  }

  function attachInteractions() {
    const wrap = container.querySelector(".image-wrap") as HTMLElement | null;
    const track = container.querySelector(".track") as HTMLElement | null;
    if (!wrap || !track) return;

    const total = store.getState().carousel.slides.length;
    if (total > 1) {
      wrap.style.touchAction = "pan-y";
      wrap.style.cursor = "grab";
      attachDrag(wrap, track);
      attachClickZones(wrap);
    } else {
      wrap.style.cursor = "default";
    }
  }

  function attachDrag(wrap: HTMLElement, track: HTMLElement) {
    function onMove(e: PointerEvent) {
      if (!isDragging) return;
      const dx = e.clientX - dragStartX;
      const dy = e.clientY - dragStartY;
      // Cancel drag if it starts looking like a vertical scroll
      if (Math.abs(dy) > Math.abs(dx) * 1.6 && Math.abs(dy) > 30) {
        isDragging = false;
        wrap.style.cursor = "grab";
        track.style.transition = TRANSITION;
        track.style.transform = targetTransform(dragBaseSlide);
        prevTransform = targetTransform(dragBaseSlide);
        document.removeEventListener("pointermove", onMove);
        document.removeEventListener("pointerup", onUp);
        document.removeEventListener("pointercancel", onUp);
        return;
      }
      const total = store.getState().carousel.slides.length;
      const dxPercent = trackWidthCache > 0 ? (dx / trackWidthCache) * 100 : 0;
      let totalPercent = -dragBaseSlide * 100 + dxPercent;
      const maxTotal = 0;
      const minTotal = -(total - 1) * 100;
      if (totalPercent > maxTotal) {
        totalPercent = maxTotal + (totalPercent - maxTotal) * EDGE_RESISTANCE;
      }
      if (totalPercent < minTotal) {
        totalPercent = minTotal + (totalPercent - minTotal) * EDGE_RESISTANCE;
      }
      const tform = `translateX(${totalPercent}%)`;
      track.style.transform = tform;
      prevTransform = tform; // remember drag-end position so FLIP starts here
    }

    function onUp(e: PointerEvent) {
      if (!isDragging) return;
      isDragging = false;
      wrap.style.cursor = "grab";
      document.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerup", onUp);
      document.removeEventListener("pointercancel", onUp);

      const dx = e.clientX - dragStartX;
      const total = store.getState().carousel.slides.length;
      const dxPercent =
        trackWidthCache > 0 ? (dx / trackWidthCache) * 100 : 0;

      let target = dragBaseSlide;
      const passedPercent =
        Math.abs(dxPercent) > SWIPE_DISTANCE_THRESHOLD_PERCENT;
      const passedAbs = Math.abs(dx) > SWIPE_DISTANCE_THRESHOLD_PX;
      if (passedPercent || passedAbs) {
        target = dx < 0 ? dragBaseSlide + 1 : dragBaseSlide - 1;
      }
      target = Math.max(0, Math.min(total - 1, target));

      // Re-enable transition for the snap
      track.style.transition = TRANSITION;

      if (target !== dragBaseSlide) {
        // store update triggers a render, FLIP animates from the current drag position to the target
        setActive(target);
      } else {
        // Snap back to current
        const back = targetTransform(dragBaseSlide);
        track.style.transform = back;
        prevTransform = back;
      }
    }

    function onDown(e: PointerEvent) {
      if ((e.target as HTMLElement).closest(".carousel-nav")) return;
      const total = store.getState().carousel.slides.length;
      if (total <= 1) return;
      isDragging = true;
      dragStartX = e.clientX;
      dragStartY = e.clientY;
      dragBaseSlide = store.getState().carousel.activeSlide;
      trackWidthCache = wrap.clientWidth;
      track.style.transition = "none";
      wrap.style.cursor = "grabbing";
      e.preventDefault();
      document.addEventListener("pointermove", onMove);
      document.addEventListener("pointerup", onUp);
      document.addEventListener("pointercancel", onUp);
    }

    wrap.addEventListener("pointerdown", onDown);
  }

  function attachClickZones(wrap: HTMLElement) {
    const prev = document.createElement("button");
    prev.className = "carousel-nav prev";
    prev.setAttribute("aria-label", "slide anterior");
    prev.innerHTML = "‹";
    const next = document.createElement("button");
    next.className = "carousel-nav next";
    next.setAttribute("aria-label", "próximo slide");
    next.innerHTML = "›";
    prev.addEventListener("click", (e) => {
      e.stopPropagation();
      setActive(store.getState().carousel.activeSlide - 1);
    });
    next.addEventListener("click", (e) => {
      e.stopPropagation();
      setActive(store.getState().carousel.activeSlide + 1);
    });
    // Prevent pointerdown on buttons from initiating a drag
    [prev, next].forEach((btn) => {
      btn.addEventListener("pointerdown", (e) => e.stopPropagation());
    });
    wrap.appendChild(prev);
    wrap.appendChild(next);
  }

  function onKey(e: KeyboardEvent) {
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
    if (e.key === "ArrowLeft") {
      setActive(store.getState().carousel.activeSlide - 1);
    } else if (e.key === "ArrowRight") {
      setActive(store.getState().carousel.activeSlide + 1);
    }
  }
  document.addEventListener("keydown", onKey);

  render();
  const off = store.subscribe(render);
  return () => {
    off();
    document.removeEventListener("keydown", onKey);
  };
}
