import * as Boom from '@hapi/boom';

import { Organization, OrganizationBlockStyle } from '../../models';
import type { KoaContext } from '../../types';
import { getApp } from '../../utils/app';

interface Params {
  name: string;
}

export default async function organizationBlockCSSHandler(ctx: KoaContext<Params>): Promise<void> {
  const {
    params: { name },
  } = ctx;

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
  const [style] = org?.OrganizationBlockStyles;
  ctx.body = style ? style.style : '';
  ctx.type = 'css';
}
