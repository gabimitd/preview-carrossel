import "./grid-editor.css";

export interface GridEditorOptions {
  imageDataUrl: string;
  imageWidth: number;
  imageHeight: number;
  cuts: number[];
  onChange: (newCuts: number[]) => void;
  onCountChange: (delta: 1 | -1) => void;
}

export interface GridEditorInstance {
  setCuts: (newCuts: number[]) => void;
  destroy: () => void;
}

export function mountGridEditor(
  container: HTMLElement,
  opts: GridEditorOptions,
): GridEditorInstance {
  container.innerHTML = "";
  const strip = document.createElement("div");
  strip.className = "grid-strip";
  strip.style.backgroundImage = `url(${opts.imageDataUrl})`;
  // Preserve image aspect ratio so cuts (positioned in % of strip width)
  // align exactly with visual slide boundaries.
  strip.style.aspectRatio = `${opts.imageWidth} / ${opts.imageHeight}`;
  container.appendChild(strip);

  const actions = document.createElement("div");
  actions.className = "grid-actions";
  const minus = document.createElement("button");
  minus.textContent = "− slide";
  const plus = document.createElement("button");
  plus.textContent = "+ slide";
  actions.append(minus, plus);
  container.appendChild(actions);

  let cuts = [...opts.cuts];

  function applyVisualPositions() {
    strip.querySelectorAll<HTMLElement>(".cut").forEach((cn, i) => {
      const c = cuts[i];
      if (c === undefined) return;
      cn.style.left = `${(c / opts.imageWidth) * 100}%`;
    });
  }

  function rebuildCuts() {
    strip.querySelectorAll(".cut").forEach((n) => n.remove());
    cuts.forEach((c, i) => {
      const node = document.createElement("div");
      node.className = "cut";
      node.dataset.idx = String(i);
      node.style.left = `${(c / opts.imageWidth) * 100}%`;
      strip.appendChild(node);
      attachDrag(node, i);
    });
  }

  function attachDrag(_node: HTMLElement, idx: number) {
    _node.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      e.stopPropagation();
      const stripW = strip.clientWidth || 1;
      const startX = e.clientX;
      const startCut = cuts[idx];
      const N = cuts.length + 1; // total slides
      // Bounds for the dragged cut so all cuts stay inside (0, imageWidth)
      // After drag: W = newC / (idx+1); last cut = (N-1)*W = (N-1)/(idx+1) * newC
      // Require last cut < imageWidth → newC < (idx+1)/(N-1) * imageWidth
      const minC = idx + 1; // W >= 1
      const maxC =
        N > 1 ? ((idx + 1) * (opts.imageWidth - 1)) / (N - 1) : opts.imageWidth - 1;

      const onMove = (ev: PointerEvent) => {
        const dxPx = ev.clientX - startX;
        const dxImg = (dxPx / stripW) * opts.imageWidth;
        const newC = Math.max(minC, Math.min(maxC, startCut + dxImg));

        // Uniform mode: derive slide width W from the dragged cut, redistribute all
        const W = newC / (idx + 1);
        for (let i = 0; i < cuts.length; i++) {
          cuts[i] = (i + 1) * W;
        }
        applyVisualPositions();
        opts.onChange([...cuts]);
      };

      const onUp = () => {
        document.removeEventListener("pointermove", onMove);
        document.removeEventListener("pointerup", onUp);
        document.removeEventListener("pointercancel", onUp);
        // Cuts are already in order from uniform redistribution
        rebuildCuts();
      };

      document.addEventListener("pointermove", onMove);
      document.addEventListener("pointerup", onUp);
      document.addEventListener("pointercancel", onUp);
    });
  }

  plus.addEventListener("click", () => opts.onCountChange(1));
  minus.addEventListener("click", () => opts.onCountChange(-1));

  rebuildCuts();
  const onResize = () => rebuildCuts();
  window.addEventListener("resize", onResize);

  return {
    setCuts(newCuts: number[]) {
      // Compare to skip pointless rebuilds during drag (we already have these)
      if (
        newCuts.length === cuts.length &&
        newCuts.every((c, i) => Math.abs(c - cuts[i]) < 0.5)
      ) {
        return;
      }
      cuts = [...newCuts];
      rebuildCuts();
    },
    destroy() {
      window.removeEventListener("resize", onResize);
      container.innerHTML = "";
    },
  };
}
