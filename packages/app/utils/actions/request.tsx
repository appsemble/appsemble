import {
  HTTPMethodsUpper,
  RequestAction,
  RequestLikeAction,
  RequestLikeActionDefinition,
  RequestLikeActionTypes,
} from '@appsemble/types';
import { compileFilters, MapperFunction, remapData, validate } from '@appsemble/utils';
import axios, { AxiosRequestConfig } from 'axios';

import { MakeActionParameters } from '../../types';
import uploadBlobs from '../uploadBlobs';
import xmlToJson from '../xmlToJson';

export function requestLikeAction<T extends RequestLikeActionTypes>({
  definition: { base, blobs = {}, method = 'GET', schema, query, url, serialize },
  onSuccess,
  onError,
}: MakeActionParameters<RequestLikeActionDefinition<T>>): RequestLikeAction<'request'> {
  const regex = /{(.+?)}/g;
  const urlMatch = url.match(regex);
  const mappers =
    urlMatch &&
    urlMatch
      .map(match => match.substring(1, match.length - 1))
      .reduce<Record<string, MapperFunction>>((acc, filter) => {
        acc[filter] = compileFilters(filter);
        return acc;
      }, {});

  return {
    type: 'request',
    async dispatch(data) {
      const methodUpper = method.toUpperCase() as HTTPMethodsUpper;
      const req: AxiosRequestConfig = {
        method: methodUpper,
        url: url.replace(regex, (_match, filter) => mappers[filter](data)),
        params: methodUpper === 'GET' ? { ...query, ...data } : query,
      };

      if (methodUpper === 'PUT' || methodUpper === 'POST' || methodUpper === 'PATCH') {
        let body;

        if (serialize && serialize === 'formdata') {
          const formData = new FormData();

          const processFormData = (key: string, value: Blob | any[] | object | string): void => {
            if (value instanceof Blob) {
              formData.append(key, value);
            } else if (Array.isArray(value)) {
              value.forEach(item => {
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
              body = await uploadBlobs(data, blobs);
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
      }

      try {
        const response = await axios(req);
        const contentType = response.headers['content-type'];

        if (['text/xml', 'application/xml'].includes(contentType)) {
          const parser = new DOMParser();
          const xml = parser.parseFromString(response.data, contentType);
          response.data = xmlToJson(xml);
        }

        if (base) {
          response.data = remapData(base, response.data);
        }

        if (onSuccess) {
          return onSuccess.dispatch(response.data);
        }

        return response.data;
      } catch (exception) {
        if (onError) {
          return onError.dispatch(exception);
        }

        throw exception;
      }
    },
    method,
    url,
  };
}

export default function request(
  args: MakeActionParameters<RequestLikeActionDefinition<'request'>>,
): RequestAction {
  return requestLikeAction(args);
}
