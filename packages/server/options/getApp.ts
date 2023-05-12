import { type GetAppParams } from '@appsemble/node-utils';
import { type App as AppInterface } from '@appsemble/types';

import { AppMember } from '../models/AppMember.js';
import { Organization } from '../models/Organization.js';
import { getApp as getServerApp } from '../utils/app.js';

export async function getApp({ context, query }: GetAppParams): Promise<AppInterface> {
  const { app } = await getServerApp(context, {
    ...query,
    ...(context.user && {
      include: [
        { model: Organization, attributes: ['id'] },
        {
          model: AppMember,
          attributes: ['role', 'UserId'],
          required: false,
          where: { UserId: context.user.id },
        },
      ],
    }),
  });
  return app ? app.toJSON() : null;
}
