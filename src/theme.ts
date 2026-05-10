import "./theme.css";
import type { Store } from "./state";
import type { AppState } from "./types";

/** Apply the app theme as a body attribute (drives CSS variables). */
export function applyAppTheme(theme: AppState["theme"]): void {
  document.body.setAttribute("data-app-theme", theme.app);
}

export function mountThemeToggles(
  container: HTMLElement,
  store: Store<AppState>,
  parts: { app?: boolean; igFrame?: boolean; device?: boolean } = {
    app: true,
    igFrame: true,
    device: true,
  },
): () => void {
  function render() {
    const t = store.getState().theme;
    container.innerHTML = `
      <div class="theme-toggles">
        ${
          parts.device
            ? `<div class="seg" data-seg="device">
                 <button data-v="mobile" class="${t.device === "mobile" ? "active" : ""}">📱</button>
                 <button data-v="desktop" class="${t.device === "desktop" ? "active" : ""}">💻</button>
               </div>`
            : ""
        }
        ${
          parts.igFrame
            ? `<div class="seg" data-seg="igFrame">
                 <button data-v="light" class="${t.igFrame === "light" ? "active" : ""}">☀ IG</button>
                 <button data-v="dark" class="${t.igFrame === "dark" ? "active" : ""}">🌙 IG</button>
               </div>`
            : ""
        }
        ${
          parts.app
            ? `<div class="seg" data-seg="app">
                 <button data-v="light" class="${t.app === "light" ? "active" : ""}">☀ App</button>
                 <button data-v="dark" class="${t.app === "dark" ? "active" : ""}">🌙 App</button>
               </div>`
            : ""
        }
      </div>
    `;
    container.querySelectorAll<HTMLButtonElement>("button[data-v]").forEach((b) => {
      b.addEventListener("click", () => {
        const seg = (b.parentElement as HTMLElement).dataset.seg as
          | "app"
          | "igFrame"
          | "device";
        const v = b.dataset.v as string;
        store.update((s) => ({ ...s, theme: { ...s.theme, [seg]: v } }));
      });
    });
  }

  render();
  applyAppTheme(store.getState().theme);
  return store.subscribe((next, prev) => {
    if (next.theme !== prev.theme) {
      render();
      applyAppTheme(next.theme);
    }
  });
}
