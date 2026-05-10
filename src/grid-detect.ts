export type Format = "1:1" | "4:5" | "9:16";

export interface DetectResult {
  format: Format;
  slideWidth: number;
  slideHeight: number;
  nSlides: number;
  cuts: number[]; // x positions of cut lines
  hasPadding: boolean;
  paddingPx: number; // total leftover px
}

const FORMATS: { format: Format; ratio: number }[] = [
  { format: "1:1", ratio: 1 / 1 },
  { format: "4:5", ratio: 4 / 5 },
  { format: "9:16", ratio: 9 / 16 },
];

export function detectGrid(width: number, height: number): DetectResult {
  // Pick the format whose ratio gives slideWidth that best divides width.
  let best: DetectResult | null = null;
  let bestScore = -Infinity;

  for (const { format, ratio } of FORMATS) {
    const slideWidth = Math.round(height * ratio);
    if (slideWidth <= 0) continue;
    const exactN = width / slideWidth;
    const nSlides = Math.max(1, Math.round(exactN));
    const ideal = nSlides * slideWidth;
    const paddingPx = Math.abs(width - ideal);
    const score = -paddingPx; // less padding wins

    if (score > bestScore) {
      bestScore = score;
      const cuts: number[] = [];
      for (let i = 1; i < nSlides; i++) cuts.push(slideWidth * i);
      best = {
        format,
        slideWidth,
        slideHeight: height,
        nSlides,
        cuts,
        hasPadding: paddingPx > 1, // 1px tolerance
        paddingPx,
      };
    }
  }

  return best!;
}
