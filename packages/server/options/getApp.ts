import { GetAppParams } from '@appsemble/node-utils/server/types.js';
import { App as AppInterface } from '@appsemble/types';

import { AppMember } from '../models/AppMember.js';
import { Organization } from '../models/Organization.js';
import { getApp as getServerApp } from '../utils/app.js';

export const getApp = async ({ context, query, user }: GetAppParams): Promise<AppInterface> => {
  const { app } = await getServerApp(context, {
    ...query,
    ...(user && {
      include: [
        { model: Organization, attributes: ['id'] },
        {
          model: AppMember,
          attributes: ['role', 'UserId'],
          required: false,
          where: { UserId: user.id },
        },
      ],
    }),
  });
  return app ? app.toJSON() : null;
};
