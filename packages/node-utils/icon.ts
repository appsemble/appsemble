import { type Context } from 'koa';
import sharp, { type RGBA } from 'sharp';

import { readAsset } from './readAsset.js';

interface ServeIconOptions {
  /**
   * If specified, fill the background with this color.
   */
  background?: RGBA | string;

  /**
   * If true, cache the icon for a week / immutable.
   */
  cache?: boolean;

  /**
   * The name of a fallback icon to use.
   */
  fallback: string;

  /**
   * The height to scale the image to.
   */
  height?: number;

  /**
   * The icon to render.
   */
  icon?: Buffer;

  /**
   * If true, the maskable icon is preferred over the regular icon. If no maskable icon is defined,
   * the icon will be scaled to fit within a maskable icon diameter (80% diameter).
   */
  maskable?: boolean;

  /**
   * The maskable icon to render if this is preferred.
   */
  maskableIcon?: Buffer;

  /**
   * If true, render the raw icon. In this case all other options are ignored.
   */
  raw?: boolean;

  /**
   * The width to scale the image to.
   */
  width?: number;
}

/**
 * A transparent background color used by sharp.
 */
const transparent: RGBA = { r: 0, g: 0, b: 0, alpha: 0 };

/**
 * The diameter of the safe area for maskable icons.
 *
 * https://css-tricks.com/maskable-icons-android-maskable-icons-for-your-pwa/
 */
const safeAreaDiameter = 0.8;

export async function serveIcon(
  ctx: Context,
  {
    background,
    cache,
    fallback,
    height,
    icon,
    maskable,
    maskableIcon,
    raw,
    width,
  }: ServeIconOptions,
): Promise<void> {
  const buffer = (maskable && maskableIcon) || icon || (await readAsset(fallback));
  let img = sharp(buffer);

  if (raw) {
    const { format } = await img.metadata();
    ctx.body = buffer;
    ctx.type = format;
    return;
  }
  if (!maskable) {
    // Serve the regular app icon, but scaled.
    img.resize({
      width,
      height,
      fit: 'contain',
      background: background || transparent,
    });
    if (background) {
      img.flatten({ background });
    }
  } else if (maskableIcon) {
    img.resize({ width, height, fit: 'cover' });
    if (background) {
      img.flatten({ background });
    }
  } else {
    // Make the regular icon maskable
    const actual = img;
    const metadata = await actual.metadata();
    const angle = Math.atan(metadata.height / metadata.width);
    actual.resize({
      // @ts-expect-error 18048 variable is possibly undefined (strictNullChecks)
      width: Math.ceil(Math.cos(angle) * safeAreaDiameter * width),
      // By leaving out height, libvips will determine this for us. This has better precision than
      // calculating this using JavasScript and passing it manually.
      // height: Math.ceil(Math.sin(angle) * safeAreaDiameter * size),
      fit: 'contain',
      background,
    });
    // @ts-expect-error 18048 variable is possibly undefined (strictNullChecks)
    img = sharp(Buffer.alloc(width * height * 4, 0), {
      // @ts-expect-error 2322 null is not assignable to type (strictNullChecks)
      raw: { width, height, channels: 4 },
    });
    img.resize({ width, height });
    img.composite([{ input: await actual.toFormat('png').toBuffer() }]);
    if (background) {
      img.flatten({ background });
    }

    // Cache app icons for 1 week.
    if (cache) {
      ctx.set('cache-control', `public, max-age=${60 * 60 * 24 * 7},immutable`);
    }
  }

  ctx.body = await img.toFormat('png').toBuffer();
  ctx.type = 'image/png';
}
