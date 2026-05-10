import type { Store } from "./state";
import type { AppState } from "./types";
import "./ig-frame.css";
import { renderMobileFrame } from "./ig-frame-mobile";
import { renderDesktopFrame } from "./ig-frame-desktop";

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
  }

  render();
  return store.subscribe(render);
}
