import "./dropdown.css";

export interface DropdownOption {
  value: string;
  label: string;
}

export interface DropdownConfig {
  options: DropdownOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export interface DropdownInstance {
  update: (next: Partial<DropdownConfig>) => void;
  destroy: () => void;
}

/**
 * Vanilla TS dropdown with shadcn/Radix-style aesthetics:
 * fade+zoom popover, checkmark on selected item, click-outside to close,
 * Esc to close, focus ring on trigger.
 */
export function mountDropdown(
  container: HTMLElement,
  initial: DropdownConfig,
): DropdownInstance {
  let { options, value, placeholder = "Selecione" } = initial;
  let onChange = initial.onChange;
  let isOpen = false;

  container.classList.add("dd");
  container.innerHTML = `
    <button type="button" class="dd-trigger" aria-haspopup="listbox" aria-expanded="false">
      <span class="dd-value"></span>
      <svg class="dd-chevron" width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
        <path d="M3.5 5.25L7 8.75L10.5 5.25" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </button>
    <div class="dd-menu" role="listbox" data-state="closed"></div>
  `;

  const trigger = container.querySelector(".dd-trigger") as HTMLButtonElement;
  const valueEl = container.querySelector(".dd-value") as HTMLSpanElement;
  const menu = container.querySelector(".dd-menu") as HTMLDivElement;

  function renderValue() {
    const sel = options.find((o) => o.value === value);
    if (sel) {
      valueEl.textContent = sel.label;
      valueEl.classList.remove("placeholder");
    } else {
      valueEl.textContent = placeholder;
      valueEl.classList.add("placeholder");
    }
  }

  function renderMenu() {
    menu.innerHTML = options
      .map(
        (o) => `
        <button type="button" class="dd-item" role="option" data-value="${escapeAttr(o.value)}" ${o.value === value ? 'data-selected="true"' : ""}>
          <span class="dd-item-check" aria-hidden="true">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M3 7.2L5.5 9.7L11 4.3" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </span>
          <span>${escapeHtml(o.label)}</span>
        </button>
      `,
      )
      .join("");
    menu.querySelectorAll<HTMLButtonElement>(".dd-item").forEach((item) => {
      item.addEventListener("click", () => {
        const v = item.dataset.value!;
        if (v !== value) {
          value = v;
          onChange(v);
          renderValue();
          renderMenu();
        }
        close();
      });
    });
  }

  function open() {
    if (isOpen) return;
    isOpen = true;
    menu.dataset.state = "open";
    trigger.setAttribute("aria-expanded", "true");
    // Defer to next tick so the click that opened doesn't immediately close
    setTimeout(() => {
      document.addEventListener("click", onOutsideClick);
      document.addEventListener("keydown", onKey);
    }, 0);
  }

  function close() {
    if (!isOpen) return;
    isOpen = false;
    menu.dataset.state = "closed";
    trigger.setAttribute("aria-expanded", "false");
    document.removeEventListener("click", onOutsideClick);
    document.removeEventListener("keydown", onKey);
  }

  function onOutsideClick(e: MouseEvent) {
    if (!container.contains(e.target as Node)) close();
  }

  function onKey(e: KeyboardEvent) {
    if (e.key === "Escape") {
      close();
      trigger.focus();
    }
  }

  trigger.addEventListener("click", (e) => {
    e.stopPropagation();
    if (isOpen) close();
    else open();
  });

  renderValue();
  renderMenu();

  return {
    update(next) {
      if (next.options) options = next.options;
      if (next.value !== undefined) value = next.value;
      if (next.onChange) onChange = next.onChange;
      if (next.placeholder !== undefined) placeholder = next.placeholder;
      renderValue();
      renderMenu();
    },
    destroy() {
      close();
      container.classList.remove("dd");
      container.innerHTML = "";
    },
  };
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function escapeAttr(s: string): string {
  return escapeHtml(s);
}
