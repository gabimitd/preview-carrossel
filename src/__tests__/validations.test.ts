import { describe, it, expect } from "vitest";
import { sanitizeUsername, clamp, formatTimeAgoOrPassthrough } from "../validations";

describe("sanitizeUsername", () => {
  it("strips leading @", () => {
    expect(sanitizeUsername("@donamaromba")).toBe("donamaromba");
  });
  it("trims whitespace", () => {
    expect(sanitizeUsername("  user  ")).toBe("user");
  });
  it("truncates to 30 chars", () => {
    expect(sanitizeUsername("a".repeat(40))).toBe("a".repeat(30));
  });
  it("removes spaces inside", () => {
    expect(sanitizeUsername("don na maromba")).toBe("donnamaromba");
  });
});

describe("clamp", () => {
  it("limits string length", () => {
    expect(clamp("hello world", 5)).toBe("hello");
  });
  it("returns the original if under limit", () => {
    expect(clamp("hi", 5)).toBe("hi");
  });
});

describe("formatTimeAgoOrPassthrough", () => {
  it("returns trimmed user input when not empty", () => {
    expect(formatTimeAgoOrPassthrough("  Há 2 horas ")).toBe("Há 2 horas");
  });
  it("returns 'Agora' for empty input", () => {
    expect(formatTimeAgoOrPassthrough("")).toBe("Agora");
  });
});
