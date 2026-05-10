import { describe, it, expect } from "vitest";
import { detectGrid } from "../grid-detect";

describe("detectGrid", () => {
  it("detects 4 portrait (4:5) slides at 4320×1350", () => {
    const r = detectGrid(4320, 1350);
    expect(r.format).toBe("4:5");
    expect(r.slideWidth).toBe(1080);
    expect(r.slideHeight).toBe(1350);
    expect(r.nSlides).toBe(4);
    expect(r.hasPadding).toBe(false);
  });

  it("detects 3 square (1:1) slides at 3240×1080", () => {
    const r = detectGrid(3240, 1080);
    expect(r.format).toBe("1:1");
    expect(r.slideWidth).toBe(1080);
    expect(r.nSlides).toBe(3);
    expect(r.hasPadding).toBe(false);
  });

  it("detects 2 story (9:16) slides at 2160×1920", () => {
    const r = detectGrid(2160, 1920);
    expect(r.format).toBe("9:16");
    expect(r.slideWidth).toBe(1080);
    expect(r.nSlides).toBe(2);
  });

  it("flags padding when width is not a multiple of slideWidth", () => {
    const r = detectGrid(4400, 1350);
    expect(r.hasPadding).toBe(true);
    expect(r.nSlides).toBe(4);
    expect(r.paddingPx).toBe(80);
  });

  it("falls back to 1 slide when no format matches", () => {
    const r = detectGrid(500, 500);
    expect(r.nSlides).toBeGreaterThanOrEqual(1);
  });

  it("handles a single 1080×1350 portrait as 1 slide", () => {
    const r = detectGrid(1080, 1350);
    expect(r.format).toBe("4:5");
    expect(r.nSlides).toBe(1);
  });

  it("detects 5 portrait slides at 5400×1350 (was ambiguous with 1:1 before)", () => {
    const r = detectGrid(5400, 1350);
    expect(r.format).toBe("4:5");
    expect(r.slideWidth).toBe(1080);
    expect(r.nSlides).toBe(5);
    expect(r.hasPadding).toBe(false);
    expect(r.cuts).toEqual([1080, 2160, 3240, 4320]);
  });

  it("detects 4 square slides at 4320×1080 (height anchors to 1:1)", () => {
    const r = detectGrid(4320, 1080);
    expect(r.format).toBe("1:1");
    expect(r.slideWidth).toBe(1080);
    expect(r.nSlides).toBe(4);
    expect(r.hasPadding).toBe(false);
  });
});
