import { Context } from 'koa';

import { serveIcon } from '../../utils/icon';

export async function iconHandler(ctx: Context): Promise<void> {
  const { params, request } = ctx;
  const size = Number(params.size);

  await serveIcon(ctx, {
    background: 'opaque' in request.query ? '#ffffff' : undefined,
    fallback: 'appsemble.png',
    height: size,
    width: size,
  });
}
