import "./grid-editor.css";

export interface GridEditorOptions {
  imageDataUrl: string;
  imageWidth: number;
  imageHeight: number;
  cuts: number[];
  onChange: (newCuts: number[]) => void;
  onCountChange: (delta: 1 | -1) => void;
}

export function mountGridEditor(
  container: HTMLElement,
  opts: GridEditorOptions,
): () => void {
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

  function attachDrag(node: HTMLElement, idx: number) {
    node.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      e.stopPropagation();
      const stripW = strip.clientWidth || 1;
      const startX = e.clientX;
      const startCut = cuts[idx];

      const onMove = (ev: PointerEvent) => {
        const dxPx = ev.clientX - startX;
        const dxImg = (dxPx / stripW) * opts.imageWidth;
        const newC = Math.max(
          0,
          Math.min(opts.imageWidth, startCut + dxImg),
        );
        cuts[idx] = newC;
        // Update only this cut's visual position — DON'T rebuild during drag
        node.style.left = `${(newC / opts.imageWidth) * 100}%`;
        // Emit a sorted snapshot so consumer always gets ordered cuts
        const sorted = [...cuts].sort((a, b) => a - b);
        opts.onChange(sorted);
      };

      const onUp = () => {
        document.removeEventListener("pointermove", onMove);
        document.removeEventListener("pointerup", onUp);
        document.removeEventListener("pointercancel", onUp);
        // Now sort the internal array and rebuild to reflect final order
        cuts.sort((a, b) => a - b);
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

  return () => {
    window.removeEventListener("resize", onResize);
    container.innerHTML = "";
  };
}
