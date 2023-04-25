import { getRemapperContext } from '@appsemble/node-utils/app';
import {
  Remapper,
  RequestLikeActionDefinition,
  ResourceQueryActionDefinition,
} from '@appsemble/types';
import { defaultLocale, formatRequestAction, remap } from '@appsemble/utils';
import axios from 'axios';

import { ServerActionParameters } from './index.js';

export async function request({
  action,
  app,
  context,
  data,
  options,
  user,
}: ServerActionParameters): Promise<any> {
  let method: 'DELETE' | 'GET' | 'POST' | 'PUT';
  const definition = action as RequestLikeActionDefinition;
  const query: Remapper = []
    .concat(
      definition?.query ?? action.type.startsWith('resource.')
        ? app.definition.resources[(action as ResourceQueryActionDefinition).resource]?.query?.query
        : undefined,
    )
    .filter(Boolean);

  if (!(action as RequestLikeActionDefinition).method) {
    switch (action.type) {
      case 'resource.update':
        method = 'PUT';
        break;
      case 'resource.delete':
        method = 'DELETE';
        break;
      case 'resource.create':
        method = 'POST';
        break;
      default:
        method = 'GET';
    }

    if ((action.type === 'resource.get' || action.type === 'resource.query') && action.view) {
      query.push({ 'object.assign': { view: action.view } });
    }
  }

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
  const axiosConfig = formatRequestAction(
    { ...action, query: query.length ? query : undefined, method },
    data,
    (remapper, d) => remap(remapper, d, remapperContext),
    context.context,
  );
  const response = await axios(axiosConfig);

  return response.data;
}
