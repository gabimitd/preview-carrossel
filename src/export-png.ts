import { toPng } from "html-to-image";

export async function exportFrameAsPng(
  frameElement: HTMLElement,
  filename: string,
): Promise<void> {
  // Wait for fonts to be ready so html-to-image renders text correctly
  if ("fonts" in document) {
    await (document as Document & { fonts: { ready: Promise<void> } }).fonts
      .ready;
  }
  const dataUrl = await toPng(frameElement, {
    pixelRatio: 2,
    cacheBust: true,
    backgroundColor: getComputedStyle(frameElement).backgroundColor,
  });
  triggerDownload(dataUrl, filename);
}

export function triggerDownload(dataUrl: string, filename: string): void {
  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

export function todayStamp(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}
