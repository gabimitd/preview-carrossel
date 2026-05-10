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
      container.innerHTML = "";
      return;
    }
    container.innerHTML = `
      <div style="display:flex;gap:5px;align-items:center;flex-wrap:wrap">
        <span style="color:var(--muted); font-size:10.5px;text-transform:uppercase;letter-spacing:0.05em;font-weight:600">Rascunhos</span>
        ${s.drafts
          .slice()
          .sort((a, b) => b.createdAt - a.createdAt)
          .map(
            (d) => `
            <span style="position:relative;display:inline-block">
              <button data-id="${d.id}" data-action="restore"
                style="padding:0;border:1px solid var(--border);background:transparent;border-radius:4px;cursor:pointer;display:block;line-height:0">
                <img src="${d.thumbnailDataUrl}" alt="" style="height:24px;display:block;border-radius:3px" />
              </button>
              <button data-id="${d.id}" data-action="delete"
                style="position:absolute;top:-5px;right:-5px;width:13px;height:13px;border-radius:50%;border:none;background:#ef4444;color:#fff;cursor:pointer;font-size:9px;line-height:1;padding:0">×</button>
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
