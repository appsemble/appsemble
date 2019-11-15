import sharp from 'sharp';

import getDefaultIcon from '../utils/getDefaultIcon';

export default async function serveIcon(ctx, { icon, background, format, height, width }) {
  // Allow icon to be null.
  const finalIcon = icon || getDefaultIcon();
  let img = sharp(finalIcon);
  const metadata = await img.metadata();
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
