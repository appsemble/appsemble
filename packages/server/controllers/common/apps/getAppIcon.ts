import { isDeepStrictEqual } from 'node:util';

import { assertKoaCondition, serveIcon } from '@appsemble/node-utils';
import { parseISO } from 'date-fns';
import { type Context } from 'koa';

import { App, Organization } from '../../../models/index.js';

export async function getAppIcon(ctx: Context): Promise<void> {
  const {
    pathParams: { appId },
    query: { maskable = false, raw = false, size = 128, updated },
  } = ctx;
  const app = await App.findByPk(appId, {
    attributes: [
      'icon',
      'updated',
      maskable && 'maskableIcon',
      maskable && 'iconBackground',
    ].filter((x) => x !== false && typeof x === 'string'),
    include: [{ model: Organization, attributes: ['icon', 'updated'] }],
  });

  assertKoaCondition(app != null, ctx, 404, 'App not found');

  const dbUpdated =
    (maskable && app.maskableIcon) || app.icon ? app.updated : app.Organization!.updated;

  return serveIcon(ctx, {
    background: maskable ? app.iconBackground || '#ffffff' : undefined,
    cache: isDeepStrictEqual(parseISO(updated as string), dbUpdated),
    fallback: 'mobile-alt-solid.png',
    height: size ? Number.parseInt(size as string) : undefined,
    icon: app.icon || app.Organization!.icon,
    maskable: Boolean(maskable),
    maskableIcon: app.maskableIcon,
    raw: Boolean(raw),
    width: size ? Number.parseInt(size as string) : undefined,
  });
}
