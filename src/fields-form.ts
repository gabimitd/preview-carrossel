import "./fields-form.css";
import type { Store } from "./state";
import type { AppState, VisibleComment } from "./types";
import { clamp, formatTimeAgoOrPassthrough } from "./validations";
import { mountDropdown, type DropdownInstance } from "./dropdown";

export function mountFieldsForm(
  container: HTMLElement,
  store: Store<AppState>,
): () => void {
  container.innerHTML = `
    <div class="fields">
      <div class="group">
        <h3>Slide ativo</h3>
        <div data-mount="slide-dropdown"></div>
      </div>
      <div class="group">
        <h3>Caption</h3>
        <textarea data-bind="caption" rows="3" placeholder="Treino de glúteos completo 🍑 salva pra não esquecer #treino #glúteos"></textarea>
      </div>
      <div class="group">
        <h3>Engajamento</h3>
        <div class="row">
          <input data-bind="likes" placeholder="1.234" />
          <input data-bind="commentsCount" placeholder="89" />
        </div>
        <input data-bind="timeAgo" placeholder="Há 2 horas" />
      </div>
      <div class="group">
        <h3>Comentários visíveis (até 3)</h3>
        <div class="comment-row">
          <input class="user" data-bind="cuser0" placeholder="aluna_fit" />
          <input class="text" data-bind="ctext0" placeholder="amei! 😍" />
        </div>
        <div class="comment-row">
          <input class="user" data-bind="cuser1" placeholder="maromba_pro" />
          <input class="text" data-bind="ctext1" placeholder="top demais" />
        </div>
        <div class="comment-row">
          <input class="user" data-bind="cuser2" placeholder="@user" />
          <input class="text" data-bind="ctext2" placeholder="comentário" />
        </div>
      </div>
      <div class="group">
        <h3>Extras</h3>
        <label class="check"><input type="checkbox" data-bind="sponsored" /> Patrocinado</label>
        <input data-bind="location" placeholder="São Paulo, SP" />
      </div>
    </div>
  `;

  // Mount the slide-picker dropdown
  const slideDropdownEl = container.querySelector(
    '[data-mount="slide-dropdown"]',
  ) as HTMLElement;

  function buildSlideOptions(state: AppState) {
    const total = state.carousel.slides.length;
    if (total === 0) return [{ value: "0", label: "Sem slides" }];
    return state.carousel.slides.map((_, i) => ({
      value: String(i),
      label: `Slide ${i + 1} de ${total}`,
    }));
  }

  const slideDropdown: DropdownInstance = mountDropdown(slideDropdownEl, {
    options: buildSlideOptions(store.getState()),
    value: String(store.getState().carousel.activeSlide),
    onChange: (v) => {
      store.update((s) => ({
        ...s,
        carousel: { ...s.carousel, activeSlide: Number(v) },
      }));
    },
  });

  function syncFromState() {
    const s = store.getState();
    const get = (sel: string) =>
      container.querySelector<HTMLInputElement>(`[data-bind="${sel}"]`)!;

    slideDropdown.update({
      options: buildSlideOptions(s),
      value: String(s.carousel.activeSlide),
    });

    get("caption").value = s.post.caption;
    get("likes").value = s.post.likes;
    get("commentsCount").value = s.post.commentsCount;
    get("timeAgo").value = s.post.timeAgo;
    get("location").value = s.post.location;
    get("sponsored").checked = s.post.sponsored;
    for (let i = 0; i < 3; i++) {
      const c: VisibleComment | undefined = s.post.visibleComments[i];
      get(`cuser${i}`).value = c?.user ?? "";
      get(`ctext${i}`).value = c?.text ?? "";
    }
  }

  function patchPost(patch: Partial<AppState["post"]>) {
    store.update((s) => ({ ...s, post: { ...s.post, ...patch } }));
  }

  function readVisibleComments(): VisibleComment[] {
    const out: VisibleComment[] = [];
    for (let i = 0; i < 3; i++) {
      const u = (
        container.querySelector(`[data-bind="cuser${i}"]`) as HTMLInputElement
      ).value;
      const t = (
        container.querySelector(`[data-bind="ctext${i}"]`) as HTMLInputElement
      ).value;
      if (u || t) out.push({ user: clamp(u, 30), text: clamp(t, 200) });
    }
    return out;
  }

  function onInput(e: Event) {
    const el = e.target as HTMLInputElement;
    const key = el.dataset.bind;
    if (!key) return;
    if (key === "caption") {
      patchPost({ caption: el.value });
    } else if (key === "likes") {
      patchPost({ likes: clamp(el.value, 20) });
    } else if (key === "commentsCount") {
      patchPost({ commentsCount: clamp(el.value, 20) });
    } else if (key === "timeAgo") {
      patchPost({ timeAgo: formatTimeAgoOrPassthrough(el.value) });
    } else if (key === "location") {
      patchPost({ location: clamp(el.value, 60) });
    } else if (key === "sponsored") {
      patchPost({ sponsored: el.checked });
    } else if (/^c(user|text)\d$/.test(key)) {
      patchPost({ visibleComments: readVisibleComments() });
    }
  }

  container.addEventListener("input", onInput);
  container.addEventListener("change", onInput);

  const off = store.subscribe((next, prev) => {
    if (next.post !== prev.post || next.carousel !== prev.carousel) syncFromState();
  });
  syncFromState();

  return () => {
    container.removeEventListener("input", onInput);
    container.removeEventListener("change", onInput);
    off();
    slideDropdown.destroy();
  };
}
