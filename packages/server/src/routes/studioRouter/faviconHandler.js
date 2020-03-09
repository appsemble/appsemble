import sharp from 'sharp';
import toIco from 'to-ico';

import getDefaultIcon from '../../utils/getDefaultIcon';

const sizes = [16, 32, 48, 64, 128, 256];

export default async function faviconHandler(ctx) {
  const icon = getDefaultIcon();
  // 2400 is the maximum density, meaning the SVG icon will still look good.
  const resize = size =>
    sharp(icon.slice(), { density: 2400 })
      .resize(size)
      .png()
      .toBuffer();
  const pngs = await Promise.all(sizes.map(resize));
  ctx.body = await toIco(pngs, { resize: false });
  ctx.type = 'image/x-icon';
}
