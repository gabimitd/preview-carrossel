import type { Slide } from "./types";

/**
 * Split an image into slides using a sorted array of cut x-positions.
 * Returns Slide[] with width/height derived from the cuts.
 */
export function splitImage(image: HTMLImageElement, cuts: number[]): Slide[] {
  const w = image.naturalWidth;
  const h = image.naturalHeight;
  const sorted = [...cuts].sort((a, b) => a - b);
  const boundaries = [0, ...sorted.map((c) => Math.max(0, Math.min(c, w))), w];
  const slides: Slide[] = [];

  for (let i = 0; i < boundaries.length - 1; i++) {
    const x = boundaries[i];
    const sw = boundaries[i + 1] - x;
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(0, sw);
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (ctx && sw > 0) ctx.drawImage(image, x, 0, sw, h, 0, 0, sw, h);
    slides.push({ dataUrl: canvas.toDataURL("image/png"), w: sw, h });
  }
  return slides;
}
