import { ConditionActionDefinition } from '@appsemble/types';
import { defaultLocale, remap } from '@appsemble/utils';
import { Op } from 'sequelize';

import { EmailAuthorization } from '../../models/index.js';
import { handleAction } from '../action.js';
import { getRemapperContext } from '../app.js';
import { actions, ServerActionParameters } from './index.js';

export async function condition({
  action,
  app,
  data,
  user,
  ...params
}: ServerActionParameters<ConditionActionDefinition>): Promise<any> {
  await user?.reload({
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

  const context = await getRemapperContext(
    app,
    app.definition.defaultLanguage || defaultLocale,
    user && {
      sub: user.id,
      name: user.name,
      email: user.primaryEmail,
      email_verified: Boolean(user.EmailAuthorizations?.[0]?.verified),
      zoneinfo: user.timezone,
    },
  );

  const actionDefinition = remap(action.if, data, context) ? action.then : action.else;
  const implementation = actions[actionDefinition.type];
  return handleAction(implementation, { app, user, action: actionDefinition, data, ...params });
}
