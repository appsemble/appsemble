import { type AppMemberQueryAction, type AppRole } from '@appsemble/types';
import { remap } from '@appsemble/utils';
import { Op } from 'sequelize';

import { type ServerActionParameters } from './index.js';
import { AppMember } from '../../models/index.js';
import { getAppMemberInfo } from '../appMember.js';

export async function appMemberQuery({
  action,
  app,
  data,
  internalContext,
}: ServerActionParameters<AppMemberQueryAction>): Promise<unknown> {
  // @ts-expect-error 2345 argument of type is not assignable to parameter of type
  // (strictNullChecks)
  const remappedRoles = (remap(action.roles ?? [], data, internalContext) || []) as AppRole[];
  const appMembers = await AppMember.findAll({
    where: {
      AppId: app.id,
      demo: false,
      ...(remappedRoles.length ? { role: { [Op.in]: remappedRoles } } : {}),
    },
  });
  return appMembers.map((appMember) => getAppMemberInfo(appMember));
}
