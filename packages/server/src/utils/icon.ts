import sharp, { RGBA, Sharp } from 'sharp';

import { App } from '../models';
import { KoaContext } from '../types';
import { readAsset } from './readAsset';

interface ServeIconOptions {
  adaptive: boolean;
  size: number;
}

/**
 * A transparent background color used by sharp.
 */
const transparent: RGBA = { r: 0, g: 0, b: 0, alpha: 0 };

const white: RGBA = { r: 0xff, g: 0xff, b: 0xff, alpha: 1 };

/**
 * The diameter of the safe area for adaptive icons.
 *
 * https://css-tricks.com/maskable-icons-android-adaptive-icons-for-your-pwa/
 */
const safeAreaDiameter = 0.8;

export async function serveIcon(
  ctx: KoaContext,
  { Organization, adaptiveIcon, icon, iconBackground }: App,
  { adaptive, size }: ServeIconOptions,
): Promise<void> {
  let img: Sharp;
  const background = iconBackground ?? white;

  if (!adaptive) {
    // Serve the regular app icon, but scaped.
    img = sharp(icon || Organization.icon || (await readAsset('appsemble.png'))).resize({
      width: size,
      height: size,
      fit: 'contain',
      background: transparent,
    });
  } else if (adaptiveIcon) {
    // Serve adaptive icon
    img = sharp(adaptiveIcon);
    // XXX use exact size
    img.resize({ width: size, height: size, fit: 'cover' });
    img.flatten({ background });
  } else {
    // Make the regular icon adaptive
    const actual = sharp(icon || Organization.icon || (await readAsset('appsemble.png')));
    const metadata = await actual.metadata();
    const angle = Math.atan(metadata.height / metadata.width);
    actual.resize({
      width: Math.ceil(Math.cos(angle) * safeAreaDiameter * size),
      // By leaving out height, libvips will determine this for us. This has better precision than
      // calculating this using JavasScript and passing it manually.
      // height: Math.ceil(Math.sin(angle) * safeAreaDiameter * size),
      fit: 'contain',
      background: transparent,
    });
    img = sharp(Buffer.alloc(size * size * 4, 0), {
      raw: { width: size, height: size, channels: 4 },
    });
    img.resize(size);
    img.flatten({ background });
    img.composite([{ input: await actual.toFormat('png').toBuffer() }]);
  }

  ctx.body = await img.toFormat('png').toBuffer();
  ctx.type = 'image/png';
}
