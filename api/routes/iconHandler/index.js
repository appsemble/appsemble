import path from 'path';

import sharp from 'sharp';


const iconPath = path.resolve(__dirname, 'icon.svg');


export default async function iconHandler(ctx) {
  const {
    size,
  } = ctx.params;

  const img = sharp(iconPath).resize(Number(size)).png();
  ctx.body = await img.toBuffer();
  ctx.type = 'image/png';
}
