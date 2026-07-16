import { type HTTPMethods } from '@appsemble/lang-sdk';
import { formatRequestAction, serializeResource } from '@appsemble/utils';
import axios, { type RawAxiosRequestConfig } from 'axios';

import { type ActionCreator } from './index.js';
import { apiUrl, appId } from '../settings.js';
import { xmlToJson } from '../xmlToJson.js';

export const request: ActionCreator<'request'> = ({ definition, prefixIndex, remap }) => {
  const { body, method: uncasedMethod = 'GET', proxy = true, schema, url } = definition;
  const method = uncasedMethod.toUpperCase() as HTTPMethods;
  return [
    async (data, context) => {
      const req: RawAxiosRequestConfig = proxy
        ? {
            method,
            url: `${apiUrl}/api/apps/${appId}/actions/${prefixIndex}`,
            responseType: 'arraybuffer',
          }
        : formatRequestAction(definition, data, remap, context);

      if (!proxy && !req.url) {
        return null;
      }

      const isResourceBodyWrite =
        'resource' in definition && (method === 'PUT' || method === 'PATCH');

      if (
        'resource' in definition &&
        (method === 'PUT' || method === 'PATCH' || method === 'DELETE') &&
        data &&
        typeof data === 'object' &&
        !Array.isArray(data) &&
        typeof (data as Record<string, unknown>).$etag === 'string'
      ) {
        req.headers = {
          ...req.headers,
          'If-Match': (data as Record<string, unknown>).$etag as string,
        };
      }

      // $etag is transport metadata, not part of the resource. Strip it before
      // the body is built so it does not end up persisted as resource.data.
      const stripEtag = (value: unknown): unknown => {
        if (
          value &&
          typeof value === 'object' &&
          !Array.isArray(value) &&
          !(value instanceof Blob) &&
          !(value instanceof Date) &&
          '$etag' in (value as Record<string, unknown>)
        ) {
          const { $etag, ...rest } = value as Record<string, unknown>;
          return rest;
        }
        return value;
      };

      if (method === 'PUT' || method === 'POST' || method === 'PATCH') {
        const remappedBody = body ? remap(body, data, context) : data;
        const requestData = isResourceBodyWrite ? stripEtag(remappedBody) : remappedBody;
        if (requestData instanceof Blob) {
          req.headers = {
            ...req.headers,
            'Content-Type': requestData.type,
          };
          req.data = requestData;
        } else {
          // Content type inferred from the blob type should be preferred
          // Excluding some common types which should be inferred from BLOB type.
          const contentType = definition.headers?.['Content-Type'];
          if (contentType) {
            req.headers = {
              ...req.headers,
              'Content-Type': contentType,
            };
          }
          req.data = serializeResource(requestData);
        }
      } else if (method === 'DELETE' && body) {
        req.data = remap(body, data, context);
      } else if (proxy) {
        req.params = { data: JSON.stringify(data) };
      }

      if (proxy && definition.query) {
        req.params ??= {};
        Object.assign(req.params, {
          params: JSON.stringify(remap(definition.query, data, context)),
        });
      }

      if (
        typeof definition.query === 'string' ||
        typeof definition.query === 'number' ||
        typeof definition.query === 'boolean'
      ) {
        req.url = `${req.url}/${definition.query}`;
        req.params = null;
      }

      // Intended behavior
      // nosemgrep: nodejs_scan.javascript-ssrf-rule-node_ssrf
      const response = await axios(req);
      let responseBody = response.data;
      // Check if it's safe to represent the response as a string (i.e. not a binary file)
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

      if (
        'resource' in definition &&
        response.headers.etag &&
        responseBody &&
        typeof responseBody === 'object' &&
        !Array.isArray(responseBody) &&
        !(responseBody instanceof Blob)
      ) {
        responseBody = {
          ...responseBody,
          $etag: response.headers.etag,
        };
      }

      return responseBody;
    },
    {
      method,
      // This is required for `request` actions, but not for `resource` actions. Because they
      // "inherit" from request actions (actually RequestLike). Odd stuff.
      url: url!,
    },
  ];
};
