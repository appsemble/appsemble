import Boom from 'boom';
import sharp from 'sharp';

import getDefaultIcon from '../../utils/getDefaultIcon';

export default async function iconHandler(ctx) {
  const { format, id, width = 256, height = width, original } = ctx.params;
  const { App } = ctx.db.models;

  const opaque = 'opaque' in ctx.request.query || format === 'jpg' || format === 'tiff';
  let icon;
  let backgroundColor = '#ffffff';

  if (id != null) {
    const app = await App.findByPk(id, { raw: true });
    if (!app) {
      throw Boom.notFound('App not found');
    }
    ({ icon } = app);
    if (opaque) {
      const { themeColor = backgroundColor, splashColor = themeColor } = app.definition.theme || {};
      backgroundColor = splashColor;
    }
  }

  icon = icon || getDefaultIcon();

  let img = sharp(icon);
  const metadata = await img.metadata();
  // SVG images can be resized with a density much better than its metadata specified.
  if (metadata.format === 'svg') {
    const density = Math.max(
      metadata.density * Math.max(width / metadata.width, height / metadata.height),
      // This is the maximum allowed value density allowed by sharp.
      2400,
    );
    img = sharp(icon, { density });
  }

  if (!original) {
    img.resize(Number(width), Number(height));
    if (opaque) {
      img.background(backgroundColor).flatten();
    }

    img.toFormat(format);
  }

  ctx.body = await img.toBuffer();
  ctx.type = format || (metadata.format === 'svg' ? 'svg+xml' : metadata.format);
}
