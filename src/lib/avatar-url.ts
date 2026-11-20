/**
 * The image of a user avatar, the same rule as the mobile app
 * (realstay-prod `src/features/profile/avatar-url.ts` and
 * `src/features/images/cloudinary-url.ts`; change them together):
 * - A photo on Cloudinary (the backend stores uploads there) comes at the
 *   size of the avatar, cropped to the face.
 * - No photo: a DiceBear "line-face" avatar, seeded with the user id, so each
 *   user keeps the same face in the app and in the panel.
 */

const CLOUDINARY_IMAGE = /^(https:\/\/res\.cloudinary\.com\/[^/]+\/image\/upload\/)(.+)$/;

/** Sizes go up in steps of 120 px, so near sizes share one cached file. */
const SIZE_STEP_PX = 120;

/** Soft colours behind the DiceBear lines (the same as the app). */
const DICEBEAR_BACKGROUNDS = "b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf";

function sizeStep(px: number) {
  return px > 0 ? Math.ceil(px / SIZE_STEP_PX) * SIZE_STEP_PX : SIZE_STEP_PX;
}

/** A square photo of `px` pixels, cropped to the face, if it is on Cloudinary. */
export function cloudinaryFaceUrl(url: string, px: number) {
  const trimmed = url.trim();
  const match = trimmed.match(CLOUDINARY_IMAGE);
  if (!match) return trimmed;
  const [, base, rest] = match;
  const size = sizeStep(px);
  return `${base}c_fill,g_face,w_${size},h_${size},q_auto/${rest}`;
}

export function diceBearAvatarUrl(seed: string, px: number) {
  // Do not use URLSearchParams: it encodes the commas of the colour list as
  // %2C, and DiceBear then refuses the request.
  const query = [
    `seed=${encodeURIComponent(seed)}`,
    `size=${px}`,
    "borderRadius=50",
    `backgroundColor=${DICEBEAR_BACKGROUNDS}`,
  ].join("&");
  return `https://api.dicebear.com/10.x/line-face/png?${query}`;
}

/**
 * The image of an avatar of `size` CSS pixels (2 image pixels each, for
 * sharp screens). Undefined without a photo and an id: the avatar then shows
 * the initials.
 */
export function avatarUrl(
  user: { _id?: string | null; id?: string | null; image_url?: string | null } | null | undefined,
  size: number,
): string | undefined {
  const px = Math.round(size * 2);
  const photo = user?.image_url?.trim();
  if (photo) return cloudinaryFaceUrl(photo, px);
  const id = user?._id || user?.id;
  return id ? diceBearAvatarUrl(id, px) : undefined;
}
