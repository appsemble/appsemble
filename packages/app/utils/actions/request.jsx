import { compileFilters } from '@appsemble/utils/remap';
import validate from '@appsemble/utils/validate';
import axios from 'axios';

import uploadBlobs from '../uploadBlobs';

export default function request({
  definition: { blobs = {}, method = 'GET', schema, query, url },
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
        switch (blobs.type) {
          case 'upload': {
            body = await uploadBlobs(data, blobs);
            break;
          }
          default:
            body = data;
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
