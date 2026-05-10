export interface Store<T> {
  getState(): T;
  setState(next: T): void;
  update(fn: (current: T) => T): void;
  subscribe(listener: (next: T, prev: T) => void): () => void;
}

export function createStore<T>(initial: T): Store<T> {
  let state = initial;
  const listeners = new Set<(next: T, prev: T) => void>();

  return {
    getState: () => state,
    setState(next: T) {
      if (next === state) return;
      const prev = state;
      state = next;
      for (const l of listeners) l(next, prev);
    },
    update(fn) {
      this.setState(fn(state));
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
}
