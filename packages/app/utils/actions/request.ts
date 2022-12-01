import { HTTPMethods } from '@appsemble/types';
import { formatRequestAction } from '@appsemble/utils';
import { serializeResource } from '@appsemble/web-utils';
import axios from 'axios';

import { apiUrl, appId } from '../settings.js';
import { xmlToJson } from '../xmlToJson.js';
import { ActionCreator } from './index.js';

export const request: ActionCreator<'request'> = ({ definition, prefixIndex, remap }) => {
  const { body, method: uncasedMethod = 'GET', proxy = true, schema, url } = definition;
  const method = uncasedMethod.toUpperCase() as HTTPMethods;
  return [
    async (data, context) => {
      const req = proxy
        ? {
            method,
            url: `${apiUrl}/api/apps/${appId}/action/${prefixIndex}`,
          }
        : formatRequestAction(definition, data, remap, context);
      if (method === 'PUT' || method === 'POST' || method === 'PATCH') {
        req.data = serializeResource(body ? remap(body, data, context) : data);
      } else if (proxy) {
        req.params = { data: JSON.stringify(data) };
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
