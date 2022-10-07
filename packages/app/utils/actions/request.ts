import { HTTPMethods } from '@appsemble/types';
import { formatRequestAction, has } from '@appsemble/utils';
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

      const response = await axios(req);
      let responseBody = response.data;
      if (
        typeof responseBody === 'string' &&
        /^(application|text)\/(.+\+)?xml/.test(response.headers['content-type'])
      ) {
        responseBody = xmlToJson(responseBody, schema);
      }

      if (has(definition, 'prior')) {
        if (!Array.isArray(responseBody)) {
          return { ...responseBody, ...remap(definition.prior, data, context) };
        }
        if (responseBody.length <= 1) {
          return { ...responseBody[0], ...remap(definition.prior, data, context) };
        }
      }

      return responseBody;
    },
    {
      method,
      url,
    },
  ];
};
