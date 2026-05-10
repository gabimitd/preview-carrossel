import { describe, it, expect, vi } from "vitest";
import { createStore } from "../state";

describe("createStore", () => {
  it("returns the initial state via getState", () => {
    const store = createStore({ count: 0 });
    expect(store.getState()).toEqual({ count: 0 });
  });

  it("setState replaces state and notifies subscribers", () => {
    const store = createStore({ count: 0 });
    const sub = vi.fn();
    store.subscribe(sub);

    store.setState({ count: 1 });

    expect(store.getState()).toEqual({ count: 1 });
    expect(sub).toHaveBeenCalledWith({ count: 1 }, { count: 0 });
  });

  it("update applies a function to the state", () => {
    const store = createStore({ count: 0 });
    store.update((s) => ({ count: s.count + 5 }));
    expect(store.getState()).toEqual({ count: 5 });
  });

  it("subscribe returns an unsubscribe that stops notifications", () => {
    const store = createStore({ count: 0 });
    const sub = vi.fn();
    const off = store.subscribe(sub);

    store.setState({ count: 1 });
    off();
    store.setState({ count: 2 });

    expect(sub).toHaveBeenCalledTimes(1);
  });

  it("does not notify when state is identical (===) after update", () => {
    const store = createStore({ count: 0 });
    const sub = vi.fn();
    store.subscribe(sub);
    store.update((s) => s);
    expect(sub).not.toHaveBeenCalled();
  });
});
