/**
 * Resize an image blob.
 *
 * Derived from https://hacks.mozilla.org/2011/01/how-to-develop-a-html5-image-uploader/
 *
 * @param file The input glob to resize
 * @param maxWidth The maximum width of the output
 * @param maxHeight The maximum height of the output
 * @param quality The quality in integer percentages.
 * @returns The resized image.
 */
export async function resize(
  file: Blob,
  maxWidth: number,
  maxHeight: number,
  quality = 80,
): Promise<Blob> {
  const img = new Image();
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  // Attempting to read width/height without waiting for it to load results in the values being 0.
  await new Promise((resolve) => {
    img.onload = resolve;
    img.src = URL.createObjectURL(file);
  });

  let { height, width } = img;

  // Resize while respecting ratios.
  if (maxWidth && width > maxWidth) {
    height *= maxWidth / width;
    width = maxWidth;
  }

  if (maxHeight && height > maxHeight) {
    width *= maxHeight / height;
    height = maxHeight;
  }

  canvas.width = Math.floor(width);
  canvas.height = Math.floor(height);

  ctx?.drawImage(img, 0, 0, width, height);

  return new Promise((resolve) => {
    /* @ts-expect-error strictNullChecks */
    canvas.toBlob((blob) => resolve(blob), file.type, quality / 100);
  });
}
