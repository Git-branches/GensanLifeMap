/**
 * Downscale a phone photo before upload so it fits the server's 2 MB
 * limit without asking the resident to edit it. Returns the original
 * file when it is already small or the browser can't process it.
 */
export async function prepareImageForUpload(file: File, maxEdge = 1600, quality = 0.82): Promise<File> {
  if (file.size <= 900 * 1024 && file.type === "image/jpeg") return file;
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext("2d")?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", quality));
    if (!blob || blob.size >= file.size) return file;
    return new File([blob], file.name.replace(/\.[^.]+$/, "") + ".jpg", { type: "image/jpeg" });
  } catch {
    return file;
  }
}
