import { type ReloadUserParams } from '@appsemble/node-utils';
import { Op } from 'sequelize';

import { EmailAuthorization, type User } from '../models/index.js';

export function reloadUser({ context }: ReloadUserParams): Promise<Record<string, any>> {
  const { user } = context;
  return (user as User)?.reload({
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
}
