import type { Store } from "./state";
import type { AppState, Draft } from "./types";
import { resizeElementToThumb } from "./resize-image";

const AUTOSAVE_DEBOUNCE_MS = 800;

/**
 * Autosaves the current carousel + post into a Draft entry. The latest
 * carousel is identified by createdAt order. Up to 5 drafts kept (FIFO).
 *
 * Returns a cleanup function that disables autosave.
 */
export function mountAutosave(store: Store<AppState>): () => void {
  let timer: number | null = null;
  let currentDraftId: string | null = null;

  function scheduleSave() {
    if (timer !== null) clearTimeout(timer);
    timer = window.setTimeout(saveNow, AUTOSAVE_DEBOUNCE_MS);
  }

  async function saveNow() {
    const s = store.getState();
    if (s.carousel.slides.length === 0) return;

    let thumb = "";
    try {
      const firstImg = new Image();
      firstImg.src = s.carousel.slides[0].dataUrl;
      await new Promise<void>((res) => {
        firstImg.onload = () => res();
        firstImg.onerror = () => res();
      });
      thumb = resizeElementToThumb(firstImg, 80);
    } catch {
      thumb = s.carousel.slides[0].dataUrl;
    }

    const draft: Draft = {
      id: currentDraftId ?? crypto.randomUUID(),
      createdAt: Date.now(),
      thumbnailDataUrl: thumb,
      carouselSlides: s.carousel.slides,
      carouselCuts: s.carousel.cuts,
      post: s.post,
    };
    currentDraftId = draft.id;

    store.update((st) => {
      const others = st.drafts.filter((d) => d.id !== draft.id);
      const next = [...others, draft].slice(-5);
      return { ...st, drafts: next };
    });
  }

  const off = store.subscribe((next, prev) => {
    if (next.carousel.slides !== prev.carousel.slides || next.post !== prev.post) {
      scheduleSave();
    }
  });

  // Reset draft id when a fresh upload happens (slides cleared then repopulated)
  let prevHadSlides = store.getState().carousel.slides.length > 0;
  const offReset = store.subscribe((s) => {
    const has = s.carousel.slides.length > 0;
    if (!prevHadSlides && has && currentDraftId === null) {
      currentDraftId = crypto.randomUUID();
    }
    if (prevHadSlides && !has) {
      currentDraftId = null;
    }
    prevHadSlides = has;
  });

  return () => {
    if (timer !== null) clearTimeout(timer);
    off();
    offReset();
  };
}

/** Restore a draft into the active carousel + post. */
export function restoreDraft(store: Store<AppState>, draftId: string): void {
  const s = store.getState();
  const d = s.drafts.find((x) => x.id === draftId);
  if (!d) return;
  store.update((st) => ({
    ...st,
    carousel: {
      ...st.carousel,
      slides: d.carouselSlides,
      cuts: d.carouselCuts,
      activeSlide: 0,
      sourceImage: null, // can't restore the source image; user must re-upload to re-cut
    },
    post: d.post,
  }));
}

export function deleteDraft(store: Store<AppState>, draftId: string): void {
  store.update((st) => ({
    ...st,
    drafts: st.drafts.filter((d) => d.id !== draftId),
  }));
}
