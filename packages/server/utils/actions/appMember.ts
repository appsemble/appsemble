import { type AppMemberQueryAction, type AppRole, defaultLocale, remap } from '@appsemble/lang-sdk';
import { getRemapperContext } from '@appsemble/node-utils';
import { Op } from 'sequelize';

import { type ServerActionParameters } from './index.js';
import { getAppDB } from '../../models/index.js';
import { getAppMemberInfo, parseMemberFilterQuery } from '../appMember.js';

export async function appMemberQuery({
  action,
  app,
  context,
  data,
  internalContext,
  options,
}: ServerActionParameters<AppMemberQueryAction>): Promise<unknown> {
  const remapperContext = await getRemapperContext(
    app.toJSON(),
    app.definition.defaultLanguage || defaultLocale,
    options,
    context,
  );
  Object.assign(remapperContext, {
    history: internalContext?.history ?? [],
  });
  const remappedRoles = (remap(action.roles ?? null, data, remapperContext) || []) as AppRole[];
  const query = (remap(action.query ?? '', data, remapperContext) ?? {}) as { $filter?: string };
  const parsedFilter = parseMemberFilterQuery(query.$filter ?? '');
  const commonFilters = {
    demo: false,
    ...(remappedRoles.length
      ? { role: { [Op.in]: Array.isArray(remappedRoles) ? remappedRoles : [remappedRoles] } }
      : {}),
  };

  const { AppMember } = await getAppDB(app.id);
  const appMembers = await AppMember.findAll({
    where: {
      ...(query.$filter ? { [Op.and]: [parsedFilter, commonFilters] } : commonFilters),
    },
  });
  return appMembers.map((appMember) => getAppMemberInfo(app.id, appMember));
}
