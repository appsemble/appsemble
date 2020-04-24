import * as Boom from '@hapi/boom';

import { Organization, OrganizationBlockStyle } from '../../models';
import getApp from '../../utils/getApp';

export default async function organizationBlockCSSHandler(ctx) {
  const { name } = ctx.params;

  const app = await getApp(ctx, {
    attributes: [],
    include: [
      {
        model: Organization,
        required: false,
        include: [
          {
            model: OrganizationBlockStyle,
            attributes: ['style'],
            required: false,
            where: { block: name },
          },
        ],
      },
    ],
  });

  if (!app) {
    throw Boom.notFound();
  }

  const org = app.Organization;
  const [style] = org && org.OrganizationBlockStyles;
  ctx.body = style ? style.style : '';
  ctx.type = 'css';
}
