import type { KoaContext } from '../../types';
import { readAsset } from '../../utils/readAsset';
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

  const icon = (await readAsset('appsemble.svg')) as Buffer;
  await serveIcon(ctx, { background, format: format ?? 'png', height, width, icon });
}
