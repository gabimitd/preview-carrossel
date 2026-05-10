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

interface FormatSpec {
  format: Format;
  standardHeight: number;
  ratio: number; // width / height of a single slide
}

const FORMATS: FormatSpec[] = [
  { format: "1:1", standardHeight: 1080, ratio: 1 / 1 },
  { format: "4:5", standardHeight: 1350, ratio: 4 / 5 },
  { format: "9:16", standardHeight: 1920, ratio: 9 / 16 },
];

const HEIGHT_TOLERANCE_PX = 50;

/**
 * Detect carousel grid from image dimensions.
 *
 * Strategy: anchor by height first (most reliable signal — common Instagram
 * exports use one of three exact heights). If the height doesn't match any
 * standard within tolerance, fall back to the format with minimum padding,
 * with a tiebreaker preferring more slides.
 */
export function detectGrid(width: number, height: number): DetectResult {
  // Primary: anchor by standard height
  for (const f of FORMATS) {
    if (Math.abs(height - f.standardHeight) <= HEIGHT_TOLERANCE_PX) {
      return buildResult(f, width, height);
    }
  }

  // Fallback: pick the format with minimum padding; tiebreak by more slides
  let best: DetectResult | null = null;
  let bestScore = -Infinity;
  for (const f of FORMATS) {
    const r = buildResult(f, width, height);
    // Score: minimize padding, slight bonus for more slides on ties
    const score = -r.paddingPx + r.nSlides * 0.001;
    if (score > bestScore) {
      bestScore = score;
      best = r;
    }
  }
  return best!;
}

function buildResult(
  spec: FormatSpec,
  width: number,
  height: number,
): DetectResult {
  const slideWidth = Math.max(1, Math.round(height * spec.ratio));
  const nSlides = Math.max(1, Math.round(width / slideWidth));
  const ideal = nSlides * slideWidth;
  const paddingPx = Math.abs(width - ideal);
  const cuts: number[] = [];
  for (let i = 1; i < nSlides; i++) cuts.push(slideWidth * i);
  return {
    format: spec.format,
    slideWidth,
    slideHeight: height,
    nSlides,
    cuts,
    hasPadding: paddingPx > 1,
    paddingPx,
  };
}
