import { KoaContext } from '../../types';
import { serveIcon } from '../../utils/icon';

interface Params {
  size: string;
}

export async function iconHandler(ctx: KoaContext<Params>): Promise<void> {
  const { params, request } = ctx;
  const size = Number(params.size);

  await serveIcon(ctx, {
    background: 'opaque' in request.query ? '#ffffff' : undefined,
    fallback: 'appsemble.png',
    height: size,
    width: size,
  });
}
