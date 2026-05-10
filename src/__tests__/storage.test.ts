import { describe, it, expect, beforeEach, vi } from "vitest";
import { saveJSON, loadJSON, trySaveJSONWithFallback } from "../storage";

describe("storage", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("saveJSON stores and loadJSON reads the same value", () => {
    saveJSON("k", { a: 1, b: "x" });
    expect(loadJSON("k", null)).toEqual({ a: 1, b: "x" });
  });

  it("loadJSON returns the fallback when key is missing", () => {
    expect(loadJSON("missing", { default: true })).toEqual({ default: true });
  });

  it("loadJSON returns fallback when stored JSON is corrupt", () => {
    localStorage.setItem("bad", "{not json");
    expect(loadJSON("bad", "fallback")).toBe("fallback");
  });

  it("trySaveJSONWithFallback evicts via the prune callback when quota exceeded", () => {
    let value = { drafts: [{ id: "old" }, { id: "new" }] };
    const setItem = vi.spyOn(Storage.prototype, "setItem");
    setItem.mockImplementationOnce(() => {
      const e = new Error("quota");
      (e as Error & { name: string }).name = "QuotaExceededError";
      throw e;
    });
    // subsequent calls fall through to the real setItem

    const pruneSpy = vi.fn(() => {
      value = { drafts: value.drafts.slice(1) };
      return value;
    });

    const ok = trySaveJSONWithFallback("k", value, pruneSpy);

    expect(ok).toBe(true);
    expect(pruneSpy).toHaveBeenCalledTimes(1);
    expect(setItem).toHaveBeenCalledTimes(2);
    setItem.mockRestore();
  });
});
