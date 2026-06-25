/**
 * Resize a File (image) to fit inside maxSize by maxSize. Returns a data URL (PNG).
 * Centers crop to a square if not already square.
 */
export async function resizeImageFile(
  file: File,
  maxSize: number,
): Promise<string> {
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error("Falha ao carregar imagem."));
      img.src = url;
    });

    const side = Math.min(img.naturalWidth, img.naturalHeight);
    const sx = (img.naturalWidth - side) / 2;
    const sy = (img.naturalHeight - side) / 2;

    const canvas = document.createElement("canvas");
    canvas.width = maxSize;
    canvas.height = maxSize;
    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(img, sx, sy, side, side, 0, 0, maxSize, maxSize);
    return canvas.toDataURL("image/png");
  } finally {
    URL.revokeObjectURL(url);
  }
}

/** Resize an image element to a thumbnail data URL (for drafts list). */
export function resizeElementToThumb(
  img: HTMLImageElement | HTMLCanvasElement,
  maxWidth: number,
): string {
  const aspect =
    img instanceof HTMLImageElement
      ? img.naturalHeight / img.naturalWidth
      : img.height / img.width;
  const w = maxWidth;
  const h = Math.round(maxWidth * aspect);
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(img, 0, 0, w, h);
  return canvas.toDataURL("image/png");
}
