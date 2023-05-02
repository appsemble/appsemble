import { getRemapperContext } from '@appsemble/node-utils';
import { ConditionActionDefinition } from '@appsemble/types';
import { defaultLocale, remap } from '@appsemble/utils';
import { Op } from 'sequelize';

import { EmailAuthorization } from '../../models/index.js';
import { handleAction } from '../action.js';
import { actions, ServerActionParameters } from './index.js';

export async function condition({
  action,
  app,
  context,
  data,
  options,
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

  const remapperContext = await getRemapperContext(
    app.toJSON(),
    app.definition.defaultLanguage || defaultLocale,
    user && {
      sub: user.id,
      name: user.name,
      email: user.primaryEmail,
      email_verified: Boolean(user.EmailAuthorizations?.[0]?.verified),
      zoneinfo: user.timezone,
    },
    options,
    context,
  );

  const actionDefinition = remap(action.if, data, remapperContext) ? action.then : action.else;
  const implementation = actions[actionDefinition.type];
  return handleAction(implementation, {
    app,
    user,
    action: actionDefinition,
    data,
    options,
    context,
    ...params,
  });
}
