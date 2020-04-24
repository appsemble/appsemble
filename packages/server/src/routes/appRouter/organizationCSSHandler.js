import * as Boom from '@hapi/boom';

import { Organization } from '../../models';
import getApp from '../../utils/getApp';

export default function organizationCSSHandler(type) {
  return async (ctx) => {
    const app = await getApp(ctx, {
      attributes: [],
      include: [{ model: Organization, attributes: [type] }],
    });

    if (!app) {
      throw Boom.notFound();
    }

    ctx.body = app.Organization[type];
    ctx.type = 'css';
  };
}
