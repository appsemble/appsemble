import Boom from 'boom';
import sharp from 'sharp';
import toIco from 'to-ico';

import getDefaultIcon from '../../utils/getDefaultIcon';


const sizes = [16, 32, 48, 64, 128, 256];


export default async function faviconHandler(ctx) {
  const {
    id,
  } = ctx.params;
  const {
    App,
  } = ctx.state.db;

  let icon = getDefaultIcon();

  if (id != null) {
    const app = await App.findById(id, { raw: true });
    if (!app) {
      throw Boom.notFound('App not found');
    }
    ({ icon = icon } = app);
  }

  const resize = size => sharp(icon.slice()).resize(size).png().toBuffer();
  let pngs = await Promise.all(sizes.map(resize));
  try {
    ctx.body = await toIco(pngs, { resize: false });
  } catch (error) {
    // to-ico doesn’t support all images. The default icon is served as a fallback.
    // https://github.com/kevva/to-ico#input
    icon = getDefaultIcon();
    pngs = await Promise.all(sizes.map(resize));
    ctx.body = await toIco(pngs, { resize: false });
  }
  ctx.type = 'image/x-icon';
}
