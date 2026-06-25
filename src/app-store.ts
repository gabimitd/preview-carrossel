import { createStore, type Store } from "./state";
import { loadJSON, trySaveJSONWithFallback } from "./storage";
import {
  type AppState,
  type Draft,
  type Profile,
  type ThemeState,
  EMPTY_POST,
  EMPTY_CAROUSEL,
  DEFAULT_THEME,
} from "./types";

const KEY_PROFILES = "pc.profiles";
const KEY_ACTIVE_PROFILE = "pc.activeProfileId";
const KEY_THEME = "pc.theme";
const KEY_DRAFTS = "pc.drafts";

export function loadInitialState(): AppState {
  const theme = loadJSON<ThemeState>(KEY_THEME, DEFAULT_THEME);
  // app and IG frame themes stay in sync; user only toggles the app one
  theme.igFrame = theme.app;
  return {
    profiles: loadJSON<Profile[]>(KEY_PROFILES, []),
    activeProfileId: loadJSON<string | null>(KEY_ACTIVE_PROFILE, null),
    theme,
    drafts: loadJSON<Draft[]>(KEY_DRAFTS, []),
    carousel: { ...EMPTY_CAROUSEL }, // never persisted as-is
    post: { ...EMPTY_POST },
  };
}

export function persist(state: AppState): void {
  trySaveJSONWithFallback(KEY_PROFILES, state.profiles, () => state.profiles);
  trySaveJSONWithFallback(
    KEY_ACTIVE_PROFILE,
    state.activeProfileId,
    () => state.activeProfileId,
  );
  trySaveJSONWithFallback(KEY_THEME, state.theme, () => state.theme);
  let drafts = state.drafts;
  trySaveJSONWithFallback(KEY_DRAFTS, drafts, () => {
    drafts = drafts.slice(1); // drop oldest
    return drafts;
  });
}

export function createAppStore(): Store<AppState> {
  const store = createStore<AppState>(loadInitialState());
  store.subscribe((next, prev) => {
    if (
      next.profiles !== prev.profiles ||
      next.activeProfileId !== prev.activeProfileId ||
      next.theme !== prev.theme ||
      next.drafts !== prev.drafts
    ) {
      persist(next);
    }
  });
  return store;
}
