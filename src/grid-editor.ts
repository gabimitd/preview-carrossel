import "./grid-editor.css";

export interface GridEditorOptions {
  imageDataUrl: string;
  imageWidth: number;
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

  function render() {
    strip.querySelectorAll(".cut").forEach((n) => n.remove());
    const stripW = strip.clientWidth || 1;
    cuts.forEach((c, i) => {
      const node = document.createElement("div");
      node.className = "cut";
      node.dataset.idx = String(i);
      node.style.left = `${(c / opts.imageWidth) * 100}%`;
      strip.appendChild(node);
      attachDrag(node, i, stripW);
    });
  }

  function attachDrag(node: HTMLElement, idx: number, stripW: number) {
    node.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      node.setPointerCapture(e.pointerId);
      const startX = e.clientX;
      const startCut = cuts[idx];
      const onMove = (ev: PointerEvent) => {
        const dxPx = ev.clientX - startX;
        const dxImg = (dxPx / stripW) * opts.imageWidth;
        const newC = Math.max(0, Math.min(opts.imageWidth, startCut + dxImg));
        cuts = cuts.map((c, i) => (i === idx ? newC : c)).sort((a, b) => a - b);
        opts.onChange(cuts);
        render();
      };
      const onUp = () => {
        node.releasePointerCapture(e.pointerId);
        node.removeEventListener("pointermove", onMove);
        node.removeEventListener("pointerup", onUp);
      };
      node.addEventListener("pointermove", onMove);
      node.addEventListener("pointerup", onUp);
    });
  }

  plus.addEventListener("click", () => opts.onCountChange(1));
  minus.addEventListener("click", () => opts.onCountChange(-1));

  render();
  const onResize = () => render();
  window.addEventListener("resize", onResize);

  return () => {
    window.removeEventListener("resize", onResize);
    container.innerHTML = "";
  };
}
