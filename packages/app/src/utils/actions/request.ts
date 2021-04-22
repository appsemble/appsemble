import { HTTPMethods } from '@appsemble/sdk';
import { formatRequestAction } from '@appsemble/utils';
import axios from 'axios';

import { ActionCreator } from '.';
import { serializeResource } from '../serializers';
import { apiUrl, appId } from '../settings';
import { xmlToJson } from '../xmlToJson';

export const request: ActionCreator<'request'> = ({ definition, prefix, remap }) => {
  const { body, method: uncasedMethod = 'GET', proxy = true, schema, url } = definition;
  const method = uncasedMethod.toUpperCase() as HTTPMethods;

  return [
    async (data) => {
      const req = proxy
        ? {
            method,
            url: `${apiUrl}/api/apps/${appId}/action/${prefix}`,
          }
        : formatRequestAction(definition, data, remap);

      if (method === 'PUT' || method === 'POST' || method === 'PATCH') {
        req.data = serializeResource(body ? remap(body, data) : data);
      } else if (proxy) {
        req.params = { data: JSON.stringify(data) };
      }

      const response = await axios(req);
      let responseBody = response.data;
      if (/^(application|text)\/(.+\+)?xml/.test(response.headers['content-type'])) {
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
