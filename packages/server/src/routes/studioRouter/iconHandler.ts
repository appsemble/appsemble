import { Organization } from '../../models';
import type { KoaContext } from '../../types';
import { serveIcon } from '../serveIcon';

interface Params {
  format: string;
  height: string;
  width: string;
}

export async function iconHandler(ctx: KoaContext<Params>): Promise<void> {
  const { params } = ctx;

  const width = Number(params.width);
  const height = Number(params.height || params.width);
  const { format } = params;
  const opaque = 'opaque' in ctx.request.query || format === 'jpg' || format === 'tiff';
  const background = opaque && '#ffffff';

  await serveIcon(ctx, { background, format, height, width });
}
