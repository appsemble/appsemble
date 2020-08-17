import type { RequestAction, RequestLikeAction, RequestLikeActionTypes } from '@appsemble/sdk';
import type { RequestLikeActionDefinition } from '@appsemble/types';
import { formatRequestAction, remapData, validate } from '@appsemble/utils';
import axios, { Method } from 'axios';

import type { MakeActionParameters } from '../../types';
import type { RecursiveValue } from '../extractBlobs';
import { apiUrl, appId } from '../settings';
import { uploadBlobs } from '../uploadBlobs';
import { xmlToJson } from '../xmlToJson';

export function requestLikeAction<T extends RequestLikeActionTypes>({
  definition,
  prefix,
}: MakeActionParameters<RequestLikeActionDefinition<T>>): RequestLikeAction<'request'> {
  const { base, blobs = {}, method = 'GET', proxy = true, schema, url, serialize } = definition;

  return {
    type: 'request',
    async dispatch(data) {
      const methodUpper = method.toUpperCase() as Method;
      const req = proxy
        ? {
            method: methodUpper,
            url: `${apiUrl}/api/apps/${appId}/action/${prefix}`,
          }
        : formatRequestAction(definition, data);

      if (methodUpper === 'PUT' || methodUpper === 'POST' || methodUpper === 'PATCH') {
        let body;

        if (serialize && serialize === 'formdata') {
          const formData = new FormData();

          const processFormData = (key: string, value: Blob | any[] | object | string): void => {
            if (value instanceof Blob) {
              formData.append(key, value);
            } else if (Array.isArray(value)) {
              value.forEach((item) => {
                // Recursively iterate over values
                processFormData(key, item);
              });
            } else if (value instanceof Object) {
              formData.append(key, JSON.stringify(value));
            } else {
              // Primitives
              formData.append(key, value);
            }
          };

          Object.entries(data as object).forEach(([key, value]) => {
            processFormData(key, value);
          });

          body = formData;
        } else {
          switch (blobs.type) {
            case 'upload': {
              body = await uploadBlobs(data as RecursiveValue, blobs);
              break;
            }
            default:
              body = data;
          }
        }

        if (schema) {
          await validate(schema, body);
        }

        req.data = body;
      } else if (proxy) {
        req.params = { data: JSON.stringify(data) };
      }

      const response = await axios(req);
      let responseBody = response.data;
      if (/^(application|text)\/(.+\+)?xml;/.test(response.headers['content-type'])) {
        responseBody = xmlToJson(responseBody, schema);
      }

      if (base) {
        responseBody = remapData(base, responseBody);
      }

      return responseBody;
    },
    method,
    url,
  };
}

export function request(
  args: MakeActionParameters<RequestLikeActionDefinition<'request'>>,
): RequestAction {
  return requestLikeAction(args);
}
