import { type AppMemberQueryAction, type AppRole } from '@appsemble/types';
import { remap } from '@appsemble/utils';
import { Op } from 'sequelize';

import { type ServerActionParameters } from './index.js';
import { AppMember } from '../../models/index.js';
import { getAppMemberInfo, parseMemberFilterQuery } from '../appMember.js';

export async function appMemberQuery({
  action,
  app,
  data,
  internalContext,
}: ServerActionParameters<AppMemberQueryAction>): Promise<unknown> {
  // @ts-expect-error 2345 argument of type is not assignable to parameter of type
  // (strictNullChecks)
  const remappedRoles = (remap(action.roles ?? [], data, internalContext) || []) as AppRole[];
  // @ts-expect-error 2345 argument of type is not assignable to parameter of type
  // (strictNullChecks)
  const query = (remap(action.query ?? '', data, internalContext) ?? {}) as { $filter?: string };
  const parsedFilter = parseMemberFilterQuery(query.$filter ?? '');
  const commonFilters = {
    AppId: app.id,
    demo: false,
    ...(remappedRoles.length
      ? { role: { [Op.in]: Array.isArray(remappedRoles) ? remappedRoles : [remappedRoles] } }
      : {}),
  };

  const appMembers = await AppMember.findAll({
    where: {
      ...(query.$filter ? { [Op.and]: [parsedFilter, commonFilters] } : commonFilters),
    },
  });
  return appMembers.map((appMember) => getAppMemberInfo(appMember));
}
