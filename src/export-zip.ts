import JSZip from "jszip";
import type { Slide } from "./types";
import { triggerDownload, todayStamp } from "./export-png";

export async function exportSlidesAsZip(slides: Slide[]): Promise<void> {
  if (slides.length === 0) throw new Error("Sem slides para exportar.");
  const zip = new JSZip();
  for (let i = 0; i < slides.length; i++) {
    const blob = await dataUrlToBlob(slides[i].dataUrl);
    zip.file(`slide-${i + 1}.png`, blob);
  }
  const content = await zip.generateAsync({ type: "blob" });
  const url = URL.createObjectURL(content);
  triggerDownload(url, `carrossel-${todayStamp()}.zip`);
  // Revoke after the click has been processed
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

async function dataUrlToBlob(dataUrl: string): Promise<Blob> {
  const res = await fetch(dataUrl);
  return res.blob();
}
