import { notFound } from '@hapi/boom';

import { Organization } from '../../models';
import type { KoaMiddleware } from '../../types';
import { getApp } from '../../utils/app';

export function organizationCSSHandler(type: 'coreStyle' | 'sharedStyle'): KoaMiddleware {
  return async (ctx) => {
    const app = await getApp(ctx, {
      attributes: [],
      include: [{ model: Organization, attributes: [type] }],
    });

    if (!app) {
      throw notFound();
    }

    ctx.body = app.Organization[type];
    ctx.type = 'css';
  };
}
