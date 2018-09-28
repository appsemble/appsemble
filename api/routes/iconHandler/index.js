import path from 'path';

import Boom from 'boom';
import sharp from 'sharp';

import getDefaultIcon from '../../utils/getDefaultIcon';


export default async function iconHandler(ctx) {
  const {
    format,
    id,
    width,
    height = width,
  } = ctx.params;
  const {
    App,
  } = ctx.state.db;
  const opaque = 'opaque' in ctx.request.query || format === 'jpg' || format === 'tiff';
  let icon = getDefaultIcon();
  let backgroundColor = '#ffffff';

  if (id != null) {
    const app = await App.findById(id, { raw: true });
    if (!app) {
      throw Boom.notFound('App not found');
    }
    ({ icon = icon } = app);
    if (opaque) {
      const {
        themeColor = backgroundColor,
        splashColor = themeColor,
      } = app.definition.theme || {};
      backgroundColor = splashColor;
    }
  }

  const img = sharp(icon).resize(Number(width), Number(height));
  if (opaque) {
    img.background(backgroundColor).flatten();
  }
  img.toFormat(format);
  ctx.body = await img.toBuffer();
  ctx.type = format;
}
