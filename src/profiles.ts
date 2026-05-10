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
  let editingId: string | null = null;

  const bg = document.createElement("div");
  bg.className = "profile-modal-bg";
  bg.innerHTML = `
    <div class="profile-modal">
      <h3 data-r="title">Perfis salvos (até 5)</h3>
      <div class="list"></div>
      <div class="form-section">
        <div class="section-label" data-r="section-label">Adicionar perfil</div>
        <div class="avatar-row">
          <img class="avatar-preview" data-r="avatar-preview" alt="" />
          <label class="file-pick">
            <input type="file" accept="image/*" data-r="avatar" />
            <span data-r="file-label">Escolher logo</span>
          </label>
        </div>
        <input type="text" placeholder="@usuario" data-r="user" autocomplete="off" />
        <label class="check"><input type="checkbox" data-r="verif" /> Selo verificado</label>
      </div>
      <div class="actions">
        <button data-r="reset" style="display:none">Cancelar edição</button>
        <button data-r="cancel">Fechar</button>
        <button class="primary" data-r="save">Adicionar</button>
      </div>
    </div>
  `;
  document.body.appendChild(bg);

  const list = bg.querySelector(".list")!;
  const titleEl = bg.querySelector('[data-r="title"]') as HTMLElement;
  const sectionLabelEl = bg.querySelector('[data-r="section-label"]') as HTMLElement;
  const avatarPreviewEl = bg.querySelector('[data-r="avatar-preview"]') as HTMLImageElement;
  const fileInput = bg.querySelector('[data-r="avatar"]') as HTMLInputElement;
  const fileLabel = bg.querySelector('[data-r="file-label"]') as HTMLElement;
  const userInput = bg.querySelector('[data-r="user"]') as HTMLInputElement;
  const verifInput = bg.querySelector('[data-r="verif"]') as HTMLInputElement;
  const saveBtn = bg.querySelector('[data-r="save"]') as HTMLButtonElement;
  const resetBtn = bg.querySelector('[data-r="reset"]') as HTMLButtonElement;

  function enterEditMode(profile: Profile) {
    editingId = profile.id;
    titleEl.textContent = `Editar @${profile.username}`;
    sectionLabelEl.textContent = "Editando perfil";
    userInput.value = profile.username;
    verifInput.checked = profile.verified;
    avatarPreviewEl.src = profile.avatarDataUrl;
    avatarPreviewEl.style.display = "block";
    fileInput.value = "";
    fileLabel.textContent = "Trocar logo (opcional)";
    saveBtn.textContent = "Salvar";
    resetBtn.style.display = "";
    drawList();
  }

  function exitEditMode() {
    editingId = null;
    titleEl.textContent = "Perfis salvos (até 5)";
    sectionLabelEl.textContent = "Adicionar perfil";
    userInput.value = "";
    verifInput.checked = false;
    fileInput.value = "";
    avatarPreviewEl.src = "";
    avatarPreviewEl.style.display = "none";
    fileLabel.textContent = "Escolher logo";
    saveBtn.textContent = "Adicionar";
    resetBtn.style.display = "none";
    drawList();
  }

  // When user picks a new file, show its preview
  fileInput.addEventListener("change", () => {
    const file = fileInput.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      avatarPreviewEl.src = reader.result as string;
      avatarPreviewEl.style.display = "block";
    };
    reader.readAsDataURL(file);
    fileLabel.textContent = file.name.length > 22 ? file.name.slice(0, 20) + "…" : file.name;
  });

  function drawList() {
    const s = store.getState();
    list.innerHTML = "";
    if (s.profiles.length === 0) {
      list.innerHTML = `<div class="empty">Nenhum perfil ainda. Adicione abaixo.</div>`;
      return;
    }
    s.profiles.forEach((p) => {
      const item = document.createElement("div");
      const isEditing = p.id === editingId;
      item.className =
        "item" +
        (p.id === s.activeProfileId ? " active" : "") +
        (isEditing ? " editing" : "");
      item.innerHTML = `
        <img src="${p.avatarDataUrl}" alt="" />
        <div class="meta">@${p.username}${p.verified ? " ✓" : ""}</div>
        <button class="edit" data-id="${p.id}" title="Editar" type="button">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
            <path d="M9 2.5l2.5 2.5L4.5 12 2 12.5 2.5 10z" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
        <button class="del" data-id="${p.id}" title="Remover" type="button">×</button>
      `;
      item.addEventListener("click", (e) => {
        if ((e.target as HTMLElement).closest("button")) return;
        store.update((st) => ({ ...st, activeProfileId: p.id }));
        drawList();
      });
      item.querySelector(".edit")!.addEventListener("click", (e) => {
        e.stopPropagation();
        enterEditMode(p);
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
        if (editingId === p.id) exitEditMode();
        else drawList();
      });
      list.appendChild(item);
    });
  }

  drawList();

  bg.querySelector('[data-r="cancel"]')!.addEventListener("click", () => bg.remove());
  resetBtn.addEventListener("click", () => exitEditMode());
  bg.addEventListener("click", (e) => {
    if (e.target === bg) bg.remove();
  });

  saveBtn.addEventListener("click", async () => {
    const username = sanitizeUsername(userInput.value);
    if (!username) {
      alert("Digite o @ do perfil.");
      return;
    }

    if (editingId) {
      // Edit existing — avatar only changes if a new file was picked
      const newAvatarUrl = fileInput.files?.[0]
        ? await resizeImageFile(fileInput.files[0], 200)
        : null;
      const target = editingId;
      store.update((st) => ({
        ...st,
        profiles: st.profiles.map((p) =>
          p.id === target
            ? {
                ...p,
                username,
                verified: verifInput.checked,
                avatarDataUrl: newAvatarUrl ?? p.avatarDataUrl,
              }
            : p,
        ),
      }));
      exitEditMode();
    } else {
      // Create — file is required
      if (!fileInput.files?.[0]) {
        alert("Selecione uma logo.");
        return;
      }
      const dataUrl = await resizeImageFile(fileInput.files[0], 200);
      const profile: Profile = {
        id: crypto.randomUUID(),
        avatarDataUrl: dataUrl,
        username,
        verified: verifInput.checked,
      };
      store.update((st) => {
        const next = [...st.profiles, profile].slice(-5);
        return { ...st, profiles: next, activeProfileId: profile.id };
      });
      bg.remove();
    }
  });
}
