export async function loadImageFromFile(file: File): Promise<HTMLImageElement> {
  const url = URL.createObjectURL(file);
  const img = new Image();
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = () => reject(new Error(`Failed to load ${file.name}`));
    img.src = url;
  });
  // don't revoke, Canvas needs the live image (released on page unload)
  return img;
}

export function isImageFile(file: File): boolean {
  return /^image\/(png|jpe?g|webp)$/i.test(file.type);
}

export interface UploadResult {
  kind: "single" | "multiple";
  images: HTMLImageElement[];
}

export async function loadImagesFromFiles(files: File[]): Promise<UploadResult> {
  const valid = files.filter(isImageFile);
  if (valid.length === 0) {
    throw new Error("Nenhum arquivo de imagem válido (PNG/JPG/WebP).");
  }
  // Sort alphabetically by name for the multi-file case
  valid.sort((a, b) => a.name.localeCompare(b.name));
  const images = await Promise.all(valid.map(loadImageFromFile));
  return { kind: valid.length === 1 ? "single" : "multiple", images };
}

/**
 * Wires a drag-drop zone and a file input to a callback.
 * Returns a cleanup function.
 */
export function mountUploadZone(
  zoneEl: HTMLElement,
  inputEl: HTMLInputElement,
  onFiles: (files: File[]) => void,
): () => void {
  function handleFiles(list: FileList | null) {
    if (!list) return;
    onFiles(Array.from(list));
  }
  const onClick = () => inputEl.click();
  const onChange = () => handleFiles(inputEl.files);
  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    zoneEl.classList.remove("dragging");
    handleFiles(e.dataTransfer?.files ?? null);
  };
  const onDragOver = (e: DragEvent) => {
    e.preventDefault();
    zoneEl.classList.add("dragging");
  };
  const onDragLeave = () => zoneEl.classList.remove("dragging");

  zoneEl.addEventListener("click", onClick);
  inputEl.addEventListener("change", onChange);
  zoneEl.addEventListener("drop", onDrop);
  zoneEl.addEventListener("dragover", onDragOver);
  zoneEl.addEventListener("dragleave", onDragLeave);

  return () => {
    zoneEl.removeEventListener("click", onClick);
    inputEl.removeEventListener("change", onChange);
    zoneEl.removeEventListener("drop", onDrop);
    zoneEl.removeEventListener("dragover", onDragOver);
    zoneEl.removeEventListener("dragleave", onDragLeave);
  };
}
