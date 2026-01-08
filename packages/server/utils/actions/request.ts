import {
  defaultLocale,
  remap,
  type Remapper,
  type RequestLikeActionDefinition,
  type ResourceQueryActionDefinition,
} from '@appsemble/lang-sdk';
import { getRemapperContext, logger } from '@appsemble/node-utils';
import { formatRequestAction } from '@appsemble/utils';
import axios from 'axios';
import { RequestFilteringHttpAgent, RequestFilteringHttpsAgent } from 'request-filtering-agent';

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

  // Apply SSRF protection
  // This blocks requests to private IPs, localhost, link-local addresses,
  // and hostnames that resolve to private IPs (prevents DNS rebinding attacks)
  //
  // VITEST_CONF_ALLOW_PRIVATE_IP_PROXY: Test-only env var set in vitest.setup.ts
  // to allow proxy tests to use localhost servers. SSRF tests explicitly unset this.
  // This env var should NEVER be set in production.
  const allowPrivateIPAddress = process.env.VITEST_CONF_ALLOW_PRIVATE_IP_PROXY === '1';

  // Preserve any existing agent options (e.g., client certs from applyAppServiceSecrets)
  // while still applying SSRF protection
  const existingHttpsOptions = newAxiosConfig.httpsAgent?.options ?? {};
  const existingHttpOptions = newAxiosConfig.httpAgent?.options ?? {};

  newAxiosConfig.httpAgent = new RequestFilteringHttpAgent({
    ...existingHttpOptions,
    allowPrivateIPAddress,
  });
  newAxiosConfig.httpsAgent = new RequestFilteringHttpsAgent({
    ...existingHttpsOptions,
    allowPrivateIPAddress,
  });

  let response;
  try {
    response = await axios(newAxiosConfig);
  } catch (err: unknown) {
    // Check if this is an SSRF block from request-filtering-agent
    const errorMessage = err instanceof Error ? err.message : String(err);
    if (errorMessage.includes('is not allowed') || errorMessage.includes('private')) {
      logger.warn(`SSRF blocked: ${errorMessage}`);
      throw new Error('Access to private network addresses is not allowed');
    }
    throw err;
  }

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
