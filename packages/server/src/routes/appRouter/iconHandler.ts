import { Organization } from '../../models';
import { KoaContext } from '../../types';
import { getApp } from '../../utils/app';
import { serveIcon } from '../../utils/icon';

interface Params {
  format: 'png' | 'tiff' | 'webp';
  height: string;
  width: string;
}

export async function iconHandler(ctx: KoaContext<Params>): Promise<void> {
  const { params, query } = ctx;
  const app = await getApp(ctx, {
    attributes: ['definition', 'icon', 'maskableIcon', 'iconBackground'],
    include: [{ model: Organization, attributes: ['icon'] }],
  });

  await serveIcon(ctx, app, { size: Number(params.width), maskable: Boolean(query.maskable) });
}
