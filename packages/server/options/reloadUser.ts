import { ReloadUserParams } from '@appsemble/node-utils/server/types';
import { Op } from 'sequelize';

import { EmailAuthorization } from '../models/index.js';

export const reloadUser = ({ context }: ReloadUserParams): Promise<Record<string, any>> => {
  const { user } = context;
  return user?.reload({
    attributes: ['primaryEmail', 'name', 'timezone'],
    include: [
      {
        required: false,
        model: EmailAuthorization,
        attributes: ['verified'],
        where: {
          email: { [Op.col]: 'User.primaryEmail' },
        },
      },
    ],
  });
};
