import "./profile-menu.css";
import type { Store } from "./state";
import type { AppState, Draft } from "./types";
import { openProfileModal } from "./profiles";
import { restoreDraft, deleteDraft, saveDraftSnapshot } from "./drafts";

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

          <div class="menu-label">Recentes</div>
          ${
            s.carousel.slides.length > 0
              ? `<button class="menu-item no-indicator menu-save-now" data-action="save-snapshot" type="button">
                   <span class="lead-icon">💾</span>
                   <span>Salvar carrossel atual</span>
                 </button>`
              : ""
          }
          ${renderRecents(s.drafts)}

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
    // Restore draft on click (but not when click hits the delete button)
    container.querySelectorAll<HTMLElement>("[data-draft]").forEach((el) => {
      el.addEventListener("click", (e) => {
        if ((e.target as HTMLElement).closest("[data-del-draft]")) return;
        e.stopPropagation();
        const id = el.dataset.draft!;
        restoreDraft(store, id);
        closeMenu();
      });
    });
    container.querySelectorAll<HTMLElement>("[data-del-draft]").forEach((el) => {
      el.addEventListener("click", (e) => {
        e.stopPropagation();
        const id = el.dataset.delDraft!;
        deleteDraft(store, id);
        // Menu stays open and re-renders via store subscribe
      });
    });
  }

  function handleAction(action: string) {
    if (action === "profiles") {
      closeMenu();
      openProfileModal(store);
      return;
    }
    if (action === "save-snapshot") {
      saveDraftSnapshot(store).then((id) => {
        if (id) flashSaveConfirmation();
      });
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

  function flashSaveConfirmation() {
    // After the store re-renders (draft was added), find the save button
    // and briefly flash a "Salvo!" state on it
    requestAnimationFrame(() => {
      const btn = container.querySelector(".menu-save-now") as HTMLElement | null;
      if (!btn) return;
      btn.innerHTML = `<span class="lead-icon">✓</span><span>Salvo!</span>`;
      btn.classList.add("saved");
      setTimeout(() => {
        btn.classList.remove("saved");
        // Don't restore innerHTML — the store re-render already redrew the menu
      }, 1200);
    });
  }

  render();
  return store.subscribe(render);
}

function renderRecents(drafts: Draft[]): string {
  if (drafts.length === 0) {
    return `<div class="menu-recent-empty">Sem posts salvos ainda</div>`;
  }
  const sorted = [...drafts].sort((a, b) => b.createdAt - a.createdAt);
  return sorted
    .map((d) => {
      const cap = d.post.caption.trim();
      const title = cap
        ? cap.length > 30
          ? escapeHtml(cap.slice(0, 28)) + "…"
          : escapeHtml(cap)
        : `${d.carouselSlides.length} slide${d.carouselSlides.length === 1 ? "" : "s"}`;
      return `
        <div class="menu-draft" data-draft="${d.id}" role="menuitem" tabindex="0">
          <img src="${d.thumbnailDataUrl}" alt="" />
          <div class="label">
            <div class="title">${title}</div>
            <div class="time">${formatRelativeTime(d.createdAt)} · ${d.carouselSlides.length} slides</div>
          </div>
          <button class="del-draft" data-del-draft="${d.id}" title="Excluir rascunho" type="button" aria-label="Excluir rascunho">×</button>
        </div>
      `;
    })
    .join("");
}

function formatRelativeTime(ts: number): string {
  const diff = Date.now() - ts;
  if (diff < 60_000) return "agora";
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 60) return `há ${minutes}min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `há ${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `há ${days}d`;
  return new Date(ts).toLocaleDateString("pt-BR");
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
