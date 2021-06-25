import { isEqual, parseISO } from 'date-fns';

import { Organization } from '../../models';
import { KoaContext } from '../../types';
import { getApp } from '../../utils/app';
import { serveIcon } from '../../utils/icon';

interface Params {
  format: 'png' | 'tiff' | 'webp';
  size: string;
}

export async function iconHandler(ctx: KoaContext<Params>): Promise<void> {
  const {
    params: { size = 128 },
    query: { maskable = false, updated },
  } = ctx;
  const { app } = await getApp(ctx, {
    attributes: [
      'icon',
      'updated',
      maskable && 'maskableIcon',
      maskable && 'iconBackground',
    ].filter(Boolean),
    include: [{ model: Organization, attributes: ['icon', 'updated'] }],
  });

  const dbUpdated =
    (maskable && app.maskableIcon) || app.icon ? app.updated : app.Organization.updated;

  await serveIcon(ctx, {
    background: maskable ? app.iconBackground || '#ffffff' : undefined,
    cache: isEqual(parseISO(updated as string), dbUpdated),
    fallback: 'mobile-alt-solid.png',
    height: size && Number.parseInt(size as string),
    icon: app.icon || app.Organization.icon,
    maskable: Boolean(maskable),
    width: size && Number.parseInt(size as string),
  });
}
