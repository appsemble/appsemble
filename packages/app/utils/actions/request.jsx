import { compileFilters } from '@appsemble/utils/remap';
import validate from '@appsemble/utils/validate';
import axios from 'axios';

import uploadBlobs from '../uploadBlobs';

export default function request({
  definition: { blobs = {}, method = 'GET', schema, query, url, serialize },
}) {
  const regex = /{(.+?)}/g;
  const mappers = url
    .match(regex)
    ?.map(match => match.substring(1, match.length - 1))
    .reduce((acc, filter) => {
      acc[filter] = compileFilters(filter);
      return acc;
    }, {});

  return {
    async dispatch(data) {
      const methodUpper = method.toUpperCase();
      const req = {
        method: methodUpper,
        url: url.replace(regex, (match, filter) => mappers[filter](data)),
        params: methodUpper === 'GET' ? { ...query, ...data } : query,
      };

      if (methodUpper === 'PUT' || methodUpper === 'POST' || methodUpper === 'PATCH') {
        let body;

        if (serialize && serialize === 'formdata') {
          const form = new FormData();
          Object.entries(data).forEach((key, value) => {
            switch (typeof value) {
              case 'object': {
                switch (value.constructor.name) {
                  case 'Array': {
                    value.forEach(item => form.append(key, item));
                    break;
                  }
                  case 'Date':
                    form.set(key, String(value));
                    break;
                  case 'Blob':
                  case 'ArrayBuffer':
                  case 'File':
                    form.set(key, value);
                    break;
                  default:
                    form.set(key, JSON.stringify(value));
                }
                break;
              }
              case 'boolean':
              case 'string':
              case 'number':
              case 'symbol':
              default:
                form.set(key, String(value));
            }
          });

          body = form;
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

      const response = await axios(req);
      return response.data;
    },
    method,
    url,
  };
}
