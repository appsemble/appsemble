import { type HTTPMethods } from '@appsemble/types';
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

      if (method === 'PUT' || method === 'POST' || method === 'PATCH') {
        const requestData = body ? remap(body, data, context) : data;
        if (requestData instanceof Blob) {
          req.headers = {
            'Content-Type': requestData.type,
          };
          req.data = requestData;
        } else {
          // Content type inferred from the blob type should be preferred
          // Excluding some common types which should be inferred from BLOB type.
          const contentType = definition.headers?.['Content-Type'];
          if (contentType) {
            Object.assign(req, {
              headers: {
                'Content-Type': definition.headers['Content-Type'],
              },
            });
          }
          req.data = serializeResource(body ? remap(body, data, context) : data);
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
        responseBody = xmlToJson(responseBody, schema);
      }
      return responseBody;
    },
    {
      method,
      url,
    },
  ];
};
