import * as Boom from '@hapi/boom';

import getApp from '../../utils/getApp';

export default async function blockCSSHandler(ctx) {
  const { name } = ctx.params;
  const { AppBlockStyle } = ctx.db.models;

  const app = await getApp(ctx, {
    attributes: [],
    include: [
      {
        model: AppBlockStyle,
        attributes: ['style'],
        required: false,
        where: { block: name },
      },
    ],
  });

  if (!app) {
    throw Boom.notFound();
  }

  const [style] = app.AppBlockStyles;
  ctx.body = style ? style.style : '';
  ctx.type = 'css';
}
