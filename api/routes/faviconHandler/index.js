import path from 'path';

import sharp from 'sharp';
import toIco from 'to-ico';


const iconPath = path.resolve(new URL(import.meta.url).pathname, '../../iconHandler/icon.svg');


const sizes = [16, 32, 48, 64, 128, 256];


export default async function faviconHandler(ctx) {
  const resize = size => sharp(iconPath).resize(size).png().toBuffer();
  const pngs = await Promise.all(sizes.map(resize));
  ctx.body = await toIco(pngs);
  ctx.type = 'image/x-icon';
}
