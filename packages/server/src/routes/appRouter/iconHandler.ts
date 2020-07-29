import type { Theme } from '@appsemble/types';

import type { KoaContext } from '../../types';
import { getApp } from '../../utils/app';
import serveIcon from '../serveIcon';

interface Params {
  format: string;
  height: string;
  width: string;
}

export default async function iconHandler(ctx: KoaContext<Params>): Promise<void> {
  const { params } = ctx;
  const app = await getApp(ctx, {
    attributes: ['definition', 'icon'],
    raw: true,
  });
  const width = Number(params.width);
  const height = Number(params.height || params.width);
  const { format } = params;
  const opaque = 'opaque' in ctx.request.query || format === 'jpg' || format === 'tiff';
  let background;

  if (opaque) {
    const { themeColor = '#ffffff', splashColor = themeColor } =
      app.definition.theme || ({} as Theme);
    background = splashColor;
  }

  await serveIcon(ctx, { background, format, height, icon: app?.icon, width });
}
