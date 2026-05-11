export function saveJSON(key: string, value: unknown): void {
  localStorage.setItem(key, JSON.stringify(value));
}

export function loadJSON<T>(key: string, fallback: T): T {
  const raw = localStorage.getItem(key);
  if (raw === null) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

/**
 * Save with quota fallback. If saveJSON throws QuotaExceededError, calls prune()
 * to get a smaller value, then retries. Up to 3 retries.
 */
export function trySaveJSONWithFallback<T>(
  key: string,
  value: T,
  prune: () => T,
): boolean {
  let current = value;
  for (let attempt = 0; attempt < 10; attempt++) {
    try {
      saveJSON(key, current);
      return true;
    } catch (e: unknown) {
      if (!isQuotaError(e)) throw e;
      current = prune();
    }
  }
  return false;
}

function isQuotaError(e: unknown): boolean {
  if (!(e instanceof Error)) return false;
  return (
    e.name === "QuotaExceededError" ||
    e.name === "NS_ERROR_DOM_QUOTA_REACHED" ||
    /quota/i.test(e.message)
  );
}
