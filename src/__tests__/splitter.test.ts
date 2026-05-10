import { describe, it, expect, beforeAll, vi } from "vitest";
import { splitImage } from "../splitter";

// jsdom does not implement canvas; mock toDataURL deterministically
beforeAll(() => {
  HTMLCanvasElement.prototype.getContext = vi.fn(() => ({
    drawImage: vi.fn(),
  })) as unknown as HTMLCanvasElement["getContext"];
  HTMLCanvasElement.prototype.toDataURL = vi.fn(
    function (this: HTMLCanvasElement) {
      return `data:image/png;base64,W=${this.width},H=${this.height}`;
    },
  );
});

function mkImage(w: number, h: number): HTMLImageElement {
  const img = new Image();
  Object.defineProperty(img, "naturalWidth", { value: w });
  Object.defineProperty(img, "naturalHeight", { value: h });
  return img;
}

describe("splitImage", () => {
  it("creates 4 slides from cuts at 1080, 2160, 3240", () => {
    const img = mkImage(4320, 1350);
    const slides = splitImage(img, [1080, 2160, 3240]);
    expect(slides).toHaveLength(4);
    expect(slides[0].w).toBe(1080);
    expect(slides[0].h).toBe(1350);
    expect(slides[3].w).toBe(1080);
    expect(slides[0].dataUrl).toContain("W=1080,H=1350");
  });

  it("creates 1 slide when cuts is empty", () => {
    const img = mkImage(1080, 1350);
    const slides = splitImage(img, []);
    expect(slides).toHaveLength(1);
    expect(slides[0].w).toBe(1080);
  });

  it("handles non-uniform cuts", () => {
    const img = mkImage(3000, 1000);
    const slides = splitImage(img, [800, 1900]);
    expect(slides.map((s) => s.w)).toEqual([800, 1100, 1100]);
  });

  it("clamps cuts to image bounds", () => {
    const img = mkImage(2000, 1000);
    const slides = splitImage(img, [1500, 9999]);
    expect(slides).toHaveLength(3);
    expect(slides[0].w).toBe(1500);
    expect(slides[1].w).toBe(500);
    expect(slides[2].w).toBe(0);
  });
});
