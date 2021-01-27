import { Theme } from '@appsemble/types';

import { Organization } from '../../models';
import { KoaContext } from '../../types';
import { getApp } from '../../utils/app';
import { readAsset } from '../../utils/readAsset';
import { serveIcon } from '../serveIcon';

interface Params {
  format: string;
  height: string;
  width: string;
}

export async function iconHandler(ctx: KoaContext<Params>): Promise<void> {
  const { params, request } = ctx;
  const app = await getApp(ctx, {
    attributes: ['definition', 'icon'],
    include: [{ model: Organization, attributes: ['icon'] }],
  });
  const icon = app.icon || app.Organization.icon || (await readAsset('appsemble.svg'));
  const width = Number(params.width);
  const height = Number(params.height || params.width);
  const { format } = params;
  const opaque = 'opaque' in request.query || format === 'jpg' || format === 'tiff';
  let background;

  if (opaque) {
    const { themeColor = '#ffffff', splashColor = themeColor } =
      app.definition.theme || ({} as Theme);
    background = splashColor;
  }

  await serveIcon(ctx, { background, format, height, icon, width });
}
