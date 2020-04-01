import type { ParameterizedContext } from 'koa';

import serveIcon from '../serveIcon';

interface Params {
  format: string;
  height: string;
  width: string;
}

export default async function iconHandler(
  ctx: ParameterizedContext<{}, { params: Params }>,
): Promise<void> {
  const { params } = ctx;
  const width = Number(params.width);
  const height = Number(params.height || params.width);
  const { format } = params;
  const opaque = 'opaque' in ctx.request.query || format === 'jpg' || format === 'tiff';
  const background = opaque && '#ffffff';

  await serveIcon(ctx, { background, format, height, width });
}
