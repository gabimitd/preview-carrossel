import type { Store } from "./state";
import type { AppState } from "./types";
import { restoreDraft, deleteDraft } from "./drafts";

export function mountDraftsMenu(
  container: HTMLElement,
  store: Store<AppState>,
): () => void {
  function render() {
    const s = store.getState();
    if (s.drafts.length === 0) {
      container.innerHTML = `<span style="color:var(--muted,#94a3b8); font-size:12px">Sem rascunhos</span>`;
      return;
    }
    container.innerHTML = `
      <div style="display:flex;gap:6px;align-items:center;flex-wrap:wrap">
        <span style="color:var(--muted,#94a3b8); font-size:12px">Rascunhos:</span>
        ${s.drafts
          .slice()
          .sort((a, b) => b.createdAt - a.createdAt)
          .map(
            (d) => `
            <span style="position:relative;display:inline-block">
              <button data-id="${d.id}" data-action="restore"
                style="padding:0;border:1px solid var(--border,#334155);background:transparent;border-radius:4px;cursor:pointer">
                <img src="${d.thumbnailDataUrl}" alt="" style="height:34px;display:block" />
              </button>
              <button data-id="${d.id}" data-action="delete"
                style="position:absolute;top:-6px;right:-6px;width:16px;height:16px;border-radius:50%;border:none;background:#ef4444;color:#fff;cursor:pointer;font-size:10px;line-height:1;padding:0">×</button>
            </span>
          `,
          )
          .join("")}
      </div>
    `;
    container.querySelectorAll<HTMLElement>("[data-action]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = btn.dataset.id!;
        if (btn.dataset.action === "restore") restoreDraft(store, id);
        else if (btn.dataset.action === "delete") deleteDraft(store, id);
      });
    });
  }

  render();
  return store.subscribe((next, prev) => {
    if (next.drafts !== prev.drafts) render();
  });
}
