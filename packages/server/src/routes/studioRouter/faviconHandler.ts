import sharp from 'sharp';
import toIco from 'to-ico';

import type { KoaContext } from '../../types';
import readAsset from '../../utils/readAsset';

const sizes = [16, 32, 48, 64, 128, 256];

export default async function faviconHandler(ctx: KoaContext): Promise<void> {
  const icon = await readAsset('appsemble.svg');
  // 2400 is the maximum density, meaning the SVG icon will still look good.
  const resize = (size: number): Promise<Buffer> =>
    sharp(icon.slice(), { density: 2400 }).resize(size).png().toBuffer();
  const pngs = await Promise.all(sizes.map(resize));
  ctx.body = await toIco(pngs, { resize: false });
  ctx.type = 'image/x-icon';
}
