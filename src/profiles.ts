import "./profiles.css";
import type { Store } from "./state";
import type { AppState, Profile } from "./types";
import { sanitizeUsername } from "./validations";
import { resizeImageFile } from "./resize-image";

export function mountProfilePill(
  container: HTMLElement,
  store: Store<AppState>,
): () => void {
  function render() {
    const s = store.getState();
    const p = s.profiles.find((x) => x.id === s.activeProfileId);
    container.innerHTML = `
      <button class="profile-pill" type="button">
        ${p ? `<img src="${p.avatarDataUrl}" alt=""/> @${p.username}` : "+ Adicionar perfil"}
      </button>
    `;
    container
      .querySelector("button")!
      .addEventListener("click", () => openModal(store));
  }

  render();
  return store.subscribe((next, prev) => {
    if (next.profiles !== prev.profiles || next.activeProfileId !== prev.activeProfileId)
      render();
  });
}

function openModal(store: Store<AppState>): void {
  const bg = document.createElement("div");
  bg.className = "profile-modal-bg";
  bg.innerHTML = `
    <div class="profile-modal">
      <h3>Perfis salvos (até 5)</h3>
      <div class="list"></div>
      <div class="new">
        <input type="file" accept="image/*" data-r="avatar" />
        <input type="text" placeholder="@ do perfil" data-r="user" />
        <label class="check"><input type="checkbox" data-r="verif" /> Selo verificado</label>
      </div>
      <div class="actions">
        <button data-r="cancel">Cancelar</button>
        <button class="primary" data-r="save">Adicionar</button>
      </div>
    </div>
  `;
  document.body.appendChild(bg);

  const list = bg.querySelector(".list")!;
  function drawList() {
    const s = store.getState();
    list.innerHTML = "";
    s.profiles.forEach((p) => {
      const item = document.createElement("div");
      item.className = "item" + (p.id === s.activeProfileId ? " active" : "");
      item.innerHTML = `
        <img src="${p.avatarDataUrl}" alt="" />
        <div>@${p.username}${p.verified ? " ✓" : ""}</div>
        <button class="del" data-id="${p.id}">remover</button>
      `;
      item.addEventListener("click", (e) => {
        if ((e.target as HTMLElement).tagName === "BUTTON") return;
        store.update((st) => ({ ...st, activeProfileId: p.id }));
        drawList();
      });
      item.querySelector(".del")!.addEventListener("click", (e) => {
        e.stopPropagation();
        store.update((st) => {
          const remaining = st.profiles.filter((x) => x.id !== p.id);
          return {
            ...st,
            profiles: remaining,
            activeProfileId:
              st.activeProfileId === p.id
                ? (remaining[0]?.id ?? null)
                : st.activeProfileId,
          };
        });
        drawList();
      });
      list.appendChild(item);
    });
  }
  drawList();

  bg.querySelector('[data-r="cancel"]')!.addEventListener("click", () => bg.remove());
  bg.addEventListener("click", (e) => {
    if (e.target === bg) bg.remove();
  });
  bg.querySelector('[data-r="save"]')!.addEventListener("click", async () => {
    const fileInput = bg.querySelector('[data-r="avatar"]') as HTMLInputElement;
    const userInput = bg.querySelector('[data-r="user"]') as HTMLInputElement;
    const verifInput = bg.querySelector('[data-r="verif"]') as HTMLInputElement;
    if (!fileInput.files?.[0] || !userInput.value.trim()) {
      alert("Selecione uma logo e digite o @.");
      return;
    }
    const dataUrl = await resizeImageFile(fileInput.files[0], 200);
    const profile: Profile = {
      id: crypto.randomUUID(),
      avatarDataUrl: dataUrl,
      username: sanitizeUsername(userInput.value),
      verified: verifInput.checked,
    };
    store.update((st) => {
      const next = [...st.profiles, profile].slice(-5); // keep last 5
      return { ...st, profiles: next, activeProfileId: profile.id };
    });
    bg.remove();
  });
}
