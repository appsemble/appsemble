import * as Boom from '@hapi/boom';

import getApp from '../../utils/getApp';

export default function cssHandler(type) {
  return async (ctx) => {
    const app = await getApp(ctx, { attributes: [type], raw: true });

    if (!app) {
      throw Boom.notFound();
    }

    ctx.body = app[type];
    ctx.type = 'css';
  };
}
