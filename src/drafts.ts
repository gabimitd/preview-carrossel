import type { Store } from "./state";
import type { AppState, Draft, Slide } from "./types";
import { resizeElementToThumb } from "./resize-image";

const AUTOSAVE_DEBOUNCE_MS = 800;
const STORAGE_JPEG_QUALITY = 0.75;

/**
 * Re-encode a PNG data URL as JPEG to drastically shrink its size in
 * localStorage. Real-photo carousel slides go from ~1-2MB PNG base64 down
 * to ~150-300KB JPEG base64, which is the difference between "fits in
 * localStorage" and "QuotaExceededError". JPEG is already what Instagram
 * stores anyway, so quality loss is invisible on the platform.
 */
async function compressSlideForStorage(dataUrl: string): Promise<string> {
  if (!dataUrl.startsWith("data:image/png")) return dataUrl; // already compressed
  try {
    const img = new Image();
    await new Promise<void>((res, rej) => {
      img.onload = () => res();
      img.onerror = () => rej(new Error("img load failed"));
      img.src = dataUrl;
    });
    const canvas = document.createElement("canvas");
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return dataUrl;
    ctx.drawImage(img, 0, 0);
    return canvas.toDataURL("image/jpeg", STORAGE_JPEG_QUALITY);
  } catch {
    return dataUrl;
  }
}

async function compressSlidesForStorage(slides: Slide[]): Promise<Slide[]> {
  return Promise.all(
    slides.map(async (sl) => ({
      ...sl,
      dataUrl: await compressSlideForStorage(sl.dataUrl),
    })),
  );
}

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

    const compressedSlides = await compressSlidesForStorage(s.carousel.slides);

    const draft: Draft = {
      id: currentDraftId ?? crypto.randomUUID(),
      createdAt: Date.now(),
      thumbnailDataUrl: thumb,
      carouselSlides: compressedSlides,
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

/**
 * Save the current carousel + post as a NEW draft entry (independent of the
 * autosave's running draft). Used for explicit "Save as new" snapshots.
 * Returns the id of the new draft, or null if nothing was saved.
 */
export async function saveDraftSnapshot(
  store: Store<AppState>,
): Promise<string | null> {
  const s = store.getState();
  if (s.carousel.slides.length === 0) return null;

  let thumb = s.carousel.slides[0].dataUrl;
  try {
    const firstImg = new Image();
    await new Promise<void>((res, rej) => {
      firstImg.onload = () => res();
      firstImg.onerror = () => rej(new Error("img load failed"));
      firstImg.src = s.carousel.slides[0].dataUrl;
    });
    thumb = resizeElementToThumb(firstImg, 80);
  } catch {
    /* fall back to full data URL */
  }

  const compressedSlides = await compressSlidesForStorage(s.carousel.slides);

  const draft: Draft = {
    id: crypto.randomUUID(),
    createdAt: Date.now(),
    thumbnailDataUrl: thumb,
    carouselSlides: compressedSlides,
    carouselCuts: s.carousel.cuts,
    post: s.post,
  };

  store.update((st) => {
    const next = [...st.drafts, draft].slice(-5);
    return { ...st, drafts: next };
  });

  return draft.id;
}
