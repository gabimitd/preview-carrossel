import "./ui-layout.css";
import { createAppStore } from "./app-store";
import { mountUploadZone, loadImagesFromFiles } from "./upload";
import { detectGrid } from "./grid-detect";
import { splitImage } from "./splitter";
import { mountGridEditor, type GridEditorInstance } from "./grid-editor";
import { mountIGFrame } from "./ig-frame";
import { mountFieldsForm } from "./fields-form";
import { mountProfileMenu } from "./profile-menu";
import { applyAppTheme } from "./theme";
import { mountAutosave } from "./drafts";
import { exportFrameAsPng, todayStamp } from "./export-png";
import { exportSlidesAsZip } from "./export-zip";
import type { Slide } from "./types";

const store = createAppStore();
applyAppTheme(store.getState().theme);

const app = document.getElementById("app")!;
app.innerHTML = `
  <div class="app-shell">
    <div class="topbar-right">
      <div id="profile-menu"></div>
    </div>

    <div class="work">
      <div class="left-col">
        <div class="upload-zone" id="upload-zone">
          <input type="file" id="upload-input" accept="image/*" multiple style="display:none" />
          <div><strong>Solte a imagem do carrossel</strong></div>
          <div style="font-size:11px;color:var(--muted);margin-top:2px">PNG/JPG larga ou múltiplos arquivos · ou clique</div>
        </div>

        <div class="grid-edit" id="grid-edit" style="display:none">
          <h3>Ajustar corte da grade</h3>
          <div id="grid-strip"></div>
          <div id="grid-info" style="font-size:11px;color:var(--muted);margin-top:6px"></div>
        </div>

        <div class="controls" id="controls"></div>

        <div class="actions-bar">
          <button id="btn-zip">⬇ slides .zip</button>
          <button id="btn-png" class="primary">⬇ preview .png</button>
        </div>
      </div>

      <div class="preview">
        <div class="frame-container" id="ig-frame"></div>
      </div>
    </div>
  </div>
`;

mountProfileMenu(document.getElementById("profile-menu")!, store);
mountFieldsForm(document.getElementById("controls")!, store);
mountIGFrame(document.getElementById("ig-frame")!, store);
// Drafts menu UI removed for cleaner topbar — autosave still runs in the background
mountAutosave(store);

// Upload pipeline
const zone = document.getElementById("upload-zone")!;
const input = document.getElementById("upload-input") as HTMLInputElement;
const gridEdit = document.getElementById("grid-edit")!;
const gridStrip = document.getElementById("grid-strip")!;
const gridInfo = document.getElementById("grid-info")!;
let gridEditor: GridEditorInstance | null = null;
let currentSourceImage: HTMLImageElement | null = null;

mountUploadZone(zone, input, async (files) => {
  try {
    const result = await loadImagesFromFiles(files);
    if (result.kind === "single") {
      const img = result.images[0];
      currentSourceImage = img;
      const grid = detectGrid(img.naturalWidth, img.naturalHeight);
      const slides = splitImage(img, grid.cuts);
      store.update((s) => ({
        ...s,
        carousel: {
          ...s.carousel,
          sourceImage: img,
          cuts: grid.cuts,
          slides,
          activeSlide: 0,
        },
      }));
      gridEdit.style.display = "block";
      gridInfo.textContent = `Detectado: ${grid.nSlides} slides · ${grid.slideWidth}×${grid.slideHeight} (${grid.format})${grid.hasPadding ? ` · padding extra de ${grid.paddingPx}px` : ""}`;
      gridEditor?.destroy();
      gridEditor = mountGridEditor(gridStrip, {
        imageDataUrl: img.src,
        imageWidth: img.naturalWidth,
        imageHeight: img.naturalHeight,
        cuts: grid.cuts,
        onChange: (cuts) => {
          if (!currentSourceImage) return;
          const next = splitImage(currentSourceImage, cuts);
          store.update((s) => ({
            ...s,
            carousel: { ...s.carousel, cuts, slides: next, activeSlide: 0 },
          }));
        },
        onCountChange: (delta) => {
          if (!currentSourceImage) return;
          const s = store.getState();
          const currentN = s.carousel.cuts.length + 1;
          const newN = Math.max(1, Math.min(10, currentN + delta));
          if (newN === currentN) return;
          // Distribute uniformly: N slides → cuts at i × (imageWidth / N)
          const W = currentSourceImage.naturalWidth / newN;
          const cuts: number[] = [];
          for (let i = 1; i < newN; i++) cuts.push(W * i);
          const next = splitImage(currentSourceImage, cuts);
          store.update((s2) => ({
            ...s2,
            carousel: { ...s2.carousel, cuts, slides: next, activeSlide: 0 },
          }));
          // Sync the editor's internal state + redraw the cut lines
          gridEditor?.setCuts(cuts);
        },
      });
    } else {
      // multiple files: skip grid editor
      currentSourceImage = null;
      gridEdit.style.display = "none";
      gridEditor?.destroy();
      gridEditor = null;
      const slides: Slide[] = result.images.map((img) => ({
        dataUrl: img.src,
        w: img.naturalWidth,
        h: img.naturalHeight,
      }));
      store.update((s) => ({
        ...s,
        carousel: {
          ...s.carousel,
          sourceImage: null,
          cuts: [],
          slides,
          activeSlide: 0,
        },
      }));
    }
  } catch (e) {
    alert((e as Error).message);
  }
});

// Export buttons
const btnZip = document.getElementById("btn-zip") as HTMLButtonElement;
const btnPng = document.getElementById("btn-png") as HTMLButtonElement;
const igFrameEl = document.getElementById("ig-frame")!;

function refreshButtons() {
  const has = store.getState().carousel.slides.length > 0;
  btnZip.disabled = !has;
  btnPng.disabled = !has;
}
store.subscribe(refreshButtons);
refreshButtons();

btnZip.addEventListener("click", async () => {
  try {
    btnZip.disabled = true;
    btnZip.textContent = "Empacotando...";
    await exportSlidesAsZip(store.getState().carousel.slides);
  } catch (e) {
    alert((e as Error).message);
  } finally {
    btnZip.textContent = "⬇ Baixar slides .zip";
    refreshButtons();
  }
});

btnPng.addEventListener("click", async () => {
  try {
    btnPng.disabled = true;
    btnPng.textContent = "Capturando...";
    const target = igFrameEl.querySelector(".ig") as HTMLElement;
    if (!target) throw new Error("Sem preview pra capturar.");
    await exportFrameAsPng(target, `preview-instagram-${todayStamp()}.png`);
  } catch (e) {
    alert((e as Error).message + "\n\nTente tirar um print manual.");
  } finally {
    btnPng.textContent = "⬇ Baixar preview .png";
    refreshButtons();
  }
});
