import { isEqual, parseISO } from 'date-fns';
import { Context } from 'koa';

import { Organization } from '../../models/index.js';
import { getApp } from '../../utils/app.js';
import { serveIcon } from '../../utils/icon.js';

export async function iconHandler(ctx: Context): Promise<void> {
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
