import type { Store } from "./state";
import type { AppState } from "./types";
import "./ig-frame.css";
import { renderMobileFrame } from "./ig-frame-mobile";
import { renderDesktopFrame } from "./ig-frame-desktop";

const SWIPE_THRESHOLD_PX = 40;

export function mountIGFrame(
  container: HTMLElement,
  store: Store<AppState>,
): () => void {
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
    attachSwipe();
    attachClickZones();
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

  function attachSwipe() {
    const wrap = container.querySelector(".image-wrap") as HTMLElement | null;
    if (!wrap) return;
    if (store.getState().carousel.slides.length <= 1) {
      wrap.style.cursor = "default";
      return;
    }
    wrap.style.touchAction = "pan-y";
    wrap.style.cursor = "grab";

    let startX = 0;
    let startY = 0;
    let dragging = false;

    function onUp(e: PointerEvent) {
      if (!dragging) return;
      dragging = false;
      if (wrap) wrap.style.cursor = "grab";
      document.removeEventListener("pointerup", onUp);
      document.removeEventListener("pointercancel", onUp);

      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      if (Math.abs(dx) < SWIPE_THRESHOLD_PX) return;
      if (Math.abs(dy) > Math.abs(dx)) return; // ignore vertical drags
      const cur = store.getState().carousel.activeSlide;
      setActive(dx < 0 ? cur + 1 : cur - 1);
    }

    function onDown(e: PointerEvent) {
      // Don't intercept clicks on nav buttons
      const target = e.target as HTMLElement;
      if (target.closest(".carousel-nav")) return;
      startX = e.clientX;
      startY = e.clientY;
      dragging = true;
      if (wrap) wrap.style.cursor = "grabbing";
      e.preventDefault();
      document.addEventListener("pointerup", onUp);
      document.addEventListener("pointercancel", onUp);
    }

    wrap.addEventListener("pointerdown", onDown);
  }

  function attachClickZones() {
    const wrap = container.querySelector(".image-wrap") as HTMLElement | null;
    if (!wrap) return;
    const total = store.getState().carousel.slides.length;
    if (total <= 1) return;
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
    wrap.appendChild(prev);
    wrap.appendChild(next);
  }

  // Keyboard arrows when not in an input
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
