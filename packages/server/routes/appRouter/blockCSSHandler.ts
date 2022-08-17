import { notFound } from '@hapi/boom';
import { Context } from 'koa';

import { AppBlockStyle } from '../../models/index.js';
import { getApp } from '../../utils/app.js';

export async function blockCSSHandler(ctx: Context): Promise<void> {
  const {
    params: { name },
  } = ctx;

  const { app } = await getApp(ctx, {
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
    throw notFound('App not found');
  }

  const [style] = app.AppBlockStyles;
  ctx.body = style ? style.style : '';
  ctx.type = 'css';
}
