import { getRemapperContext } from '@appsemble/node-utils';
import {
  type Remapper,
  type RequestLikeActionDefinition,
  type ResourceQueryActionDefinition,
} from '@appsemble/types';
import { defaultLocale, formatRequestAction, remap } from '@appsemble/utils';
import axios from 'axios';

import { type ServerActionParameters } from './index.js';

export async function request({
  action,
  app,
  context,
  data,
  options,
}: ServerActionParameters): Promise<any> {
  let method: 'DELETE' | 'GET' | 'PATCH' | 'POST' | 'PUT';
  const definition = action as RequestLikeActionDefinition;
  const query: Remapper = []
    .concat(
      (definition?.query ?? action.type.startsWith('resource.'))
        ? app.definition.resources[(action as ResourceQueryActionDefinition).resource]?.query?.query
        : undefined,
    )
    .filter(Boolean);

  if (!(action as RequestLikeActionDefinition).method) {
    switch (action.type) {
      case 'resource.update':
        method = 'PUT';
        break;
      case 'resource.patch':
        method = 'PATCH';
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
