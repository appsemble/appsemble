import { defaultLocale, remap } from '@appsemble/lang-sdk';
import { getRemapperContext } from '@appsemble/node-utils';
import {
  type Remapper,
  type RequestLikeActionDefinition,
  type ResourceQueryActionDefinition,
} from '@appsemble/types';
import { formatRequestAction } from '@appsemble/utils';
import axios from 'axios';

import { type ServerActionParameters } from './index.js';
import { applyAppServiceSecrets } from '../../options/applyAppServiceSecrets.js';

export async function request({
  action,
  app,
  context,
  data,
  internalContext,
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

  Object.assign(remapperContext, {
    history: internalContext?.history ?? [],
  });

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

  let responseBody = response.data;
  // Check if it's safe to represent the response as a string (i.e. not a binary file)
  if (responseBody instanceof Buffer) {
    // Convert to ArrayBuffer instead
    responseBody = responseBody.buffer.slice(
      responseBody.byteOffset,
      responseBody.byteOffset + responseBody.byteLength,
    );
  }
  if (responseBody instanceof ArrayBuffer) {
    try {
      const view = new Uint8Array(responseBody);
      const text = new TextDecoder('utf8').decode(responseBody);
      const arrayBuffer = new TextEncoder().encode(text);
      responseBody =
        arrayBuffer.byteLength === responseBody.byteLength &&
        arrayBuffer.every((byte, index) => byte === view[index])
          ? text
          : new Blob([responseBody], { type: response.headers['content-type'] });
    } catch {
      responseBody = new Blob([responseBody], { type: response.headers['content-type'] });
    }
  }

  if (
    typeof responseBody === 'string' &&
    /^application\/json/.test(response.headers['content-type'])
  ) {
    try {
      responseBody = JSON.parse(responseBody);
    } catch {
      // Do nothing
    }
  }

  if (
    typeof responseBody === 'string' &&
    /^(application|text)\/(.+\+)?xml/.test(response.headers['content-type'])
  ) {
    // @ts-expect-error 2345 argument of type is not assignable to parameter of type
    // (strictNullChecks)
    responseBody = xmlToJson(responseBody, schema);
  }
  return responseBody;
}
