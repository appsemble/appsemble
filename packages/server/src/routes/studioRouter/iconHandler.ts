import { Organization } from '../../models';
import type { KoaContext } from '../../types';
import { serveIcon } from '../serveIcon';

interface Params {
  format: string;
  height: string;
  width: string;
  organization?: string;
}

export async function iconHandler(ctx: KoaContext<Params>): Promise<void> {
  const { params } = ctx;
  let icon = null;

  if (params.organization) {
    ({ icon } = await Organization.findOne({
      where: { id: params.organization },
      attributes: ['icon'],
      raw: true,
    }));
  }

  const width = Number(params.width);
  const height = Number(params.height || params.width);
  const { format } = params;
  const opaque = 'opaque' in ctx.request.query || format === 'jpg' || format === 'tiff';
  const background = opaque && '#ffffff';

  await serveIcon(ctx, { background, format, height, icon, width });
}
