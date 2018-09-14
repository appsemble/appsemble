import path from 'path';

import sharp from 'sharp';


const iconPath = path.resolve(__dirname, 'icon.svg');


export default async function iconHandler(ctx) {
  const {
    width,
    height = width,
  } = ctx.params;

  const img = sharp(iconPath).resize(Number(width), Number(height)).png();
  ctx.body = await img.toBuffer();
  ctx.type = 'image/png';
}
