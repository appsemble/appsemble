import { serveIcon } from '@appsemble/node-utils';
import { type Context } from 'koa';

export async function iconHandler(ctx: Context): Promise<void> {
  const { params, request } = ctx;
  const size = Number(params?.size);

  await serveIcon(ctx, {
    background: 'opaque' in request.query ? '#ffffff' : undefined,
    fallback: 'appsemble.png',
    height: size,
    width: size,
  });
}
