import sharp from 'sharp';

import type { KoaContext } from '../types';

interface ServeIconOptions {
  background?: string;
  format?: string;
  height?: number;
  icon: Buffer;
  width?: number;
}

export async function serveIcon(
  ctx: KoaContext,
  { background, height, icon, width, ...options }: ServeIconOptions,
): Promise<void> {
  // Allow icon to be null.
  let img = sharp(icon);
  const metadata = await img.metadata();
  const format = options.format ?? metadata.format;
  // SVG images can be resized with a density much better than its metadata specified.
  if (metadata.format === 'svg') {
    const density = Math.max(
      metadata.density * Math.max(width / metadata.width, height / metadata.height),
      // This is the maximum allowed value density allowed by sharp.
      2400,
    );
    img = sharp(icon, { density });
  }
  if (width || height) {
    img.resize({ width, height });
  }
  if (background) {
    img.flatten({ background });
  }
  img.toFormat(format);

  ctx.body = await img.toBuffer();
  ctx.type = format;
}
