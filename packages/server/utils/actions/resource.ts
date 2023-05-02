import { getRemapperContext, getResourceDefinition } from '@appsemble/node-utils';
import { type ResourceQueryActionDefinition } from '@appsemble/types';
import { defaultLocale, remap } from '@appsemble/utils';
import { type QueryParams } from 'koas-parameters';
import { Op } from 'sequelize';

import { type ServerActionParameters } from './index.js';
import { AppMember, Resource } from '../../models/index.js';
import { parseQuery } from '../resource.js';

export async function query({
  action,
  app,
  context,
  data,
  internalContext,
  options,
  user,
}: ServerActionParameters<ResourceQueryActionDefinition>): Promise<unknown> {
  const { view } = action;
  const queryRemapper = action?.query ?? app.definition.resources[action.resource]?.query?.query;

  const queryParams = remap(queryRemapper, data, internalContext) as QueryParams;

  const parsed = parseQuery(queryParams || {});
  const include = queryParams?.$select?.split(',').map((s) => s.trim());
  const resourceDefinition = getResourceDefinition(app.toJSON(), action.resource, view);

  const resources = await Resource.findAll({
    include: [
      { association: 'Author', attributes: ['id', 'name'], required: false },
      { association: 'Editor', attributes: ['id', 'name'], required: false },
    ],
    order: parsed.order,
    where: {
      [Op.and]: [
        parsed.query,
        {
          type: action.resource,
          AppId: app.id,
          expires: { [Op.or]: [{ [Op.gt]: new Date() }, null] },
        },
      ],
    },
  });

  const mappedResources = resources.map((resource) => resource.toJSON({ include }));

  if (!view) {
    return mappedResources;
  }

  const appMember =
    user && (await AppMember.findOne({ where: { AppId: app.id, UserId: user.id } }));

  const remapperContext = await getRemapperContext(
    app.toJSON(),
    app.definition.defaultLanguage || defaultLocale,
    appMember && {
      sub: user.id,
      name: appMember.name,
      email: appMember.email,
      email_verified: appMember.emailVerified,
      zoneinfo: user.timezone,
    },
    options,
    context,
  );
  return mappedResources.map((resource) =>
    remap(resourceDefinition.views[view].remap, resource, remapperContext),
  );
}
