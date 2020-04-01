import type {
  HTTPMethodsUpper,
  RequestAction,
  RequestLikeAction,
  RequestLikeActionTypes,
} from '@appsemble/sdk';
import type { RequestLikeActionDefinition } from '@appsemble/types';
import { compileFilters, MapperFunction, remapData, validate } from '@appsemble/utils';
import axios, { AxiosRequestConfig } from 'axios';

import type { MakeActionParameters } from '../../types';
import uploadBlobs from '../uploadBlobs';
import xmlToJson from '../xmlToJson';

interface Mapper {
  [filter: string]: MapperFunction;
}

export function requestLikeAction<T extends RequestLikeActionTypes>({
  definition: { base, blobs = {}, method = 'GET', schema, query, url, serialize },
  onSuccess,
  onError,
}: MakeActionParameters<RequestLikeActionDefinition<T>>): RequestLikeAction<'request'> {
  const regex = /{(.+?)}/g;
  const urlMatch = url.match(regex);
  const urlMappers = urlMatch
    ?.map((match) => match.substring(1, match.length - 1))
    .reduce<Mapper>((acc, filter) => ({ ...acc, [filter]: compileFilters(filter) }), {});

  const queryMappers =
    query &&
    Object.entries(query).reduce<{ [k: string]: Mapper }>((acc, [queryKey, queryValue]) => {
      const queryMatch = String(queryValue).match(regex);
      if (queryMatch) {
        acc[queryKey] = queryMatch
          .map((match) => match.substring(1, match.length - 1))
          .reduce((subAcc, filter) => ({ ...subAcc, [filter]: compileFilters(filter) }), {});
      }
      return acc;
    }, {});

  return {
    type: 'request',
    async dispatch(data) {
      const methodUpper = method.toUpperCase() as HTTPMethodsUpper;
      const req: AxiosRequestConfig = {
        method: methodUpper,
        url: url.replace(regex, (_, filter) => urlMappers[filter](data)),
        params:
          query &&
          Object.fromEntries(
            Object.entries(query).map(([key, value]) => {
              if (!queryMappers[key]) {
                return [key, value];
              }

              return [
                key,
                queryMappers[key]
                  ? value.replace(regex, (_, filter) => queryMappers[key][filter](data))
                  : value,
              ];
            }),
          ),
      };

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
        let responseBody = response.data;
        if (/^(application|text)\/(.+\+)?xml;/.test(response.headers['content-type'])) {
          responseBody = xmlToJson(responseBody, schema);
        }

        if (base) {
          responseBody = remapData(base, responseBody);
        }

        if (onSuccess) {
          return onSuccess.dispatch(responseBody);
        }

        return responseBody;
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
