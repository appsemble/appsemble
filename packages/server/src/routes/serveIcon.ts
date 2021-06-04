import sharp from 'sharp';

import { KoaContext } from '../types';

interface ServeIconOptions {
  background?: string;
  format?: 'png' | 'tiff' | 'webp';
  height?: number;
  icon: Buffer;
  width?: number;
  immutable?: boolean;
  updated?: string;
}

export async function serveIcon(
  ctx: KoaContext,
  { background, height, icon, immutable, updated, width, ...options }: ServeIconOptions,
): Promise<void> {
  const {
    query: { updated: queryUpdated },
  } = ctx;

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

  if (immutable || (updated && queryUpdated && updated === queryUpdated)) {
    // Cache app icons for 1 week.
    ctx.set('cache-control', `public, max-age=${60 * 60 * 24 * 7}, immutable`);
  }
}
