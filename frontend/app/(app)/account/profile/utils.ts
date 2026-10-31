const SIZE = 256;

export const ACCEPTED_IMAGE_TYPES = "image/png,image/jpeg,image/webp";

// Center-crops to a square and scales to 256×256, so uploads stay a few KB whatever the camera produced.
export async function toAvatarBlob(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const side = Math.min(bitmap.width, bitmap.height);
  const canvas = document.createElement("canvas");
  canvas.width = SIZE;
  canvas.height = SIZE;
  canvas.getContext("2d")!.drawImage(
    bitmap,
    (bitmap.width - side) / 2,
    (bitmap.height - side) / 2,
    side,
    side,
    0,
    0,
    SIZE,
    SIZE,
  );
  bitmap.close();
  // Safari can't encode WebP and falls back to PNG, which the API also accepts.
  return await new Promise((resolve, reject) =>
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Could not read the image."))),
      "image/webp",
      0.9,
    ),
  );
}
