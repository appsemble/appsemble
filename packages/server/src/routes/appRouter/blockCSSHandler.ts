import { notFound } from '@hapi/boom';

import { AppBlockStyle } from '../../models';
import type { KoaContext } from '../../types';
import { getApp } from '../../utils/app';

interface Params {
  name: string;
}

export async function blockCSSHandler(ctx: KoaContext<Params>): Promise<void> {
  const {
    params: { name },
  } = ctx;

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
    throw notFound();
  }

  const [style] = app.AppBlockStyles;
  ctx.body = style ? style.style : '';
  ctx.type = 'css';
}
