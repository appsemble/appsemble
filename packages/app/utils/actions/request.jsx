import { compileFilters, validate } from '@appsemble/utils';
import axios from 'axios';

import uploadBlobs from '../uploadBlobs';

export default function request({
  definition: { blobs = {}, method = 'GET', schema, query, url, serialize },
  onSuccess,
  onError,
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
          const formData = new FormData();

          const processFormData = (form, key, value) => {
            if (value instanceof Blob) {
              form.append(key, value);
            } else if (Array.isArray(value)) {
              value.forEach(item => {
                // Recursively iterate over values
                processFormData(form, key, item);
              });
            } else if (value instanceof Object) {
              form.append(key, JSON.stringify(value));
            } else {
              // Primitives
              form.append(key, value);
            }
          };

          Object.entries(data).forEach(([key, value]) => {
            processFormData(formData, key, value);
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
