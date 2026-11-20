import type { Area } from "react-easy-crop";

/** The longest side of an upload, the same as the mobile app. */
export const PHOTO_MAX_PX = 1200;

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("This file is not an image that the browser can open."));
    image.src = src;
  });
}

/**
 * Cuts `area` (pixels of the source image) out of the image and makes a
 * square JPEG of at most PHOTO_MAX_PX. A small file also stays under the
 * request limit of the server (Vercel takes about 4.5 MB).
 */
export async function cropToJpeg(src: string, area: Area): Promise<Blob> {
  const image = await loadImage(src);
  const side = Math.min(PHOTO_MAX_PX, Math.round(area.width));
  const canvas = document.createElement("canvas");
  canvas.width = side;
  canvas.height = side;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("The browser cannot edit the photo.");
  // A transparent PNG gets a white background, not black.
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, side, side);
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(image, area.x, area.y, area.width, area.height, 0, 0, side, side);
  return new Promise((resolve, reject) =>
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Could not make the photo."))),
      "image/jpeg",
      0.85,
    ),
  );
}
