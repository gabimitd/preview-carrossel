import "./profile-menu.css";
import type { Store } from "./state";
import type { AppState } from "./types";
import { openProfileModal } from "./profiles";

/**
 * Unified shadcn-style dropdown menu that consolidates:
 * - Active profile + edit/add profile shortcut
 * - Device (mobile / desktop) radio choice
 * - App + IG theme (claro / escuro) radio choice
 *
 * Single trigger pill in the top-right; clicking opens a popover with
 * grouped sections, labels, separators, and a checkmark on selected radios.
 */
export function mountProfileMenu(
  container: HTMLElement,
  store: Store<AppState>,
): () => void {
  let isOpen = false;

  function render() {
    const s = store.getState();
    const p = s.profiles.find((x) => x.id === s.activeProfileId) ?? null;
    const expanded = isOpen ? "true" : "false";

    container.innerHTML = `
      <div class="menu-wrap">
        <button class="menu-trigger" type="button" aria-haspopup="menu" aria-expanded="${expanded}">
          ${
            p
              ? `<img src="${p.avatarDataUrl}" alt="" /><span>@${escapeHtml(p.username)}</span>`
              : `<span style="padding:3px 6px">+ Adicionar perfil</span>`
          }
          <svg class="chev" width="11" height="11" viewBox="0 0 11 11" fill="none" aria-hidden="true">
            <path d="M3 4.5L5.5 7L8 4.5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>

        <div class="menu-content" role="menu" data-state="${isOpen ? "open" : "closed"}">
          ${
            p
              ? `
              <div class="menu-current">
                <img src="${p.avatarDataUrl}" alt="" />
                <div>
                  <div class="name">@${escapeHtml(p.username)}${
                    p.verified ? '<span style="color:#1d9bf0">✓</span>' : ""
                  }</div>
                  <div class="hint">Perfil ativo</div>
                </div>
              </div>
              <button class="menu-item no-indicator" data-action="profiles" type="button">
                <span class="lead-icon">
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M2 12c0-2.2 2.2-4 5-4s5 1.8 5 4M7 7a2.5 2.5 0 100-5 2.5 2.5 0 000 5z" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                </span>
                Trocar / editar perfil
              </button>
            `
              : `
              <button class="menu-item no-indicator" data-action="profiles" type="button">
                <span class="lead-icon">+</span>
                Adicionar perfil
              </button>
            `
          }

          <div class="menu-separator"></div>

          <div class="menu-label">Modo</div>
          <button class="menu-item" data-action="device-mobile" data-selected="${s.theme.device === "mobile"}" type="button">
            <span class="menu-item-check">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M2.5 6.2l2.3 2.3L9.5 3.6" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </span>
            📱 Mobile
          </button>
          <button class="menu-item" data-action="device-desktop" data-selected="${s.theme.device === "desktop"}" type="button">
            <span class="menu-item-check">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M2.5 6.2l2.3 2.3L9.5 3.6" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </span>
            💻 Desktop
          </button>

          <div class="menu-separator"></div>

          <div class="menu-label">Tema</div>
          <button class="menu-item" data-action="theme-light" data-selected="${s.theme.app === "light"}" type="button">
            <span class="menu-item-check">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M2.5 6.2l2.3 2.3L9.5 3.6" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </span>
            ☀ Claro
          </button>
          <button class="menu-item" data-action="theme-dark" data-selected="${s.theme.app === "dark"}" type="button">
            <span class="menu-item-check">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M2.5 6.2l2.3 2.3L9.5 3.6" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </span>
            🌙 Escuro
          </button>
        </div>
      </div>
    `;
    attachListeners();
  }

  function attachListeners() {
    const trigger = container.querySelector(".menu-trigger") as HTMLButtonElement;
    trigger.addEventListener("click", (e) => {
      e.stopPropagation();
      isOpen ? closeMenu() : openMenu();
    });
    container.querySelectorAll<HTMLElement>("[data-action]").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const action = btn.dataset.action!;
        handleAction(action);
      });
    });
  }

  function handleAction(action: string) {
    if (action === "profiles") {
      closeMenu();
      openProfileModal(store);
      return;
    }
    if (action.startsWith("device-")) {
      const v = action.slice(7) as "mobile" | "desktop";
      store.update((s) => ({ ...s, theme: { ...s.theme, device: v } }));
    } else if (action.startsWith("theme-")) {
      const v = action.slice(6) as "light" | "dark";
      // App theme drives IG frame theme too
      store.update((s) => ({
        ...s,
        theme: { ...s.theme, app: v, igFrame: v },
      }));
    }
    // Keep menu open so user can flip multiple settings; re-render to update checks
  }

  function openMenu() {
    if (isOpen) return;
    isOpen = true;
    const trigger = container.querySelector(".menu-trigger") as HTMLElement;
    const content = container.querySelector(".menu-content") as HTMLElement;
    if (trigger) trigger.setAttribute("aria-expanded", "true");
    if (content) content.dataset.state = "open";
    setTimeout(() => {
      document.addEventListener("click", onOutsideClick);
      document.addEventListener("keydown", onKey);
    }, 0);
  }

  function closeMenu() {
    if (!isOpen) return;
    isOpen = false;
    const trigger = container.querySelector(".menu-trigger") as HTMLElement;
    const content = container.querySelector(".menu-content") as HTMLElement;
    if (trigger) trigger.setAttribute("aria-expanded", "false");
    if (content) content.dataset.state = "closed";
    document.removeEventListener("click", onOutsideClick);
    document.removeEventListener("keydown", onKey);
  }

  function onOutsideClick(e: MouseEvent) {
    if (!container.contains(e.target as Node)) closeMenu();
  }
  function onKey(e: KeyboardEvent) {
    if (e.key === "Escape") closeMenu();
  }

  render();
  return store.subscribe(render);
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
