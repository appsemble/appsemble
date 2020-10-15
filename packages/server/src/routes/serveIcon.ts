import sharp from 'sharp';

import type { KoaContext } from '../types';
import { readAsset } from '../utils/readAsset';

interface ServeIconOptions {
  background?: string;
  format?: string;
  height?: number;
  icon?: Buffer;
  width?: number;
}

export async function serveIcon(
  ctx: KoaContext,
  { background, icon, ...options }: ServeIconOptions,
): Promise<void> {
  // Allow icon to be null.
  const finalIcon = icon || (await readAsset('appsemble.svg'));
  let img = sharp(finalIcon);
  const metadata = await img.metadata();
  const width = options.width ?? (icon ? metadata.width : 128);
  const height = options.height ?? (icon ? metadata.height : 128);
  const format = options.format ?? (icon ? metadata.format : 'png');
  // SVG images can be resized with a density much better than its metadata specified.
  if (metadata.format === 'svg') {
    const density = Math.max(
      metadata.density * Math.max(width / metadata.width, height / metadata.height),
      // This is the maximum allowed value density allowed by sharp.
      2400,
    );
    img = sharp(finalIcon, { density });
  }
  img.resize(width, height);
  if (background) {
    img.flatten({ background });
  }
  img.toFormat(format);

  ctx.body = await img.toBuffer();
  ctx.type = format;
}
