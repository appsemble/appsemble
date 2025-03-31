import { getRemapperContext } from '@appsemble/node-utils';
import {
  type Remapper,
  type RequestLikeActionDefinition,
  type ResourceQueryActionDefinition,
} from '@appsemble/types';
import { defaultLocale, formatRequestAction, remap } from '@appsemble/utils';
import axios from 'axios';

import { type ServerActionParameters } from './index.js';
import { applyAppServiceSecrets } from '../../options/applyAppServiceSecrets.js';

export async function request({
  action,
  app,
  context,
  data,
  options,
}: ServerActionParameters): Promise<any> {
  let method: 'DELETE' | 'GET' | 'PATCH' | 'POST' | 'PUT';
  const definition = action as RequestLikeActionDefinition;
  const query: Remapper = ([] as any[])
    .concat(
      (definition?.query ?? action.type.startsWith('resource.'))
        ? (app.definition.resources?.[(action as ResourceQueryActionDefinition).resource]?.query
            ?.query ?? null)
        : null,
    )
    .filter(Boolean);
  const requestLikeAction = action as RequestLikeActionDefinition;
  if (requestLikeAction.method === undefined) {
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
  } else {
    method = requestLikeAction.method.toUpperCase() as Uppercase<typeof requestLikeAction.method>;
  }

  const remapperContext = await getRemapperContext(
    app.toJSON(),
    app.definition.defaultLanguage || defaultLocale,
    options,
    context,
  );
  const axiosConfig = formatRequestAction(
    { ...action, query: query.length ? query : null, method },
    data,
    (remapper, d) => remap(remapper, d, remapperContext),
    context.context,
  );
  const newAxiosConfig = await applyAppServiceSecrets({
    app: app.toJSON(),
    context,
    axiosConfig,
  });
  const response = await axios(newAxiosConfig);

  return response.data;
}
