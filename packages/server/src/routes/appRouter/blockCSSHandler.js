import * as Boom from '@hapi/boom';

import { AppBlockStyle } from '../../models';
import getApp from '../../utils/getApp';

export default async function blockCSSHandler(ctx) {
  const { name } = ctx.params;

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
